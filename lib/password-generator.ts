const LOWER = "abcdefghijklmnopqrstuvwxyz";
const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const DIGITS = "0123456789";
const SYMBOLS = "!@#$%^&*()-_=+[]{}";

export type GeneratorOptions = {
  length: number;
  lowercase: boolean;
  uppercase: boolean;
  digits: boolean;
  symbols: boolean;
};

export function generatePassword(options: GeneratorOptions): string {
  let charset = "";
  const required: string[] = [];

  if (options.lowercase) {
    charset += LOWER;
    required.push(LOWER[crypto.getRandomValues(new Uint32Array(1))[0] % LOWER.length]);
  }
  if (options.uppercase) {
    charset += UPPER;
    required.push(UPPER[crypto.getRandomValues(new Uint32Array(1))[0] % UPPER.length]);
  }
  if (options.digits) {
    charset += DIGITS;
    required.push(DIGITS[crypto.getRandomValues(new Uint32Array(1))[0] % DIGITS.length]);
  }
  if (options.symbols) {
    charset += SYMBOLS;
    required.push(SYMBOLS[crypto.getRandomValues(new Uint32Array(1))[0] % SYMBOLS.length]);
  }

  if (!charset) {
    charset = LOWER + UPPER + DIGITS;
  }

  const length = Math.max(options.length, required.length, 8);
  const chars: string[] = [...required];

  while (chars.length < length) {
    const index = crypto.getRandomValues(new Uint32Array(1))[0] % charset.length;
    chars.push(charset[index]);
  }

  for (let i = chars.length - 1; i > 0; i--) {
    const j = crypto.getRandomValues(new Uint32Array(1))[0] % (i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }

  return chars.join("");
}

export const DEFAULT_GENERATOR: GeneratorOptions = {
  length: 16,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
};
