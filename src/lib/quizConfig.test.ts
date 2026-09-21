import { describe, expect, it } from 'vitest'
import type { UnitMeta } from '../content/types.ts'
import { defaultQuizConfig, describeQuizConfig, parseQuizConfig, serializeQuizConfig, type QuizConfig } from './quizConfig.ts'

const unit: UnitMeta = {
  id: 'u',
  title: 'Unit',
  course: 'c',
  assessment: { type: 'quiz', questions: 20, points: 20, minutes: 10, opens: '2026-09-22T18:30:00-05:00', closes: '2026-09-22T18:40:00-05:00' },
  sources: [],
  scopeNotes: [],
}

const defaults = defaultQuizConfig(unit, 'default-seed')

describe('quiz config <-> URL', () => {
  it('uses the unit assessment for defaults', () => {
    expect(defaults.n).toBe(20)
    expect(defaults.timerMinutes).toBe(10)
    expect(defaults.feedback).toBe('instant')
    expect(defaults.set).toBe('random')
  })

  it('round-trips every field through URLSearchParams', () => {
    const config: QuizConfig = {
      n: 12,
      chapters: [1, 3],
      coverage: ['lecture+book', 'book-only'],
      difficulty: ['hard'],
      likelihood: ['high', 'medium'],
      feedback: 'end',
      timerMinutes: 0,
      seed: 'k3v9x2',
      ids: ['a-ch01-q01', 'a-ch02-q02'],
      set: 'random',
    }
    const params = serializeQuizConfig(config, defaults)
    // Re-parse from the string form exactly as the browser would.
    const reparsed = parseQuizConfig(new URLSearchParams(params.toString()), defaults)
    expect(reparsed).toEqual(config)
  })

  it('omits defaults so links stay short, but always writes the seed', () => {
    const params = serializeQuizConfig({ ...defaults, seed: 'abc' }, defaults)
    expect(params.toString()).toBe('seed=abc')
  })

  it('falls back to defaults for missing or garbage values', () => {
    const parsed = parseQuizConfig(new URLSearchParams('n=banana&ch=x,2,2,0&fb=weird&t=-5&lik=huge,high'), defaults)
    expect(parsed.n).toBe(20)
    expect(parsed.chapters).toEqual([2])
    expect(parsed.feedback).toBe('instant')
    expect(parsed.timerMinutes).toBe(0)
    expect(parsed.likelihood).toEqual(['high'])
    expect(parsed.seed).toBe('default-seed')
  })

  it('accepts a hand-typed "lecture book" with a space where the + was lost', () => {
    const parsed = parseQuizConfig(new URLSearchParams('cov=lecture book'), defaults)
    expect(parsed.coverage).toEqual(['lecture+book'])
  })

  it('clamps the question count to a sane range', () => {
    expect(parseQuizConfig(new URLSearchParams('n=0'), defaults).n).toBe(1)
    expect(parseQuizConfig(new URLSearchParams('n=9999'), defaults).n).toBe(200)
  })

  it('describes the configuration for humans', () => {
    expect(describeQuizConfig(defaults)).toBe('20 questions · 10 min · instant feedback')
    expect(describeQuizConfig({ ...defaults, set: 'likely' })).toBe('Predicted quiz, in order')
    expect(describeQuizConfig({ ...defaults, ids: ['a', 'b'], chapters: [2], timerMinutes: 0, feedback: 'end' })).toBe(
      '2 chosen questions · ch 2 · untimed · feedback at end',
    )
  })
})
