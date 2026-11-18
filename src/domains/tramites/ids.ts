import { randomBytes } from "node:crypto";

/** Referencias cortas y legibles, sin datos personales ni caracteres ambiguos. */
const ALPHABET = "23456789ABCDEFGHJKLMNPQRSTUVWXYZ";

export function shortRef(prefix: "TR" | "EX"): string {
  const bytes = randomBytes(6);
  let out = "";
  for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  return `${prefix}-${out}`;
}
