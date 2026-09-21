/**
 * Deterministic randomness so a shared quiz link reproduces the exact same
 * question set for everyone who opens it.
 */

export type Rng = () => number

/**
 * mulberry32: tiny, fast 32-bit seeded generator returning floats in [0, 1).
 * Source: https://github.com/bryc/code/blob/master/jshash/PRNGs.md#mulberry32
 */
export function mulberry32(seed: number): Rng {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** FNV-1a 32-bit hash so any human-readable seed string maps to a number. */
export function hashSeed(seed: string): number {
  let h = 0x811c9dc5
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i)
    h = Math.imul(h, 0x01000193)
  }
  return h >>> 0
}

export function rngFromSeed(seed: string): Rng {
  return mulberry32(hashSeed(seed))
}

/** Short, URL-friendly seed such as "k3v9x2". */
export function randomSeedString(): string {
  const alphabet = 'abcdefghjkmnpqrstuvwxyz23456789'
  let out = ''
  for (let i = 0; i < 6; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)]
  }
  return out
}

/** Fisher–Yates shuffle that returns a new array. */
export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    const a = copy[i] as T
    copy[i] = copy[j] as T
    copy[j] = a
  }
  return copy
}
