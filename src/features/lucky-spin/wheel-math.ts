// Wheel angles, ported from web PopupShowLuckySpin (`:125-216`) and PopupShowHalfLuckySpin
// (`:168-230`). Sector 0 starts at 9 o'clock and sectors run clockwise; the pointer is at
// 12 o'clock. Rotation accumulates across spins (it is never reset).

/** Angle of the middle of sector `index` with the web's −90° offset, in [−180, 180). */
export function sectorCenter(index: number, count: number): number {
  const size = 360 / count;
  const center = (index * size - 90 + ((index + 1) * size - 90)) / 2;
  return ((((center + 180) % 360) + 360) % 360) - 180;
}

/** Signed-in wheel: land `index` under the pointer after at least 5 full turns (no randomness). */
export function memberSpinRotation(current: number, index: number, count: number): number {
  const center = sectorCenter(index, count);
  let total = (((-center % 360) + 360) % 360);
  while (total < current + 5 * 360) total += 360;
  return total;
}

/** Guest wheel: 5–8 turns (random, fractional) then land `index` under the pointer. */
export function guestSpinRotation(current: number, index: number, count: number, random: number = Math.random()): number {
  const size = 360 / count;
  const spins = 5 + random * 3;
  const base = current + spins * 360;
  const targetCenter = (index + 0.5) * size - 90;
  const delta = (((-targetCenter - base) % 360) + 360) % 360;
  return base + delta;
}

/** Index of the first sector with this reward id, or 0 (web fallback). */
export function prizeIndex(prizes: { id: string }[], id: string | undefined): number {
  const index = prizes.findIndex((prize) => prize.id === id);
  return index < 0 ? 0 : index;
}
