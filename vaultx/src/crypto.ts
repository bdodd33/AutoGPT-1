import type { PasswordOptions } from './types';

const PBKDF2_ITERATIONS = 310_000;
const SALT_BYTES = 32;
const IV_BYTES = 12;
const KEY_BYTES = 32;

function toBase64(buf: ArrayBuffer): string {
  const bytes = new Uint8Array(buf);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function deriveKey(
  password: string,
  salt: Uint8Array,
  extractable = false
): Promise<CryptoKey> {
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    extractable,
    ['encrypt', 'decrypt']
  );
}

export async function encryptVault(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const iv = crypto.getRandomValues(new Uint8Array(IV_BYTES));
  const key = await deriveKey(password, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );
  const combined = new Uint8Array(SALT_BYTES + IV_BYTES + ciphertext.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_BYTES);
  combined.set(new Uint8Array(ciphertext), SALT_BYTES + IV_BYTES);
  return toBase64(combined.buffer);
}

export async function decryptVault(ciphertext: string, password: string): Promise<string> {
  const data = fromBase64(ciphertext);
  const salt = data.slice(0, SALT_BYTES);
  const iv = data.slice(SALT_BYTES, SALT_BYTES + IV_BYTES);
  const encrypted = data.slice(SALT_BYTES + IV_BYTES);
  const key = await deriveKey(password, salt);
  const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, encrypted);
  return new TextDecoder().decode(decrypted);
}

export async function hashPassword(password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const key = await deriveKey(password, salt, true);
  const keyBytes = await crypto.subtle.exportKey('raw', key);
  const combined = new Uint8Array(SALT_BYTES + KEY_BYTES);
  combined.set(salt, 0);
  combined.set(new Uint8Array(keyBytes), SALT_BYTES);
  return toBase64(combined.buffer);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  try {
    const data = fromBase64(hash);
    const salt = data.slice(0, SALT_BYTES);
    const stored = data.slice(SALT_BYTES);
    const key = await deriveKey(password, salt, true);
    const keyBytes = new Uint8Array(await crypto.subtle.exportKey('raw', key));
    if (keyBytes.length !== stored.length) return false;
    let diff = 0;
    for (let i = 0; i < keyBytes.length; i++) diff |= keyBytes[i] ^ stored[i];
    return diff === 0;
  } catch {
    return false;
  }
}

// --- Password generation ---

const UPPER = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
const LOWER = 'abcdefghijklmnopqrstuvwxyz';
const DIGITS = '0123456789';
const SYMBOLS = '!@#$%^&*()-_=+[]{}|;:,.<>?';
const AMBIGUOUS = 'Il1O0oB8S5Z2';
const CONSONANTS = 'bcdfghjklmnpqrstvwxyz';
const VOWELS = 'aeiou';

const WORDS = [
  'apple','beach','cloud','dance','eagle','flame','grape','house','ivory','jewel',
  'kite','lemon','mango','night','ocean','piano','queen','river','storm','tiger',
  'ultra','vivid','water','xenon','yacht','zebra','amber','brave','coral','dusk',
  'ember','frost','glory','honor','image','jade','karma','light','magic','noble',
  'olive','pearl','quartz','rouge','silver','thorn','unity','valor','woven','xray',
  'yonder','zenith','acorn','blaze','crisp','delta','elite','fable','grace','helix',
  'ideal','joker','knack','lunar','maple','nexus','opal','prism','quest','raven',
  'swift','topaz','venom','wheat','yield','zeal','astro','boost','crane','drift',
  'epoch','forge','glide','hatch','ingot','jumbo','lyric','micro','nerve','orbit',
  'pixel','quirk','realm','spike','tower','viper','whirl','xtreme','yolk','zoom',
];

function randInt(max: number): number {
  const arr = new Uint32Array(1);
  crypto.getRandomValues(arr);
  return arr[0] % max;
}

