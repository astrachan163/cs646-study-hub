import type { Question } from '../content/types.ts'
import type { Response } from './score.ts'

export const CHOICE_KEYS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I'] as const

/** Human-readable form of the correct answer, used on results and the likely quiz. */
export function correctAnswerText(question: Question): string {
  switch (question.type) {
    case 'mcq':
      return `${CHOICE_KEYS[question.answer] ?? question.answer + 1}. ${question.choices[question.answer] ?? ''}`
    case 'tf':
      return question.answer ? 'True' : 'False'
    case 'short':
      return question.answer
    default: {
      const exhaustive: never = question
      return exhaustive
    }
  }
}

/** Human-readable form of what the student answered. */
export function responseText(question: Question, response: Response): string {
  if (response === null || response === '') return '—'
  switch (question.type) {
    case 'mcq':
      return typeof response === 'number'
        ? `${CHOICE_KEYS[response] ?? response + 1}. ${question.choices[response] ?? ''}`
        : String(response)
    case 'tf':
      return response === true ? 'True' : response === false ? 'False' : String(response)
    case 'short':
      return String(response)
    default: {
      const exhaustive: never = question
      return exhaustive
    }
  }
}
