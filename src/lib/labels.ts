import type { Coverage, QuestionType } from '../content/types.ts'

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

export const TYPE_LABEL: Record<QuestionType, string> = {
  mcq: 'multiple choice',
  tf: 'true / false',
  short: 'short answer',
}
