import { describe, expect, it } from 'vitest'
import type { McqQuestion, Question, ShortQuestion, TfQuestion } from '../content/types.ts'
import { judge, letterGrade, scoreAttempt, type AnswerRecord } from './score.ts'

const base = {
  chapter: 1,
  section: 's',
  explanation: 'e',
  source: { book: null, lecture: null },
  coverage: 'lecture+book',
  likelihood: 'high',
  difficulty: 'easy',
  tags: [] as string[],
} satisfies Omit<Question, 'id' | 'type' | 'prompt' | 'answer' | 'choices'>

const mcq: McqQuestion = { ...base, id: 'x-ch01-q01', type: 'mcq', prompt: 'p', choices: ['a', 'b', 'c'], answer: 2 }
const tf: TfQuestion = { ...base, id: 'x-ch01-q02', type: 'tf', prompt: 'p', answer: false }
const short: ShortQuestion = { ...base, id: 'x-ch01-q03', type: 'short', prompt: 'p', answer: 'model' }
const questions: Question[] = [mcq, tf, short]

function rec(questionId: string, response: AnswerRecord['response'], selfCorrect: boolean | null = null): AnswerRecord {
  return { questionId, response, selfCorrect }
}

describe('judge', () => {
  it('grades multiple choice by index', () => {
    expect(judge(mcq, rec(mcq.id, 2))).toBe('correct')
    expect(judge(mcq, rec(mcq.id, 0))).toBe('incorrect')
    expect(judge(mcq, undefined)).toBe('unanswered')
  })
  it('grades true/false by boolean', () => {
    expect(judge(tf, rec(tf.id, false))).toBe('correct')
    expect(judge(tf, rec(tf.id, true))).toBe('incorrect')
  })
  it('leaves short answers pending until self-graded', () => {
    expect(judge(short, rec(short.id, 'my answer'))).toBe('pending')
    expect(judge(short, rec(short.id, 'my answer', true))).toBe('correct')
    expect(judge(short, rec(short.id, 'my answer', false))).toBe('incorrect')
    expect(judge(short, rec(short.id, ''))).toBe('unanswered')
  })
})

describe('scoreAttempt', () => {
  it('counts verdicts, computes percent and points, and lists missed ids', () => {
    const records = new Map<string, AnswerRecord>([
      [mcq.id, rec(mcq.id, 2)],
      [tf.id, rec(tf.id, true)],
      [short.id, rec(short.id, 'typed', true)],
    ])
    const score = scoreAttempt(questions, records, 20)
    expect(score.correct).toBe(2)
    expect(score.incorrect).toBe(1)
    expect(score.total).toBe(3)
    expect(score.percent).toBe(66.7)
    expect(score.points).toBe(13.3)
    expect(score.pointsTotal).toBe(20)
    expect(score.missedIds).toEqual([tf.id])
  })
  it('treats unanswered as missed and pending as neither', () => {
    const records = new Map<string, AnswerRecord>([[short.id, rec(short.id, 'typed')]])
    const score = scoreAttempt(questions, records, 3)
    expect(score.unanswered).toBe(2)
    expect(score.pending).toBe(1)
    expect(score.correct).toBe(0)
    expect(score.missedIds).toEqual([mcq.id, tf.id])
  })
  it('handles an empty quiz without dividing by zero', () => {
    const score = scoreAttempt([], new Map(), 20)
    expect(score.percent).toBe(0)
    expect(score.points).toBe(0)
  })
})

describe('letterGrade', () => {
  it('follows the graduate scale from the syllabus', () => {
    expect(letterGrade(95)).toBe('A')
    expect(letterGrade(90)).toBe('A')
    expect(letterGrade(85)).toBe('B')
    expect(letterGrade(70)).toBe('C')
    expect(letterGrade(59.9)).toBe('F')
  })
})
