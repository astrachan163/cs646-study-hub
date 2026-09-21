import type { Coverage, Difficulty, Likelihood, QuestionType } from '../content/types.ts'
import { COVERAGE_HELP, COVERAGE_LABEL, TYPE_LABEL } from '../lib/labels.ts'
import type { Verdict } from '../lib/score.ts'

const COVERAGE_CLASS: Record<Coverage, string> = {
  'lecture+book': 'badge--lecture-book',
  'book-only': 'badge--book-only',
  'lecture-only': 'badge--lecture-only',
  'skipped-slide': 'badge--skipped-slide',
}

export function CoverageBadge({ coverage }: { coverage: Coverage }) {
  return (
    <span className={`badge ${COVERAGE_CLASS[coverage]}`} title={COVERAGE_HELP[coverage]}>
      {COVERAGE_LABEL[coverage]}
    </span>
  )
}

export function LikelihoodBadge({ likelihood }: { likelihood: Likelihood }) {
  return (
    <span className={`badge badge--${likelihood}`} title={`${likelihood} likelihood of appearing on the real quiz`}>
      {likelihood} likelihood
    </span>
  )
}

export function DifficultyBadge({ difficulty }: { difficulty: Difficulty }) {
  return <span className={`badge badge--${difficulty}`}>{difficulty}</span>
}

export function ChapterBadge({ chapter }: { chapter: number }) {
  return <span className="badge badge--chapter">ch {chapter}</span>
}

export function TypeBadge({ type }: { type: QuestionType }) {
  return <span className="badge badge--type">{TYPE_LABEL[type]}</span>
}

const VERDICT_LABEL: Record<Verdict, string> = {
  correct: 'correct',
  incorrect: 'incorrect',
  unanswered: 'unanswered',
  pending: 'grade yourself',
}

export function VerdictBadge({ verdict }: { verdict: Verdict }) {
  return <span className={`badge badge--${verdict}`}>{VERDICT_LABEL[verdict]}</span>
}
