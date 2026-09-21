import { shuffle, type Rng } from './random.ts'

/**
 * "Spaced shuffle" for flashcards: a Leitner-style session queue. A card you know
 * moves further back each time (4, 9, 18, then 40 positions); a card you miss
 * comes back after 2 cards. Unseen and recently missed cards are dealt first.
 */

export type CardResult = 'know' | 'miss'

export interface CardState {
  streak: number
  seen: number
  lastResult: CardResult | null
}

export const KNOW_INTERVALS = [4, 9, 18, 40] as const
export const MISS_INTERVAL = 2

export function emptyCardState(): CardState {
  return { streak: 0, seen: 0, lastResult: null }
}

export function applyResult(state: CardState, result: CardResult): CardState {
  return {
    streak: result === 'know' ? state.streak + 1 : 0,
    seen: state.seen + 1,
    lastResult: result,
  }
}

/** Positions to move back after a result, given the streak *after* the result. */
export function intervalFor(result: CardResult, streakAfter: number): number {
  if (result === 'miss') return MISS_INTERVAL
  const idx = Math.min(KNOW_INTERVALS.length - 1, Math.max(0, streakAfter - 1))
  return KNOW_INTERVALS[idx] ?? MISS_INTERVAL
}

/**
 * Remove the front card and re-insert it `interval` positions later (or at the
 * end when the queue is shorter). The front card must be `cardId`.
 */
export function requeue(queue: readonly string[], cardId: string, result: CardResult, streakAfter: number): string[] {
  const rest = queue.filter((id, i) => !(i === 0 && id === cardId))
  const interval = intervalFor(result, streakAfter)
  const position = Math.min(interval, rest.length)
  return [...rest.slice(0, position), cardId, ...rest.slice(position)]
}

/** Priority buckets: never seen or missed last time first, then weak, then strong. */
function bucket(state: CardState | undefined): number {
  if (!state || state.seen === 0) return 0
  if (state.lastResult === 'miss') return 0
  if (state.streak < 2) return 1
  return 2
}

export function buildQueue(ids: readonly string[], states: Readonly<Record<string, CardState>>, rng: Rng): string[] {
  const shuffled = shuffle(ids, rng)
  return shuffled
    .map((id, index) => ({ id, index, bucket: bucket(states[id]) }))
    .sort((a, b) => a.bucket - b.bucket || a.index - b.index)
    .map((c) => c.id)
}

export interface DeckSummary {
  total: number
  unseen: number
  learning: number
  known: number
}

export function summarize(ids: readonly string[], states: Readonly<Record<string, CardState>>): DeckSummary {
  let unseen = 0
  let learning = 0
  let known = 0
  for (const id of ids) {
    const b = bucket(states[id])
    if (b === 0) unseen++
    else if (b === 1) learning++
    else known++
  }
  return { total: ids.length, unseen, learning, known }
}
