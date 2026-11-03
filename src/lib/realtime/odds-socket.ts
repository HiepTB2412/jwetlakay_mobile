import { AppState, type NativeEventSubscription } from "react-native";

import { apiRequest } from "@/lib/api/client";
import { getOddsWsUrl, socketSigning } from "@/lib/config";
import { hmacSha256Hex, serverHmacKey } from "@/lib/crypto/hmac";
import { tokenStore } from "@/lib/session/token-store";

// Odds WebSocket (web lib/wsClient.ts + hooks/useOddsSocket.ts, spec Phần A §0, Phần C §0.3-0.4).
// One connection for the whole app, opened at launch and never closed. Screens hold rooms
// through `acquire`; the socket replays them after every reconnect.

export type RoomType = "odds" | "match" | "score" | "settlement";

/** A server push for one match, after sequence gating. Payload shapes belong to the sportsbook store. */
export type OddsSocketMessage = {
  type: "odds" | "match" | "score";
  matchId: string | number;
  seq?: number;
  /** "delta" on incremental odds; absent on snapshots. */
  mode?: "delta";
  [field: string]: unknown;
};

export type OddsSocketStatus = {
  connected: boolean;
  /** Feed behind (heartbeat) or socket down for 5s: LIVE betting must be locked. */
  liveFeedStale: boolean;
};

const PING_MS = 25_000;
/** The server allows 200 rooms per connection; keep headroom. */
const MAX_ROOMS = 190;
const ROOM_LIMIT_SETTLE_MS = 300;
/** Leaving a screen keeps its rooms this long, so quick back-and-forth does not churn. */
const UNSUB_DELAY_MS = 10_000;
const DISCONNECT_STALE_MS = 5_000;
const MAX_BACKOFF_MS = 30_000;

type Room = {
  type: RoomType;
  matchId: string;
  refs: number;
  priorityRefs: number;
  unsubTimer: ReturnType<typeof setTimeout> | null;
};

type Signature = { clientId: string; ts: number; sig: string };

// [WEB-PARITY] Handshake signature, same two paths as web-client src/apis/sportsbook/socketSignature.ts.
// Signatures live 30s, so this runs before every connect and reconnect.

/**
 * Fallback: sign in the app with EXPO_PUBLIC_SOCKET_SECRET (the web's `tuKy`). No secret → null,
 * i.e. connect unsigned. The web warns this secret is shared by web-prod/ios-prod/android-prod;
 * its production build leaves it empty and relies on the endpoint.
 */
function selfSign(): Signature | null {
  const { clientId, secret } = socketSigning;
  if (!secret) return null;
  const ts = Date.now();
  return { clientId, ts, sig: hmacSha256Hex(`${clientId}:${ts}`, serverHmacKey(secret)) };
}

/**
 * Main path: ask sport-api for a signature (the request itself carries the REST signature).
 * If that request fails, fall back to `selfSign`, as the web does.
 *
 * [WEB-PARITY] Parsing is the web's, byte for byte: `result ?? data ?? body`. Note that a
 * `{ result: null }` envelope therefore falls through to the envelope itself and throws (→ the
 * socket retries with backoff), although the web's comment and spec Phần C §0.3 say null means
 * "connect unsigned". Only a literally empty body connects unsigned. Kept to match the web.
 */
async function getSocketSignature(): Promise<Signature | null> {
  const { signatureUrl } = socketSigning;
  if (!signatureUrl) return selfSign();

  let body: { result?: unknown; data?: unknown } | null | undefined;
  try {
    body = await apiRequest<unknown>(signatureUrl);
  } catch (error) {
    if (__DEV__) console.warn(`[odds-ws] signature endpoint failed, using fallback: ${error instanceof Error ? error.message : error}`);
    return selfSign();
  }

  const d = (body?.result ?? body?.data ?? body) as { clientId?: string; ts?: string | number; sig?: string } | null | undefined;
  if (d == null) return null;
  if (d.clientId && d.ts && d.sig) {
    return { clientId: d.clientId, ts: Number(d.ts), sig: d.sig };
  }
  throw new Error("Socket signature endpoint returned an unexpected payload");
}

