import { describe, expect, it } from 'vitest'
import { rngFromSeed } from './random.ts'
import { applyResult, buildQueue, emptyCardState, intervalFor, KNOW_INTERVALS, MISS_INTERVAL, requeue, summarize, type CardState } from './spaced.ts'

describe('spaced shuffle', () => {
  it('tracks streaks: know increments, miss resets', () => {
    let s = emptyCardState()
    s = applyResult(s, 'know')
    s = applyResult(s, 'know')
    expect(s.streak).toBe(2)
    expect(s.seen).toBe(2)
    s = applyResult(s, 'miss')
    expect(s.streak).toBe(0)
    expect(s.lastResult).toBe('miss')
  })

  it('spaces known cards further back as the streak grows and missed cards come back soon', () => {
    expect(intervalFor('miss', 5)).toBe(MISS_INTERVAL)
    expect(intervalFor('know', 1)).toBe(KNOW_INTERVALS[0])
    expect(intervalFor('know', 2)).toBe(KNOW_INTERVALS[1])
    expect(intervalFor('know', 99)).toBe(KNOW_INTERVALS[KNOW_INTERVALS.length - 1])
  })

  it('re-inserts the front card at the interval position', () => {
    const queue = ['a', 'b', 'c', 'd', 'e', 'f', 'g']
    expect(requeue(queue, 'a', 'miss', 0)).toEqual(['b', 'c', 'a', 'd', 'e', 'f', 'g'])
    expect(requeue(queue, 'a', 'know', 1)).toEqual(['b', 'c', 'd', 'e', 'a', 'f', 'g'])
  })

  it('puts the card at the end when the queue is shorter than the interval', () => {
    expect(requeue(['a', 'b'], 'a', 'know', 3)).toEqual(['b', 'a'])
    expect(requeue(['a'], 'a', 'know', 1)).toEqual(['a'])
  })

  it('deals unseen and missed cards before known ones, and is deterministic', () => {
    const ids = ['k1', 'new', 'missed', 'k2']
    const states: Record<string, CardState> = {
      k1: { streak: 3, seen: 3, lastResult: 'know' },
      k2: { streak: 2, seen: 4, lastResult: 'know' },
      missed: { streak: 0, seen: 2, lastResult: 'miss' },
    }
    const queue = buildQueue(ids, states, rngFromSeed('deck'))
    expect(queue.slice(0, 2).sort()).toEqual(['missed', 'new'])
    expect(queue.slice(2).sort()).toEqual(['k1', 'k2'])
    expect(buildQueue(ids, states, rngFromSeed('deck'))).toEqual(queue)
  })

  it('summarises the deck', () => {
    const states: Record<string, CardState> = {
      a: { streak: 1, seen: 1, lastResult: 'know' },
      b: { streak: 2, seen: 2, lastResult: 'know' },
      c: { streak: 0, seen: 1, lastResult: 'miss' },
    }
    expect(summarize(['a', 'b', 'c', 'd'], states)).toEqual({ total: 4, unseen: 2, learning: 1, known: 1 })
  })
})
