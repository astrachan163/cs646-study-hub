import {
  COVERAGES,
  DIFFICULTIES,
  LIKELIHOODS,
  type Coverage,
  type Difficulty,
  type Likelihood,
  type QuizBasis,
  type UnitMeta,
} from '../content/types.ts'
import { BASIS_LABEL, parseQuizBasis } from './likelyQuizzes.ts'

export type FeedbackMode = 'instant' | 'end'
export type QuizSet = 'random' | 'likely'

/**
 * Everything that defines a practice quiz. Serialised into the URL so a link
 * like `#/unit/<id>/quiz?n=20&ch=1,2&fb=end&seed=k3v9x2` recreates it exactly.
 */
export interface QuizConfig {
  n: number
  chapters: number[]
  coverage: Coverage[]
  difficulty: Difficulty[]
  likelihood: Likelihood[]
  feedback: FeedbackMode
  /** 0 means untimed. */
  timerMinutes: number
  seed: string
  /** Explicit question ids (retry missed only). Empty means "pick randomly". */
  ids: string[]
  set: QuizSet
  /** Which predicted quiz when `set` is "likely"; null means the unit's primary prediction. */
  likelyQuiz: QuizBasis | null
}

export function defaultQuizConfig(unit: UnitMeta, seed: string): QuizConfig {
  return {
    n: unit.assessment.questions,
    chapters: [],
    coverage: [],
    difficulty: [],
    likelihood: [],
    feedback: 'instant',
    timerMinutes: unit.assessment.minutes,
    seed,
    ids: [],
    set: 'random',
    likelyQuiz: null,
  }
}

/** `?start=1` makes the quiz page begin at once instead of showing the setup screen. */
export const AUTOSTART_PARAM = 'start'

export function isAutostartRequested(params: URLSearchParams): boolean {
  return params.get(AUTOSTART_PARAM) === '1'
}

/**
 * The link behind "Take this as a timed practice quiz": the given predicted quiz,
 * in order, with the real quiz's timer (the unit default) and feedback only at the end.
 */
export function likelyQuizLaunchParams(basis: QuizBasis): URLSearchParams {
  return new URLSearchParams({ set: 'likely', lq: basis, fb: 'end', [AUTOSTART_PARAM]: '1' })
}

function parseList(value: string | null): string[] {
  if (!value) return []
  return value
    .split(',')
    .map((v) => v.trim())
    .filter((v) => v.length > 0)
}

function parseEnumList<T extends string>(value: string | null, allowed: readonly T[]): T[] {
  const normalised = parseList(value).map((v) => v.replace(/ /g, '+'))
  return allowed.filter((a) => normalised.includes(a))
}

function parseIntOr(value: string | null, fallback: number, min: number, max: number): number {
  if (value === null) return fallback
  const n = Number.parseInt(value, 10)
  if (!Number.isFinite(n)) return fallback
  return Math.min(max, Math.max(min, n))
}

export function parseQuizConfig(params: URLSearchParams, defaults: QuizConfig): QuizConfig {
  const chapters = parseList(params.get('ch'))
    .map((v) => Number.parseInt(v, 10))
    .filter((n) => Number.isInteger(n) && n > 0)
  const feedbackRaw = params.get('fb')
  const setRaw = params.get('set')
  return {
    n: parseIntOr(params.get('n'), defaults.n, 1, 200),
    chapters: [...new Set(chapters)].sort((a, b) => a - b),
    coverage: parseEnumList(params.get('cov'), COVERAGES),
    difficulty: parseEnumList(params.get('diff'), DIFFICULTIES),
    likelihood: parseEnumList(params.get('lik'), LIKELIHOODS),
    feedback: feedbackRaw === 'end' ? 'end' : feedbackRaw === 'instant' ? 'instant' : defaults.feedback,
    timerMinutes: parseIntOr(params.get('t'), defaults.timerMinutes, 0, 180),
    seed: params.get('seed')?.trim() || defaults.seed,
    ids: parseList(params.get('ids')),
    set: setRaw === 'likely' ? 'likely' : 'random',
    likelyQuiz: setRaw === 'likely' ? parseQuizBasis(params.get('lq')) : null,
  }
}

/** Only non-default values are written so shared links stay short. The seed is always written. */
export function serializeQuizConfig(config: QuizConfig, defaults: QuizConfig): URLSearchParams {
  const params = new URLSearchParams()
  if (config.set === 'likely') {
    params.set('set', 'likely')
    if (config.likelyQuiz !== null) params.set('lq', config.likelyQuiz)
  }
  if (config.n !== defaults.n) params.set('n', String(config.n))
  if (config.chapters.length > 0) params.set('ch', config.chapters.join(','))
  if (config.coverage.length > 0) params.set('cov', config.coverage.join(','))
  if (config.difficulty.length > 0) params.set('diff', config.difficulty.join(','))
  if (config.likelihood.length > 0) params.set('lik', config.likelihood.join(','))
  if (config.feedback !== defaults.feedback) params.set('fb', config.feedback)
  if (config.timerMinutes !== defaults.timerMinutes) params.set('t', String(config.timerMinutes))
  if (config.ids.length > 0) params.set('ids', config.ids.join(','))
  params.set('seed', config.seed)
  return params
}

/** Human summary used on the setup screen and in attempt history. */
export function describeQuizConfig(config: QuizConfig): string {
  if (config.set === 'likely') {
    const which = config.likelyQuiz === null ? '' : ` (${BASIS_LABEL[config.likelyQuiz].toLowerCase()})`
    return `Predicted quiz${which}, in order`
  }
  const parts: string[] = []
  parts.push(config.ids.length > 0 ? `${config.ids.length} chosen questions` : `${config.n} questions`)
  if (config.chapters.length > 0) parts.push(`ch ${config.chapters.join(', ')}`)
  if (config.coverage.length > 0) parts.push(config.coverage.join('/'))
  if (config.difficulty.length > 0) parts.push(config.difficulty.join('/'))
  if (config.likelihood.length > 0) parts.push(`${config.likelihood.join('/')} likelihood`)
  parts.push(config.timerMinutes > 0 ? `${config.timerMinutes} min` : 'untimed')
  parts.push(config.feedback === 'instant' ? 'instant feedback' : 'feedback at end')
  return parts.join(' · ')
}
