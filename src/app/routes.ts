import type { QuizBasis } from '../content/types.ts'
import { buildHash } from '../lib/router.ts'

/** Central place for every URL the app links to, so a route change is a one-line edit. */
export const routes = {
  home: () => '#/',
  unit: (unitId: string) => buildHash(`/unit/${unitId}`),
  study: (unitId: string, chapter?: number) =>
    buildHash(chapter === undefined ? `/unit/${unitId}/study` : `/unit/${unitId}/study/${chapter}`),
  crossReference: (unitId: string) => buildHash(`/unit/${unitId}/cross-reference`),
  lexicon: (unitId: string, search?: string) =>
    buildHash(`/unit/${unitId}/lexicon`, search ? { q: search } : undefined),
  flashcards: (unitId: string) => buildHash(`/unit/${unitId}/flashcards`),
  quiz: (unitId: string, params?: URLSearchParams) => buildHash(`/unit/${unitId}/quiz`, params),
  /** Without a basis the page opens the unit's primary prediction. */
  likely: (unitId: string, basis?: QuizBasis) =>
    buildHash(basis === undefined ? `/unit/${unitId}/likely` : `/unit/${unitId}/likely/${basis}`),
  bank: (unitId: string, params?: URLSearchParams) => buildHash(`/unit/${unitId}/bank`, params),
} as const
