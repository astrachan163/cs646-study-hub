import { describe, expect, it } from 'vitest'
import { hashSeed, mulberry32, randomSeedString, rngFromSeed, shuffle } from './random.ts'

describe('seeded randomness', () => {
  it('produces the same sequence for the same seed', () => {
    const a = rngFromSeed('quiz-1')
    const b = rngFromSeed('quiz-1')
    expect([a(), a(), a()]).toEqual([b(), b(), b()])
  })
  it('stays within [0, 1)', () => {
    const rng = mulberry32(12345)
    for (let i = 0; i < 1000; i++) {
      const v = rng()
      expect(v).toBeGreaterThanOrEqual(0)
      expect(v).toBeLessThan(1)
    }
  })
  it('hashes different strings to different seeds', () => {
    expect(hashSeed('a')).not.toBe(hashSeed('b'))
    expect(hashSeed('abc')).toBe(hashSeed('abc'))
  })
  it('shuffles into a permutation without mutating the input', () => {
    const input = [1, 2, 3, 4, 5, 6]
    const out = shuffle(input, rngFromSeed('s'))
    expect(input).toEqual([1, 2, 3, 4, 5, 6])
    expect([...out].sort()).toEqual([1, 2, 3, 4, 5, 6])
  })
  it('generates short url-safe seeds', () => {
    expect(randomSeedString()).toMatch(/^[a-z0-9]{6}$/)
  })
})
