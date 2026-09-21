/**
 * TypeScript mirror of the shared content contract (see CONTENT-GUIDE.md and
 * the Project store's internal/content-schema.md). Content authors never touch
 * this file; they write JSON/Markdown that must fit these shapes.
 */

export const COVERAGES = ['lecture+book', 'book-only', 'lecture-only', 'skipped-slide'] as const
export type Coverage = (typeof COVERAGES)[number]

export const LIKELIHOODS = ['high', 'medium', 'low'] as const
export type Likelihood = (typeof LIKELIHOODS)[number]

export const DIFFICULTIES = ['easy', 'medium', 'hard'] as const
export type Difficulty = (typeof DIFFICULTIES)[number]

export const QUESTION_TYPES = ['mcq', 'tf', 'short'] as const
export type QuestionType = (typeof QUESTION_TYPES)[number]

export interface QuestionSource {
  book: string | null
  lecture: string | null
}

interface QuestionBase {
  id: string
  chapter: number
  section: string
  prompt: string
  explanation: string
  source: QuestionSource
  coverage: Coverage
  likelihood: Likelihood
  difficulty: Difficulty
  tags: string[]
}

/** Multiple choice: `answer` is a 0-based index into `choices`. */
export interface McqQuestion extends QuestionBase {
  type: 'mcq'
  choices: string[]
  answer: number
}

/** True/false: `answer` is a boolean, there are no choices. */
export interface TfQuestion extends QuestionBase {
  type: 'tf'
  answer: boolean
}

/** Short answer: `answer` is a model answer; the student self-grades. */
export interface ShortQuestion extends QuestionBase {
  type: 'short'
  answer: string
}

export type Question = McqQuestion | TfQuestion | ShortQuestion

export interface LexiconEntry {
  term: string
  definition: string
  chapter: number
  coverage: Coverage
  related: string[]
}

/**
 * What a predicted quiz is built from. The Likely Quiz page shows one tab per
 * basis, in this order.
 */
export const QUIZ_BASES = ['lecture', 'mixed', 'book'] as const
export type QuizBasis = (typeof QUIZ_BASES)[number]

/** likely-quizzes.json holds exactly this many quizzes, one per basis. */
export const LIKELY_QUIZ_COUNT = QUIZ_BASES.length

/** One predicted quiz (an entry of likely-quizzes.json). */
export interface LikelyQuiz {
  id: string
  basis: QuizBasis
  /** Exactly one quiz per unit is the primary prediction (the default tab and the home-page link). */
  primary: boolean
  title: string
  description: string
  /** Question ids from questions.json, in the order the quiz should be shown. */
  questionIds: string[]
}

export interface Assessment {
  type: string
  questions: number
  points: number
  minutes: number
  /** ISO-8601 with explicit offset, e.g. 2026-09-22T18:30:00-05:00 */
  opens: string
  closes: string
}

export interface UnitSource {
  label: string
  url: string | null
}

export interface UnitMeta {
  id: string
  title: string
  course: string
  assessment: Assessment
  sources: UnitSource[]
  scopeNotes: string[]
}

/** An assessment on the course calendar that may not have a unit folder yet. */
export interface ScheduleItem {
  title: string
  type: string
  points: number | null
  /** ISO-8601 with explicit offset, or null when the date has not been announced yet */
  at: string | null
  /** Unit id when a study unit exists for this assessment */
  unit: string | null
}

export interface Course {
  id: string
  code: string
  name: string
  term: string
  institution: string
  instructor: string
  meeting: string
  timezone: string
  textbooks: { title: string; url: string | null }[]
  schedule: ScheduleItem[]
  /** Free-form reminders shown on the home page (e.g. quizzes without dates yet). */
  notes?: string[]
}

/** Everything the app knows about one unit after discovery (no heavy data). */
export interface UnitIndex {
  meta: UnitMeta
  chapters: number[]
  hasCrossReference: boolean
  hasLexicon: boolean
  hasQuestions: boolean
  hasLikelyQuiz: boolean
}

export const CHAPTER_FILE_PATTERN = /^ch(\d{2})\.md$/
export const QUESTION_ID_PATTERN = /^[a-z0-9]+-ch\d{2}-q\d{2,}$/
