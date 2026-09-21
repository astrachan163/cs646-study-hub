import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { LikelyQuiz, Question, UnitMeta } from '../content/types.ts'
import {
  BASIS_LABEL,
  findLikelyQuiz,
  likelyQuizQuestions,
  parseQuizBasis,
  primaryLikelyQuiz,
  sortLikelyQuizzes,
} from './likelyQuizzes.ts'
import { defaultQuizConfig, isAutostartRequested, likelyQuizLaunchParams, parseQuizConfig } from './quizConfig.ts'
import { rngFromSeed } from './random.ts'
import { selectQuiz } from './select.ts'

const UNIT_DIR = join(process.cwd(), 'content/units/quiz-1-mastering-bitcoin-ch01-05')

function readJson<T>(file: string): T {
  return JSON.parse(readFileSync(join(UNIT_DIR, file), 'utf8')) as T
}

const questions = readJson<Question[]>('questions.json')
const quizzes = readJson<LikelyQuiz[]>('likely-quizzes.json')
const unit = readJson<UnitMeta>('unit.json')

/** The shipped file may list the quizzes in any order; the tests use a scrambled copy. */
const scrambled: LikelyQuiz[] = [...quizzes].reverse()

describe('predicted quiz lookup', () => {
  it('sorts quizzes into tab order lecture, mixed, book', () => {
    expect(sortLikelyQuizzes(scrambled).map((q) => q.basis)).toEqual(['lecture', 'mixed', 'book'])
  })

  it('finds the single primary quiz', () => {
    const primary = primaryLikelyQuiz(scrambled)
    expect(primary?.primary).toBe(true)
    expect(quizzes.filter((q) => q.primary)).toEqual([primary])
  })

  it('finds a quiz by basis and falls back to the primary for null or unknown', () => {
    expect(findLikelyQuiz(scrambled, 'book')?.basis).toBe('book')
    expect(findLikelyQuiz(scrambled, 'lecture')?.basis).toBe('lecture')
    expect(findLikelyQuiz(scrambled, null)).toBe(primaryLikelyQuiz(scrambled))
    expect(findLikelyQuiz([], null)).toBeUndefined()
  })

  it('parses a URL segment into a basis, or null for anything else', () => {
    expect(parseQuizBasis('book')).toBe('book')
    expect(parseQuizBasis('mixed')).toBe('mixed')
    expect(parseQuizBasis('')).toBeNull()
    expect(parseQuizBasis(undefined)).toBeNull()
    expect(parseQuizBasis('slides')).toBeNull()
  })

  it('has a label for every basis', () => {
    expect(Object.keys(BASIS_LABEL).sort()).toEqual(['book', 'lecture', 'mixed'])
  })
})

describe('take a predicted quiz as a timed practice quiz', () => {
  it.each(['lecture', 'mixed', 'book'] as const)('the %s quiz resolves to exactly its 20 questions, in order', (basis) => {
    const quiz = findLikelyQuiz(quizzes, basis)!
    const ordered = likelyQuizQuestions(quiz, questions)
    expect(ordered).toHaveLength(unit.assessment.questions)
    expect(ordered.map((q) => q.id)).toEqual(quiz.questionIds)
    expect(new Set(ordered.map((q) => q.id)).size).toBe(20)
  })

  it('the quiz engine returns the same questions in the same order regardless of seed or filters', () => {
    const quiz = findLikelyQuiz(quizzes, 'book')!
    for (const seed of ['a', 'b', 'likely']) {
      const result = selectQuiz(questions, { n: 5, filters: { chapters: [1], likelihood: ['low'] }, orderedIds: quiz.questionIds }, rngFromSeed(seed))
      expect(result.questions.map((q) => q.id)).toEqual(quiz.questionIds)
      expect(result.requested).toBe(20)
      expect(result.poolSize).toBe(20)
    }
  })

  it('the launch link opens the right prediction, timed like the real quiz, with feedback at the end, and starts at once', () => {
    const params = likelyQuizLaunchParams('lecture')
    expect(isAutostartRequested(params)).toBe(true)
    const defaults = defaultQuizConfig(unit, 'seed')
    const config = parseQuizConfig(new URLSearchParams(params.toString()), defaults)
    expect(config.set).toBe('likely')
    expect(config.likelyQuiz).toBe('lecture')
    expect(config.timerMinutes).toBe(unit.assessment.minutes)
    expect(config.timerMinutes).toBe(10)
    expect(config.feedback).toBe('end')
    expect(isAutostartRequested(new URLSearchParams('set=likely&lq=lecture'))).toBe(false)
  })

  it('the interim split keeps each prediction on its coverage', () => {
    const byId = new Map(questions.map((q) => [q.id, q]))
    const coverages = (basis: 'lecture' | 'mixed' | 'book') => new Set(findLikelyQuiz(quizzes, basis)!.questionIds.map((id) => byId.get(id)!.coverage))
    expect([...coverages('lecture')].every((c) => c === 'lecture-only' || c === 'lecture+book')).toBe(true)
    expect([...coverages('mixed')]).toEqual(['lecture+book'])
    expect([...coverages('book')]).toEqual(['book-only'])
  })
})
