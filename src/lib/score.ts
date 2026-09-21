import type { Question } from '../content/types.ts'

/** What the student entered: a choice index (mcq), a boolean (tf) or typed text (short). */
export type Response = number | boolean | string | null

export interface AnswerRecord {
  questionId: string
  response: Response
  /** Short-answer questions are graded by the student after seeing the model answer. */
  selfCorrect: boolean | null
}

export type Verdict = 'correct' | 'incorrect' | 'unanswered' | 'pending'

export function judge(question: Question, record: AnswerRecord | undefined): Verdict {
  if (!record || record.response === null || record.response === '') return 'unanswered'
  switch (question.type) {
    case 'mcq':
      return record.response === question.answer ? 'correct' : 'incorrect'
    case 'tf':
      return record.response === question.answer ? 'correct' : 'incorrect'
    case 'short':
      if (record.selfCorrect === null) return 'pending'
      return record.selfCorrect ? 'correct' : 'incorrect'
    default: {
      const exhaustive: never = question
      return exhaustive
    }
  }
}

export interface AttemptScore {
  correct: number
  incorrect: number
  unanswered: number
  pending: number
  total: number
  /** 0-100, rounded to one decimal. */
  percent: number
  /** Points earned out of `pointsTotal`, rounded to one decimal. */
  points: number
  pointsTotal: number
  missedIds: string[]
}

export function scoreAttempt(
  questions: readonly Question[],
  records: ReadonlyMap<string, AnswerRecord>,
  pointsTotal: number,
): AttemptScore {
  let correct = 0
  let incorrect = 0
  let unanswered = 0
  let pending = 0
  const missedIds: string[] = []
  for (const q of questions) {
    const verdict = judge(q, records.get(q.id))
    switch (verdict) {
      case 'correct':
        correct++
        break
      case 'incorrect':
        incorrect++
        missedIds.push(q.id)
        break
      case 'unanswered':
        unanswered++
        missedIds.push(q.id)
        break
      case 'pending':
        pending++
        break
      default: {
        const exhaustive: never = verdict
        return exhaustive
      }
    }
  }
  const total = questions.length
  const ratio = total === 0 ? 0 : correct / total
  return {
    correct,
    incorrect,
    unanswered,
    pending,
    total,
    percent: Math.round(ratio * 1000) / 10,
    points: Math.round(ratio * pointsTotal * 10) / 10,
    pointsTotal,
    missedIds,
  }
}

/** Letter grade on the graduate scale from the syllabus (A 90+, B 80-89, C 60-79, F below). */
export function letterGrade(percent: number): string {
  if (percent >= 90) return 'A'
  if (percent >= 80) return 'B'
  if (percent >= 60) return 'C'
  return 'F'
}
