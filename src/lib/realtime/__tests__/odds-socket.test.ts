import { afterEach, beforeEach, describe, expect, it, jest } from "@jest/globals";

import { hmacSha256Hex } from "@/lib/crypto/hmac";
import { OddsSocket } from "@/lib/realtime/odds-socket";

// `body` overrides the whole response (e.g. an empty body); otherwise `value` is the envelope result.
const mockSignature = {
  value: { clientId: "mobile", ts: 1700000000000, sig: "abc" } as unknown,
  fail: false,
  body: "envelope" as unknown,
};
const mockSocketSigning = { signatureUrl: "/core-read/v1/web/socket-signature", clientId: "web-prod", secret: "" };
jest.mock("@/lib/api/client", () => ({
  apiRequest: async () => {
    if (mockSignature.fail) throw new Error("offline");
    if (mockSignature.body !== "envelope") return mockSignature.body;
    return { requestId: "r", errorCode: "00000", message: "OK", result: mockSignature.value };
  },
}));
// Getter: jest.mock is hoisted above the `mock*` constants, so read them lazily.
jest.mock("@/lib/config", () => ({
  getOddsWsUrl: () => "wss://odds.test/ws",
  get socketSigning() {
    return mockSocketSigning;
  },
}));
jest.mock("@/lib/session/token-store", () => ({ tokenStore: { getAccessToken: () => "jwt" } }));

class FakeSocket {
  static CONNECTING = 0;
  static OPEN = 1;
  static CLOSING = 2;
  static CLOSED = 3;
  static instances: FakeSocket[] = [];

  readyState = FakeSocket.CONNECTING;
  sent: Record<string, unknown>[] = [];
  onopen: (() => void) | null = null;
  onmessage: ((event: { data: unknown }) => void) | null = null;
  onclose: (() => void) | null = null;
  onerror: (() => void) | null = null;

  constructor(readonly url: string) {
    FakeSocket.instances.push(this);
  }
  send(data: string) {
    this.sent.push(JSON.parse(data));
  }
  close() {
    this.readyState = FakeSocket.CLOSED;
  }
  open() {
    this.readyState = FakeSocket.OPEN;
    this.onopen?.();
  }
  drop() {
    this.readyState = FakeSocket.CLOSED;
    this.onclose?.();
  }
  push(message: unknown) {
    this.onmessage?.({ data: JSON.stringify(message) });
  }
  ops(op: string) {
    return this.sent.filter((m) => m.op === op).map((m) => `${m.type}:${m.matchId}`);
  }
}

// Lets the async signature fetch settle under fake timers.
const flush = () => jest.advanceTimersByTimeAsync(0);
const latest = () => FakeSocket.instances[FakeSocket.instances.length - 1];

async function startOpen(socket: OddsSocket) {
  socket.start();
  await flush();
  latest().open();
  return latest();
}

let client: OddsSocket;

beforeEach(() => {
  jest.useFakeTimers();
  FakeSocket.instances = [];
  (globalThis as { WebSocket: unknown }).WebSocket = FakeSocket;
  mockSignature.value = { clientId: "mobile", ts: 1700000000000, sig: "abc" };
  mockSignature.fail = false;
  mockSignature.body = "envelope";
  mockSocketSigning.signatureUrl = "/core-read/v1/web/socket-signature";
  mockSocketSigning.secret = "";
  client = new OddsSocket(3);
});

afterEach(() => {
  client.stop();
  jest.useRealTimers();
});

describe("connect", () => {
  it("connects with the server signature and token", async () => {
    const ws = await startOpen(client);
    const url = new URL(ws.url);
    expect(url.searchParams.get("clientId")).toBe("mobile");
    expect(url.searchParams.get("ts")).toBe("1700000000000");
    expect(url.searchParams.get("sig")).toBe("abc");
    expect(url.searchParams.get("token")).toBe("jwt");
    expect(client.getStatus().connected).toBe(true);
  });

  it("connects without a signature only when the body is empty (web parsing)", async () => {
    mockSignature.body = null;
    const ws = await startOpen(client);
    expect(new URL(ws.url).searchParams.has("sig")).toBe(false);
  });

  it("treats { result: null } as a bad payload and retries, like the web", async () => {
    mockSignature.value = null;
    client.start();
    await flush();
    expect(FakeSocket.instances).toHaveLength(0);

    mockSignature.value = { clientId: "mobile", ts: 1, sig: "abc" };
    jest.advanceTimersByTime(1000);
    await flush();
    expect(FakeSocket.instances).toHaveLength(1);
  });

  it("falls back to self-signing when the endpoint fails (web tuKy)", async () => {
    mockSignature.fail = true;
    mockSocketSigning.secret = "key";
    jest.setSystemTime(1700000000123);
    const ws = await startOpen(client);
    const params = new URL(ws.url).searchParams;
    expect(params.get("clientId")).toBe("web-prod");
    expect(params.get("ts")).toBe("1700000000123");
    expect(params.get("sig")).toBe(hmacSha256Hex("web-prod:1700000000123", "key"));
  });

  it("connects unsigned when the endpoint fails and no fallback secret is set", async () => {
    mockSignature.fail = true;
    const ws = await startOpen(client);
    expect(new URL(ws.url).searchParams.has("sig")).toBe(false);
  });

  it("pings every 25s", async () => {
    const ws = await startOpen(client);
    jest.advanceTimersByTime(25_000);
    expect(ws.sent).toContainEqual({ op: "ping" });
  });

  it("reconnects after a drop and replays every room", async () => {
    const ws = await startOpen(client);
    client.acquire("odds", 1);
    client.acquire("match", 2);
    ws.drop();
    expect(client.getStatus().connected).toBe(false);

    jest.advanceTimersByTime(1000); // first backoff is 500–1000ms
    await flush();
    const next = latest();
    expect(next).not.toBe(ws);
    next.open();
    expect(next.ops("sub")).toEqual(["odds:1", "match:2"]);
  });

  it("marks the feed stale after 5s offline", async () => {
    const ws = await startOpen(client);
    ws.drop();
    expect(client.getStatus().liveFeedStale).toBe(false);
    jest.advanceTimersByTime(5_000);
    expect(client.getStatus().liveFeedStale).toBe(true);
  });

  it("follows the heartbeat feedStale flag", async () => {
    const ws = await startOpen(client);
    ws.push({ type: "heartbeat", feedStale: true });
    expect(client.getStatus().liveFeedStale).toBe(true);
    ws.push({ type: "heartbeat", feedStale: false });
    expect(client.getStatus().liveFeedStale).toBe(false);
  });
});