const roomKey = (type: RoomType, matchId: string) => `${type}:${matchId}`;

export class OddsSocket {
  private socket: WebSocket | null = null;
  private started = false;
  private connecting = false;
  private attempt = 0;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private pingTimer: ReturnType<typeof setInterval> | null = null;
  private appStateSubscription: NativeEventSubscription | null = null;

  private readonly rooms = new Map<string, Room>();
  /** Rooms the server holds, oldest first. */
  private active: string[] = [];
  private queued: string[] = [];
  private budget: number;
  private roomLimitErrors = 0;
  private roomLimitTimer: ReturnType<typeof setTimeout> | null = null;

  private readonly lastSeq = new Map<string, number>();
  private readonly messageListeners = new Set<(message: OddsSocketMessage) => void>();

  private status: OddsSocketStatus = { connected: false, liveFeedStale: false };
  private readonly statusListeners = new Set<() => void>();
  private heartbeatStale = false;
  private disconnectStale = false;
  private disconnectTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly maxRooms = MAX_ROOMS) {
    this.budget = maxRooms;
  }

  // ---- Lifecycle ----------------------------------------------------------------------------

  /** Idempotent. Does nothing when EXPO_PUBLIC_ODDS_WS_URL is unset. */
  start(): void {
    if (this.started || !getOddsWsUrl()) return;
    this.started = true;
    this.armDisconnectTimer();
    // The OS drops sockets in the background; come back without waiting for the backoff.
    this.appStateSubscription = AppState.addEventListener("change", (state) => {
      if (state === "active") this.reconnectNow();
    });
    void this.connect();
  }

  /** Tears everything down (tests, or a future "disable live odds" switch). */
  stop(): void {
    this.started = false;
    this.appStateSubscription?.remove();
    this.appStateSubscription = null;
    this.clearTimer("reconnectTimer");
    this.clearTimer("disconnectTimer");
    this.clearTimer("roomLimitTimer");
    this.stopPing();
    const socket = this.socket;
    this.socket = null;
    socket?.close();
    this.rooms.forEach((room) => room.unsubTimer && clearTimeout(room.unsubTimer));
    this.rooms.clear();
    this.active = [];
    this.queued = [];
    this.heartbeatStale = false;
    this.disconnectStale = false;
    this.updateStatus(false);
  }

  /** Reconnects immediately if the socket is down. */
  reconnectNow(): void {
    const alive = this.socket != null && this.socket.readyState <= WebSocket.OPEN;
    if (!this.started || this.connecting || alive) return;
    this.clearTimer("reconnectTimer");
    this.attempt = 0;
    void this.connect();
  }

  private isOpen(): boolean {
    return this.socket?.readyState === WebSocket.OPEN;
  }

  private async connect(): Promise<void> {
    const base = getOddsWsUrl();
    if (!this.started || !base) return;
    this.connecting = true;

    let url: string;
    try {
      const signature = await getSocketSignature();
      const target = new URL(base);
      if (signature) {
        target.searchParams.set("clientId", signature.clientId);
        target.searchParams.set("ts", String(signature.ts));
        target.searchParams.set("sig", signature.sig);
      }
      const token = tokenStore.getAccessToken();
      if (token) target.searchParams.set("token", token);
      url = target.toString();
    } catch (error) {
      this.connecting = false;
      if (__DEV__) console.warn(`[odds-ws] signature failed: ${error instanceof Error ? error.message : error}`);
      this.scheduleReconnect();
      return;
    }
    if (!this.started) {
      this.connecting = false;
      return;
    }

    const socket = new WebSocket(url);
    this.socket = socket;
    this.connecting = false;

    socket.onopen = () => {
      if (this.socket !== socket) return;
      this.attempt = 0;
      this.lastSeq.clear();
      this.replayRooms();
      this.startPing();
      this.updateStatus(true);
    };
    socket.onmessage = (event) => {
      if (this.socket === socket) this.handleMessage(event.data);
    };
    socket.onclose = () => {
      if (this.socket !== socket) return;
      this.socket = null;
      this.stopPing();
      this.updateStatus(false);
      this.scheduleReconnect();
    };
    // onerror is always followed by onclose, which does the cleanup.
    socket.onerror = () => {};
  }

  private scheduleReconnect(): void {
    if (!this.started || this.reconnectTimer) return;
    const delay = Math.min(1000 * 2 ** this.attempt, MAX_BACKOFF_MS) * (0.5 + Math.random() * 0.5);
    this.attempt += 1;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      void this.connect();
    }, delay);
  }

  private startPing(): void {
    this.stopPing();
    this.pingTimer = setInterval(() => this.send({ op: "ping" }), PING_MS);
  }

  private stopPing(): void {
    if (this.pingTimer) clearInterval(this.pingTimer);
    this.pingTimer = null;
  }

  private send(payload: Record<string, unknown>): void {
    if (this.isOpen()) this.socket!.send(JSON.stringify(payload));
  }

  private clearTimer(name: "reconnectTimer" | "disconnectTimer" | "roomLimitTimer"): void {
    const timer = this[name];
    if (timer) clearTimeout(timer);
    this[name] = null;
  }

  // ---- Rooms --------------------------------------------------------------------------------

  /**
   * Holds a room until the returned release is called. The first holder subscribes; when the
   * last one releases, the unsubscribe waits 10s in case a screen takes it again.
   * Priority rooms (match detail, Bet Slip) displace ordinary ones when the budget is full.
   */
  acquire(type: RoomType, matchId: string | number, priority = false): () => void {
    const id = String(matchId);
    const key = roomKey(type, id);
    let room = this.rooms.get(key);
    if (!room) {
      room = { type, matchId: id, refs: 0, priorityRefs: 0, unsubTimer: null };
      this.rooms.set(key, room);
      this.queued.push(key);
    }
    if (room.unsubTimer) {
      clearTimeout(room.unsubTimer);
      room.unsubTimer = null;
    }
    room.refs += 1;
    if (priority) room.priorityRefs += 1;
    this.pump();

    let released = false;
    return () => {
      if (released) return;
      released = true;
      this.release(key, priority);
    };
  }

  private release(key: string, priority: boolean): void {
    const room = this.rooms.get(key);
    if (!room) return;
    room.refs -= 1;
    if (priority) room.priorityRefs -= 1;
    if (room.refs > 0) return;
    room.unsubTimer = setTimeout(() => this.dropRoom(key), UNSUB_DELAY_MS);
  }

  private dropRoom(key: string): void {
    const room = this.rooms.get(key);
    if (!room) return;
    this.rooms.delete(key);
    this.queued = this.queued.filter((k) => k !== key);
    if (this.active.includes(key)) {
      this.active = this.active.filter((k) => k !== key);
      this.send({ op: "unsub", type: room.type, matchId: room.matchId });
    }
    this.pump();
  }

  private isPriority(key: string): boolean {
    return (this.rooms.get(key)?.priorityRefs ?? 0) > 0;
  }

  private subscribe(key: string): void {
    const room = this.rooms.get(key)!;
    this.active.push(key);
    this.send({ op: "sub", type: room.type, matchId: room.matchId });
  }

  /** Moves queued rooms onto the connection, priority first, evicting ordinary rooms if needed. */
  private pump(): void {
    if (!this.isOpen()) return;
    // Stable sort keeps arrival order inside each group.
    this.queued.sort((a, b) => Number(this.isPriority(b)) - Number(this.isPriority(a)));

    while (this.queued.length > 0) {
      const next = this.queued[0];
      if (this.active.length < this.budget) {
        this.queued.shift();
        this.subscribe(next);
        continue;
      }
      if (!this.isPriority(next)) break;
      const victim = this.active.find((k) => !this.isPriority(k));
      if (!victim) break;
      const room = this.rooms.get(victim)!;
      this.active = this.active.filter((k) => k !== victim);
      this.send({ op: "unsub", type: room.type, matchId: room.matchId });
      this.queued.shift();
      this.queued.push(victim);
      this.subscribe(next);
    }
  }

  private replayRooms(): void {
    this.budget = this.maxRooms;
    this.queued = [...this.active, ...this.queued.filter((k) => !this.active.includes(k))];
    this.active = [];
    this.pump();
  }

  /** Batches `too_many_rooms` errors, then hands back the rooms the server refused. */
  private handleRoomLimit(): void {
    this.roomLimitErrors += 1;
    if (this.roomLimitTimer) return;
    this.roomLimitTimer = setTimeout(() => {
      this.roomLimitTimer = null;
      const refused = this.active.splice(Math.max(0, this.active.length - this.roomLimitErrors));
      this.roomLimitErrors = 0;
      this.queued = [...refused, ...this.queued];
      this.budget = this.active.length;
      this.pump();
    }, ROOM_LIMIT_SETTLE_MS);
  }

  // ---- Incoming -----------------------------------------------------------------------------

  addMessageListener(listener: (message: OddsSocketMessage) => void): () => void {
    this.messageListeners.add(listener);
    return () => this.messageListeners.delete(listener);
  }

  private handleMessage(raw: unknown): void {
    if (typeof raw !== "string") return;
    let message: Record<string, unknown>;
    try {
      message = JSON.parse(raw);
    } catch {
      return;
    }

    if (message.error === "too_many_rooms") {
      this.handleRoomLimit();
      return;
    }
    switch (message.type) {
      case "odds":
      case "match":
      case "score":
        if (this.accept(message as OddsSocketMessage)) {
          this.messageListeners.forEach((listener) => listener(message as OddsSocketMessage));
        }
        return;
      case "heartbeat":
        this.heartbeatStale = message.feedStale === true;
        this.updateStatus(this.status.connected);
        return;
      default:
        // pong, auth, other errors: nothing to do.
        return;
    }
  }

  /** Sequence gate per `type:matchId`; a gap in odds deltas asks for a resync. */
  private accept(message: OddsSocketMessage): boolean {
    if (typeof message.seq !== "number") return true;
    const key = `${message.type}:${message.matchId}`;
    const previous = this.lastSeq.get(key);
    const isDelta = message.type === "odds" && message.mode === "delta";

    if (!isDelta) {
      if (previous !== undefined && message.seq < previous) return false;
    } else if (previous !== undefined) {
      if (message.seq <= previous) return false;
      if (message.seq > previous + 1) {
        this.send({ op: "resync", type: message.type, matchId: message.matchId });
      }
    }
    this.lastSeq.set(key, message.seq);
    return true;
  }

  // ---- Status -------------------------------------------------------------------------------

  getStatus = (): OddsSocketStatus => this.status;

  subscribeStatus = (listener: () => void): (() => void) => {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  };

  private armDisconnectTimer(): void {
    if (this.disconnectTimer) return;
    this.disconnectTimer = setTimeout(() => {
      this.disconnectTimer = null;
      this.disconnectStale = true;
      this.updateStatus(this.status.connected);
    }, DISCONNECT_STALE_MS);
  }

  private updateStatus(connected: boolean): void {
    if (connected) {
      this.clearTimer("disconnectTimer");
      this.disconnectStale = false;
    } else if (this.started && !this.disconnectStale) {
      this.armDisconnectTimer();
    }
    const liveFeedStale = this.heartbeatStale || this.disconnectStale;
    if (connected === this.status.connected && liveFeedStale === this.status.liveFeedStale) return;
    this.status = { connected, liveFeedStale };
    this.statusListeners.forEach((listener) => listener());
  }
}

export const oddsSocket = new OddsSocket();
