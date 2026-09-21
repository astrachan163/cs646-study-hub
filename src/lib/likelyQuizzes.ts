import { QUIZ_BASES, type LikelyQuiz, type Question, type QuizBasis } from '../content/types.ts'

/** Tab labels for the three predicted quizzes, keyed by what each is built from. */
export const BASIS_LABEL: Record<QuizBasis, string> = {
  lecture: 'Lecture-only',
  mixed: 'Lecture + book',
  book: 'Book-only',
}

export const BASIS_HELP: Record<QuizBasis, string> = {
  lecture: 'Only what the instructor covered in class',
  mixed: 'Lecture content and the matching book material',
  book: 'The assigned chapters, including what the lecture did not reach',
}

/** Accepts a URL fragment such as "book"; anything else (missing, garbage) is null. */
export function parseQuizBasis(value: string | null | undefined): QuizBasis | null {
  return (QUIZ_BASES as readonly string[]).includes(value ?? '') ? (value as QuizBasis) : null
}

/** The quizzes in tab order (lecture, mixed, book) regardless of file order. */
export function sortLikelyQuizzes(quizzes: readonly LikelyQuiz[]): LikelyQuiz[] {
  return [...quizzes].sort((a, b) => QUIZ_BASES.indexOf(a.basis) - QUIZ_BASES.indexOf(b.basis))
}

/** The primary prediction; falls back to the first quiz if content is malformed, undefined if there are none. */
export function primaryLikelyQuiz(quizzes: readonly LikelyQuiz[]): LikelyQuiz | undefined {
  return quizzes.find((q) => q.primary) ?? quizzes[0]
}

/** The quiz for a basis; `null` (or an unknown basis) means the primary one. */
export function findLikelyQuiz(quizzes: readonly LikelyQuiz[], basis: QuizBasis | null): LikelyQuiz | undefined {
  if (basis !== null) {
    const match = quizzes.find((q) => q.basis === basis)
    if (match) return match
  }
  return primaryLikelyQuiz(quizzes)
}

/** The quiz's questions in its own order; ids missing from the bank are skipped (the validator forbids them). */
export function likelyQuizQuestions(quiz: LikelyQuiz, questions: readonly Question[]): Question[] {
  const byId = new Map(questions.map((q) => [q.id, q]))
  return quiz.questionIds.flatMap((id) => {
    const q = byId.get(id)
    return q ? [q] : []
  })
}
