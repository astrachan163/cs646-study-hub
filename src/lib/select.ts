import type { Coverage, Difficulty, Likelihood, Question, QuestionType } from '../content/types.ts'
import type { Rng } from './random.ts'

export interface QuestionFilters {
  /** Empty means "all chapters". */
  chapters?: number[]
  coverage?: Coverage[]
  difficulty?: Difficulty[]
  likelihood?: Likelihood[]
  types?: QuestionType[]
  /** Restrict to exactly these ids (used for "retry missed only"). */
  ids?: string[]
  /** Case-insensitive text search over prompt, section, tags and choices. */
  search?: string
}

function includesOrAll<T>(allowed: T[] | undefined, value: T): boolean {
  return !allowed || allowed.length === 0 || allowed.includes(value)
}

export function matchesSearch(question: Question, search: string): boolean {
  const needle = search.trim().toLowerCase()
  if (!needle) return true
  const haystack = [
    question.id,
    question.prompt,
    question.section,
    question.explanation,
    ...question.tags,
    ...(question.type === 'mcq' ? question.choices : []),
  ]
    .join(' \n ')
    .toLowerCase()
  return haystack.includes(needle)
}

export function filterQuestions(questions: readonly Question[], filters: QuestionFilters): Question[] {
  const idSet = filters.ids && filters.ids.length > 0 ? new Set(filters.ids) : null
  return questions.filter(
    (q) =>
      includesOrAll(filters.chapters, q.chapter) &&
      includesOrAll(filters.coverage, q.coverage) &&
      includesOrAll(filters.difficulty, q.difficulty) &&
      includesOrAll(filters.likelihood, q.likelihood) &&
      includesOrAll(filters.types, q.type) &&
      (idSet === null || idSet.has(q.id)) &&
      (filters.search === undefined || matchesSearch(q, filters.search)),
  )
}

/** Questions the instructor is likely to ask appear about 4x as often as unlikely ones. */
export const LIKELIHOOD_WEIGHTS: Record<Likelihood, number> = { high: 4, medium: 2, low: 1 }

/**
 * Weighted sampling without replacement (Efraimidis & Spirakis, 2006): each item
 * gets key = u^(1/weight) with u uniform in (0,1); the n largest keys win.
 * Source: https://doi.org/10.1016/j.ipl.2005.11.003
 */
export function selectWeighted(pool: readonly Question[], n: number, rng: Rng): Question[] {
  const keyed = pool.map((question) => {
    const weight = LIKELIHOOD_WEIGHTS[question.likelihood]
    // Avoid u = 0, which would give every item the same key of 0.
    const u = Math.max(rng(), Number.EPSILON)
    return { question, key: Math.pow(u, 1 / weight) }
  })
  keyed.sort((a, b) => b.key - a.key)
  return keyed.slice(0, Math.max(0, Math.min(n, keyed.length))).map((k) => k.question)
}

export interface SelectionResult {
  questions: Question[]
  /** How many the configuration asked for. */
  requested: number
  /** How many questions matched the filters before sampling. */
  poolSize: number
}

export interface SelectionRequest {
  n: number
  filters: QuestionFilters
  /** When set, ignore filters and return exactly these ids in this order (predicted quiz). */
  orderedIds?: string[]
}

export function selectQuiz(
  questions: readonly Question[],
  request: SelectionRequest,
  rng: Rng,
): SelectionResult {
  if (request.orderedIds && request.orderedIds.length > 0) {
    const byId = new Map(questions.map((q) => [q.id, q]))
    const ordered = request.orderedIds.flatMap((id) => {
      const q = byId.get(id)
      return q ? [q] : []
    })
    return { questions: ordered, requested: request.orderedIds.length, poolSize: ordered.length }
  }
  const pool = filterQuestions(questions, request.filters)
  const picked = selectWeighted(pool, request.n, rng)
  return { questions: picked, requested: request.n, poolSize: pool.length }
}
