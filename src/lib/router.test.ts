import { describe, expect, it } from 'vitest'
import { buildHash, matchRoute, parseHash } from './router.ts'

describe('hash router helpers', () => {
  it('parses the path and query out of a hash', () => {
    const loc = parseHash('#/unit/quiz-1/quiz?n=5&seed=abc')
    expect(loc.path).toBe('/unit/quiz-1/quiz')
    expect(loc.params.get('n')).toBe('5')
    expect(loc.params.get('seed')).toBe('abc')
  })
  it('normalises empty and trailing-slash hashes', () => {
    expect(parseHash('').path).toBe('/')
    expect(parseHash('#').path).toBe('/')
    expect(parseHash('#/unit/x/').path).toBe('/unit/x')
  })
  it('matches patterns with params and rejects others', () => {
    expect(matchRoute('/unit/:unitId/study/:chapter', '/unit/quiz-1/study/3')).toEqual({ unitId: 'quiz-1', chapter: '3' })
    expect(matchRoute('/unit/:unitId', '/unit/quiz-1/study')).toBeNull()
    expect(matchRoute('/unit/:unitId/lexicon', '/unit/quiz-1/bank')).toBeNull()
  })
  it('builds hashes with and without params', () => {
    expect(buildHash('/unit/x')).toBe('#/unit/x')
    expect(buildHash('/unit/x/quiz', new URLSearchParams({ n: '5' }))).toBe('#/unit/x/quiz?n=5')
    expect(buildHash('/unit/x/lexicon', { q: 'block height' })).toBe('#/unit/x/lexicon?q=block+height')
  })
})
