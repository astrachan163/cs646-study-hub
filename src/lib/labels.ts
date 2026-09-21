import { COVERAGES, type Coverage, type QuestionType } from '../content/types.ts'

export const COVERAGE_LABEL: Record<Coverage, string> = {
  'lecture+book': 'lecture + book',
  'book-only': 'book only',
  'lecture-only': 'lecture only',
  'skipped-slide': 'skipped slide',
}

export const COVERAGE_HELP: Record<Coverage, string> = {
  'lecture+book': 'Covered in lecture and in the book',
  'book-only': 'In the book, not in the lecture notes',
  'lecture-only': 'Covered in lecture, not in these chapters',
  'skipped-slide': 'On a slide the instructor skipped (low priority)',
}

/**
 * Labels for the Lexicon / Flashcards coverage chips. The "lecture only" content
 * tag is rare (often zero terms); students who tap a Lecture filter mean "things
 * I heard in class", so that chip is labelled "in lecture" and matches both
 * lecture-only and lecture+book (see matchesCoverageFilter).
 */
export const COVERAGE_FILTER_LABEL: Record<Coverage, string> = {
  ...COVERAGE_LABEL,
  'lecture-only': 'in lecture',
}

export const COVERAGE_FILTER_HELP: Record<Coverage, string> = {
  ...COVERAGE_HELP,
  'lecture-only': 'Covered in lecture (lecture-only or lecture + book)',
}

export const COVERAGE_FILTER_OPTIONS = COVERAGES.map((c) => ({
  value: c,
  label: COVERAGE_FILTER_LABEL[c],
  title: COVERAGE_FILTER_HELP[c],
}))

/**
 * True when an entry's coverage should appear under the selected Lexicon /
 * Flashcards coverage chips. Empty selection means "everything".
 */
export function matchesCoverageFilter(entryCoverage: Coverage, selected: readonly Coverage[]): boolean {
  if (selected.length === 0) return true
  for (const filter of selected) {
    if (filter === 'lecture-only') {
      if (entryCoverage === 'lecture-only' || entryCoverage === 'lecture+book') return true
    } else if (entryCoverage === filter) {
      return true
    }
  }
  return false
}

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'multiple choice',
  tf: 'true / false',
  short: 'short answer',
}
