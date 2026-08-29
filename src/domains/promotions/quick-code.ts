/**
 * Generate a short, readable promo code from a context label (issue #56 §7).
 * "Marta Ruiz" → "MR-9F2K"; "Repetidores playa" → "RP-3T8Q". Pure.
 */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no I/O/0/1

export function randomSuffix(len = 4, rand: () => number = Math.random): string {
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[Math.floor(rand() * ALPHABET.length)];
  return out;
}

export function prefixFromLabel(label: string): string {
  const words = label
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
    .split(/\s+/)
    .filter(Boolean);
  const letters = words
    .map((w) => w[0])
    .filter((ch): ch is string => !!ch && /[A-Z]/.test(ch))
    .join("");
  return (letters || "PV").slice(0, 3);
}

export function quickCode(label: string, rand?: () => number): string {
  return `${prefixFromLabel(label)}${randomSuffix(4, rand)}`;
}