describe("rooms", () => {
  it("subscribes once per room and unsubscribes 10s after the last release", async () => {
    const ws = await startOpen(client);
    const a = client.acquire("odds", 7);
    const b = client.acquire("odds", 7);
    expect(ws.ops("sub")).toEqual(["odds:7"]);

    a();
    b();
    jest.advanceTimersByTime(9_999);
    expect(ws.ops("unsub")).toEqual([]);
    jest.advanceTimersByTime(1);
    expect(ws.ops("unsub")).toEqual(["odds:7"]);
  });

  it("keeps the room when it is taken again within 10s", async () => {
    const ws = await startOpen(client);
    client.acquire("odds", 7)();
    jest.advanceTimersByTime(5_000);
    client.acquire("odds", 7);
    jest.advanceTimersByTime(20_000);
    expect(ws.ops("unsub")).toEqual([]);
    expect(ws.ops("sub")).toEqual(["odds:7"]);
  });

  it("queues rooms over budget and fills freed slots", async () => {
    const ws = await startOpen(client);
    const releases = [1, 2, 3, 4].map((id) => client.acquire("odds", id));
    expect(ws.ops("sub")).toEqual(["odds:1", "odds:2", "odds:3"]);

    releases[0]();
    jest.advanceTimersByTime(10_000);
    expect(ws.ops("sub")).toEqual(["odds:1", "odds:2", "odds:3", "odds:4"]);
  });

  it("evicts the oldest ordinary room for a priority room", async () => {
    const ws = await startOpen(client);
    [1, 2, 3].forEach((id) => client.acquire("odds", id));
    client.acquire("odds", 9, true);
    expect(ws.ops("unsub")).toEqual(["odds:1"]);
    expect(ws.ops("sub").at(-1)).toBe("odds:9");
  });

  it("hands refused rooms back to the queue on too_many_rooms", async () => {
    const ws = await startOpen(client);
    const [release1] = [1, 2, 3].map((id) => client.acquire("odds", id));
    ws.push({ type: "error", error: "too_many_rooms" });
    jest.advanceTimersByTime(300);
    // Room 3 (the last sent) was refused; the budget drops to the 2 rooms held.
    client.acquire("odds", 4);
    expect(ws.ops("sub")).toEqual(["odds:1", "odds:2", "odds:3"]);

    // Freeing room 1 lets the refused room 3 back in first, not room 4.
    release1();
    jest.advanceTimersByTime(10_000);
    expect(ws.ops("unsub")).toEqual(["odds:1"]);
    expect(ws.ops("sub")).toEqual(["odds:1", "odds:2", "odds:3", "odds:3"]);
  });
});

describe("sequence gate", () => {
  it("drops late snapshots and duplicate deltas, and resyncs on a gap", async () => {
    const ws = await startOpen(client);
    const received: unknown[] = [];
    client.addMessageListener((m) => received.push(m.seq));

    ws.push({ type: "odds", matchId: 1, seq: 5, snapshot: {} });
    ws.push({ type: "odds", matchId: 1, seq: 4, snapshot: {} }); // older snapshot
    ws.push({ type: "odds", matchId: 1, seq: 5, mode: "delta", changes: [] }); // duplicate
    ws.push({ type: "odds", matchId: 1, seq: 6, mode: "delta", changes: [] });
    ws.push({ type: "odds", matchId: 1, seq: 9, mode: "delta", changes: [] }); // gap

    expect(received).toEqual([5, 6, 9]);
    expect(ws.sent).toContainEqual({ op: "resync", type: "odds", matchId: 1 });
  });

  it("forgets sequence numbers on reconnect", async () => {
    const ws = await startOpen(client);
    const received: unknown[] = [];
    client.addMessageListener((m) => received.push(m.seq));
    ws.push({ type: "match", matchId: 1, seq: 50, snapshot: {} });

    ws.drop();
    jest.advanceTimersByTime(1000);
    await flush();
    latest().open();
    latest().push({ type: "match", matchId: 1, seq: 1, snapshot: {} });
    expect(received).toEqual([50, 1]);
  });
});
