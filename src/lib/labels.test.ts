import { describe, expect, it } from 'vitest'
import { matchesCoverageFilter } from './labels.ts'

describe('matchesCoverageFilter', () => {
  it('treats an empty selection as "all coverages"', () => {
    expect(matchesCoverageFilter('book-only', [])).toBe(true)
    expect(matchesCoverageFilter('lecture+book', [])).toBe(true)
  })

  it('matches exact coverages other than lecture-only', () => {
    expect(matchesCoverageFilter('book-only', ['book-only'])).toBe(true)
    expect(matchesCoverageFilter('lecture+book', ['book-only'])).toBe(false)
    expect(matchesCoverageFilter('skipped-slide', ['skipped-slide'])).toBe(true)
    expect(matchesCoverageFilter('lecture+book', ['lecture+book'])).toBe(true)
  })

  it('the "in lecture" (lecture-only) chip includes lecture+book terms', () => {
    // Quiz 1 has 0 lecture-only lexicon terms and 67 lecture+book terms; without
    // this expansion the Lecture filter on Flashcards shows an empty deck.
    expect(matchesCoverageFilter('lecture-only', ['lecture-only'])).toBe(true)
    expect(matchesCoverageFilter('lecture+book', ['lecture-only'])).toBe(true)
    expect(matchesCoverageFilter('book-only', ['lecture-only'])).toBe(false)
    expect(matchesCoverageFilter('skipped-slide', ['lecture-only'])).toBe(false)
  })

  it('OR-combines multiple selected chips', () => {
    expect(matchesCoverageFilter('book-only', ['lecture-only', 'book-only'])).toBe(true)
    expect(matchesCoverageFilter('lecture+book', ['lecture-only', 'book-only'])).toBe(true)
    expect(matchesCoverageFilter('skipped-slide', ['lecture-only', 'book-only'])).toBe(false)
  })
})