export function generatePassword(opts: PasswordOptions): string {
  if (opts.passphrase) {
    const words: string[] = [];
    for (let i = 0; i < Math.max(2, opts.wordCount || 4); i++) {
      words.push(WORDS[randInt(WORDS.length)]);
    }
    return words.join('-');
  }

  if (opts.pronounceable) {
    const len = Math.max(8, opts.length || 16);
    let result = '';
    let useConsonant = randInt(2) === 0;
    for (let i = 0; i < len - 2; i++) {
      const pool = useConsonant ? CONSONANTS : VOWELS;
      result += pool[randInt(pool.length)];
      useConsonant = !useConsonant;
    }
    result += DIGITS[randInt(DIGITS.length)];
    result += SYMBOLS[randInt(SYMBOLS.length)];
    return result;
  }

  let charset = '';
  if (opts.uppercase) charset += UPPER;
  if (opts.lowercase) charset += LOWER;
  if (opts.numbers) charset += DIGITS;
  if (opts.symbols) charset += SYMBOLS;
  if (!charset) charset = LOWER + DIGITS;

  if (opts.excludeAmbiguous) {
    charset = charset.split('').filter((c) => !AMBIGUOUS.includes(c)).join('');
  }

  const len = Math.max(4, opts.length || 20);
  const arr = new Uint8Array(len * 2);
  crypto.getRandomValues(arr);

  let result = '';
  let i = 0;
  while (result.length < len) {
    result += charset[arr[i % arr.length] % charset.length];
    i++;
  }

  // Guarantee at least one char from each selected charset
  const required: string[] = [];
  const filter = (s: string) =>
    opts.excludeAmbiguous ? s.split('').filter((c) => !AMBIGUOUS.includes(c)).join('') : s;

  if (opts.uppercase && filter(UPPER)) required.push(filter(UPPER)[randInt(filter(UPPER).length)]);
  if (opts.lowercase && filter(LOWER)) required.push(filter(LOWER)[randInt(filter(LOWER).length)]);
  if (opts.numbers && filter(DIGITS)) required.push(filter(DIGITS)[randInt(filter(DIGITS).length)]);
  if (opts.symbols) required.push(SYMBOLS[randInt(SYMBOLS.length)]);

  const resultArr = result.split('');
  for (let j = 0; j < required.length && j < len; j++) {
    resultArr[randInt(len)] = required[j];
  }
  return resultArr.join('');
}

// --- Strength meter ---

export interface StrengthResult {
  score: number;
  label: string;
  color: string;
  suggestions: string[];
}

export function measurePasswordStrength(password: string): StrengthResult {
  if (!password) return { score: 0, label: 'Very Weak', color: '#ef4444', suggestions: ['Enter a password'] };

  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 10;
  if (password.length >= 12) score += 15;
  if (password.length >= 16) score += 10;
  if (password.length >= 20) score += 10;
  if (password.length < 12) suggestions.push('Use 12+ characters');

  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasDigit = /\d/.test(password);
  const hasSymbol = /[^a-zA-Z0-9]/.test(password);

  if (hasUpper) score += 10;
  if (hasLower) score += 10;
  if (hasDigit) score += 10;
  if (hasSymbol) score += 15;

  if (!hasUpper || !hasLower) suggestions.push('Mix uppercase and lowercase');
  if (!hasDigit) suggestions.push('Add numbers');
  if (!hasSymbol && suggestions.length < 3) suggestions.push('Add special characters');

  const unique = new Set(password).size;
  if (unique / password.length > 0.7) score += 5;
  else if (unique / password.length < 0.3) score -= 10;

  const weak = [
    /^(.)\1+$/,
    /012|123|234|345|456|567|678|789|890|abc|bcd/i,
    /password|qwerty|letmein|admin|welcome|monkey|dragon/i,
  ];
  for (const p of weak) {
    if (p.test(password)) { score -= 20; break; }
  }

  score = Math.max(0, Math.min(100, score));

  let label: string, color: string;
  if (score < 20)       { label = 'Very Weak';   color = '#ef4444'; }
  else if (score < 40)  { label = 'Weak';         color = '#f97316'; }
  else if (score < 60)  { label = 'Fair';          color = '#f59e0b'; }
  else if (score < 80)  { label = 'Strong';        color = '#22c55e'; }
  else                  { label = 'Very Strong';   color = '#10b981'; }

  return { score, label, color, suggestions: suggestions.slice(0, 3) };
}
