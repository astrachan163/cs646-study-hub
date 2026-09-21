import type { FeedbackMode } from './quizConfig.ts'
import type { CardState } from './spaced.ts'

/**
 * All persistence is localStorage (no backend, no login). Keys are namespaced
 * and versioned so a future format change cannot corrupt old data.
 */
const PREFIX = 'cs646-study-hub:v1'

function key(...parts: string[]): string {
  return [PREFIX, ...parts].join(':')
}

function safeStorage(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

function readJson<T>(k: string, guard: (value: unknown) => value is T, fallback: T): T {
  const storage = safeStorage()
  if (!storage) return fallback
  try {
    const raw = storage.getItem(k)
    if (raw === null) return fallback
    const parsed: unknown = JSON.parse(raw)
    return guard(parsed) ? parsed : fallback
  } catch {
    return fallback
  }
}

function writeJson(k: string, value: unknown): void {
  const storage = safeStorage()
  if (!storage) return
  try {
    storage.setItem(k, JSON.stringify(value))
  } catch {
    // Quota exceeded or private mode: progress simply is not saved.
  }
}

// ------------------------------------------------------------------ theme

export type Theme = 'light' | 'dark'

export function loadTheme(): Theme | null {
  const storage = safeStorage()
  const value = storage?.getItem(key('theme'))
  return value === 'light' || value === 'dark' ? value : null
}

export function saveTheme(theme: Theme): void {
  safeStorage()?.setItem(key('theme'), theme)
}

// --------------------------------------------------------------- attempts

export interface AttemptRecord {
  id: string
  unitId: string
  finishedAt: string
  correct: number
  total: number
  percent: number
  points: number
  pointsTotal: number
  seconds: number
  /** Serialized quiz configuration query string (so "retry same quiz" works). */
  config: string
  missedIds: string[]
  mode: FeedbackMode
}

function isAttemptRecord(value: unknown): value is AttemptRecord {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.id === 'string' &&
    typeof v.unitId === 'string' &&
    typeof v.finishedAt === 'string' &&
    typeof v.correct === 'number' &&
    typeof v.total === 'number' &&
    typeof v.percent === 'number' &&
    typeof v.points === 'number' &&
    typeof v.pointsTotal === 'number' &&
    typeof v.seconds === 'number' &&
    typeof v.config === 'string' &&
    Array.isArray(v.missedIds) &&
    (v.mode === 'instant' || v.mode === 'end')
  )
}

function isAttemptList(value: unknown): value is AttemptRecord[] {
  return Array.isArray(value) && value.every(isAttemptRecord)
}

const MAX_ATTEMPTS = 50

export function loadAttempts(unitId: string): AttemptRecord[] {
  return readJson(key('attempts', unitId), isAttemptList, [])
}

/** Inserts a new attempt or replaces the one with the same id (self-grading updates a finished attempt). */
export function saveAttempt(record: AttemptRecord): AttemptRecord[] {
  const others = loadAttempts(record.unitId).filter((a) => a.id !== record.id)
  const next = [record, ...others].slice(0, MAX_ATTEMPTS)
  writeJson(key('attempts', record.unitId), next)
  return next
}

export function clearAttempts(unitId: string): void {
  writeJson(key('attempts', unitId), [])
}

export function bestAttempt(attempts: readonly AttemptRecord[]): AttemptRecord | null {
  let best: AttemptRecord | null = null
  for (const a of attempts) if (!best || a.percent > best.percent) best = a
  return best
}

// ------------------------------------------------------------- flashcards

function isCardState(value: unknown): value is CardState {
  if (typeof value !== 'object' || value === null) return false
  const v = value as Record<string, unknown>
  return (
    typeof v.streak === 'number' &&
    typeof v.seen === 'number' &&
    (v.lastResult === null || v.lastResult === 'know' || v.lastResult === 'miss')
  )
}

function isCardStateMap(value: unknown): value is Record<string, CardState> {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && Object.values(value).every(isCardState)
}

export function loadCardStates(unitId: string): Record<string, CardState> {
  return readJson(key('flashcards', unitId), isCardStateMap, {})
}

export function saveCardStates(unitId: string, states: Record<string, CardState>): void {
  writeJson(key('flashcards', unitId), states)
}

export function clearCardStates(unitId: string): void {
  writeJson(key('flashcards', unitId), {})
}

// ---------------------------------------------------------------- reading

function isStringList(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

/** Chapters the student has opened, shown as progress on the unit hub. */
export function loadReadChapters(unitId: string): string[] {
  return readJson(key('read', unitId), isStringList, [])
}

export function markChapterRead(unitId: string, chapter: number): void {
  const list = new Set(loadReadChapters(unitId))
  list.add(String(chapter))
  writeJson(key('read', unitId), [...list])
}
