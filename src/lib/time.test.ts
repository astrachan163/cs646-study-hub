import { describe, expect, it } from 'vitest'
import { countdownParts, formatCountdown, formatDuration } from './time.ts'

describe('time helpers', () => {
  it('formats durations as m:ss and h:mm:ss', () => {
    expect(formatDuration(0)).toBe('0:00')
    expect(formatDuration(65)).toBe('1:05')
    expect(formatDuration(600)).toBe('10:00')
    expect(formatDuration(3661)).toBe('1:01:01')
    expect(formatDuration(-5)).toBe('0:00')
  })
  it('splits a countdown into parts and flags the past', () => {
    const parts = countdownParts(2 * 86400_000 + 3 * 3600_000 + 4 * 60_000 + 5_000)
    expect(parts).toEqual({ days: 2, hours: 3, minutes: 4, seconds: 5, past: false })
    expect(countdownParts(-1000).past).toBe(true)
  })
  it('formats a human countdown', () => {
    expect(formatCountdown(2 * 86400_000 + 3600_000)).toBe('2d 1h 0m')
    expect(formatCountdown(3600_000 + 61_000)).toBe('1h 1m 1s')
    expect(formatCountdown(59_000)).toBe('0m 59s')
    expect(formatCountdown(-1)).toBe('started')
  })
})
