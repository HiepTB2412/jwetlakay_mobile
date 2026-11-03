import { lotterySigning } from "@/lib/config";
import { hmacSha256Hex } from "@/lib/crypto/hmac";

// [WEB-PARITY] Ticket purchase signature, copied from web-client
// src/pages/lottery/components/page/components/buy-ticket/buy.ticket.tsx (`toSignString`,
// `generateSignature`). The secret ships in the app like on the web — see the note in
// src/lib/config.ts. Unlike the sport-api signature this one guards a money transaction.

/** web `TicketItem` (src/apis/lottery/index.ts); only these three fields are signed. */
export type LotteryTicket = {
  drawId: string;
  selectedNumber: string;
  betAmount: number;
};

/** web `LotteryRequest` minus `signature`. */
export type LotteryPurchase = {
  requestId?: string;
  tickets: LotteryTicket[];
  totalAmount: number;
};

/** accessKey + requestId + JSON(tickets with drawId, selectedNumber, betAmount) + totalAmount. */
export function lotterySignString(request: LotteryPurchase, accessKey: string): string {
  const ticketsJson = JSON.stringify(
    request.tickets.map((t) => ({ drawId: t.drawId, selectedNumber: t.selectedNumber, betAmount: t.betAmount })),
  );
  // Template literal reproduces the web's `+` concatenation, including "undefined" for a missing requestId.
  return `${accessKey}${request.requestId}${ticketsJson}${request.totalAmount}`;
}

/** Hex HMAC-SHA256 of the sign string; the secret key is used as UTF-8 (crypto-js string key). */
export function signLotteryPurchase(
  request: LotteryPurchase,
  { accessKey, secretKey } = lotterySigning,
): string {
  return hmacSha256Hex(lotterySignString(request, accessKey), secretKey);
}
