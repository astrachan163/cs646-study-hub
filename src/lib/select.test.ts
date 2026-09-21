import { describe, expect, it } from 'vitest'
import type { Question } from '../content/types.ts'
import { rngFromSeed } from './random.ts'
import { filterQuestions, LIKELIHOOD_WEIGHTS, selectQuiz, selectWeighted } from './select.ts'

function q(id: string, overrides: Partial<Question> = {}): Question {
  const chapter = Number(id.match(/-ch(\d+)-/)?.[1] ?? 1)
  return {
    id,
    chapter,
    section: 'Section',
    type: 'mcq',
    prompt: `Prompt ${id}`,
    choices: ['a', 'b', 'c', 'd'],
    answer: 0,
    explanation: 'Because.',
    source: { book: 'ch', lecture: null },
    coverage: 'lecture+book',
    likelihood: 'medium',
    difficulty: 'easy',
    tags: [],
    ...overrides,
  } as Question
}

const bank: Question[] = [
  q('t-ch01-q01', { likelihood: 'high' }),
  q('t-ch01-q02', { likelihood: 'low', coverage: 'skipped-slide', tags: ['calculation'] }),
  q('t-ch02-q01', { likelihood: 'high', difficulty: 'hard' }),
  q('t-ch02-q02', { likelihood: 'medium', coverage: 'book-only' }),
  q('t-ch03-q01', { likelihood: 'low', type: 'tf', answer: true } as Partial<Question>),
  q('t-ch03-q02', { likelihood: 'high', type: 'short', answer: 'model' } as Partial<Question>),
]

describe('filterQuestions', () => {
  it('returns everything when no filters are set', () => {
    expect(filterQuestions(bank, {})).toHaveLength(bank.length)
  })
  it('filters by chapter, coverage, difficulty, likelihood and type', () => {
    expect(filterQuestions(bank, { chapters: [1] }).map((x) => x.id)).toEqual(['t-ch01-q01', 't-ch01-q02'])
    expect(filterQuestions(bank, { coverage: ['book-only'] }).map((x) => x.id)).toEqual(['t-ch02-q02'])
    expect(filterQuestions(bank, { difficulty: ['hard'] }).map((x) => x.id)).toEqual(['t-ch02-q01'])
    expect(filterQuestions(bank, { likelihood: ['low'] })).toHaveLength(2)
    expect(filterQuestions(bank, { types: ['tf', 'short'] })).toHaveLength(2)
  })
  it('restricts to explicit ids and searches text', () => {
    expect(filterQuestions(bank, { ids: ['t-ch02-q02', 'nope'] }).map((x) => x.id)).toEqual(['t-ch02-q02'])
    expect(filterQuestions(bank, { search: 'calculation' }).map((x) => x.id)).toEqual(['t-ch01-q02'])
    expect(filterQuestions(bank, { search: 'PROMPT T-CH03' })).toHaveLength(2)
  })
})

describe('selectWeighted', () => {
  it('never returns duplicates and never more than the pool', () => {
    const picked = selectWeighted(bank, 100, rngFromSeed('a'))
    expect(picked).toHaveLength(bank.length)
    expect(new Set(picked.map((x) => x.id)).size).toBe(bank.length)
  })
  it('is deterministic for a given seed and differs between seeds', () => {
    const a1 = selectWeighted(bank, 3, rngFromSeed('seed-1')).map((x) => x.id)
    const a2 = selectWeighted(bank, 3, rngFromSeed('seed-1')).map((x) => x.id)
    expect(a1).toEqual(a2)
    const differs = ['s2', 's3', 's4', 's5', 's6'].some(
      (s) => JSON.stringify(selectWeighted(bank, 3, rngFromSeed(s)).map((x) => x.id)) !== JSON.stringify(a1),
    )
    expect(differs).toBe(true)
  })
  it('favours high-likelihood questions roughly in proportion to their weights', () => {
    const pool = [q('w-ch01-q01', { likelihood: 'high' }), q('w-ch01-q02', { likelihood: 'low' })]
    let highWins = 0
    const trials = 4000
    for (let i = 0; i < trials; i++) {
      const [first] = selectWeighted(pool, 1, rngFromSeed(`trial-${i}`))
      if (first?.id === 'w-ch01-q01') highWins++
    }
    const expected = LIKELIHOOD_WEIGHTS.high / (LIKELIHOOD_WEIGHTS.high + LIKELIHOOD_WEIGHTS.low)
    expect(highWins / trials).toBeGreaterThan(expected - 0.05)
    expect(highWins / trials).toBeLessThan(expected + 0.05)
  })
})

describe('selectQuiz', () => {
  it('reports the pool size and requested count when the pool is too small', () => {
    const result = selectQuiz(bank, { n: 20, filters: { chapters: [2] } }, rngFromSeed('x'))
    expect(result.requested).toBe(20)
    expect(result.poolSize).toBe(2)
    expect(result.questions).toHaveLength(2)
  })
  it('returns ordered ids verbatim for the predicted quiz, skipping unknown ids', () => {
    const result = selectQuiz(bank, { n: 2, filters: {}, orderedIds: ['t-ch03-q02', 'missing', 't-ch01-q01'] }, rngFromSeed('x'))
    expect(result.questions.map((x) => x.id)).toEqual(['t-ch03-q02', 't-ch01-q01'])
    expect(result.poolSize).toBe(2)
  })
})
