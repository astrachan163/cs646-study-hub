import { useState, type CSSProperties } from 'react'
import { ChapterBadge, CoverageBadge, DifficultyBadge, LikelihoodBadge, VerdictBadge } from '../../components/Badge.tsx'
import type { Question } from '../../content/types.ts'
import { describeQuizConfig, type QuizConfig } from '../../lib/quizConfig.ts'
import { judge, letterGrade, type AnswerRecord, type AttemptScore } from '../../lib/score.ts'
import { formatDuration } from '../../lib/time.ts'
import { correctAnswerText, responseText } from '../../lib/answers.ts'
import { QuestionBody } from './QuestionBody.tsx'

interface QuizResultsProps {
  questions: Question[]
  config: QuizConfig
  records: Map<string, AnswerRecord>
  score: AttemptScore
  seconds: number
  autoSubmitted: boolean
  shareUrl: string
  onSelfGrade: (questionId: string, correct: boolean) => void
  onRetryMissed: () => void
  onRetake: () => void
  onNewQuiz: () => void
}

export function QuizResults({ questions, config, records, score, seconds, autoSubmitted, shareUrl, onSelfGrade, onRetryMissed, onRetake, onNewQuiz }: QuizResultsProps) {
  const [missedOnly, setMissedOnly] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', shareUrl)
    }
  }

  const shown = questions.filter((q) => !missedOnly || judge(q, records.get(q.id)) !== 'correct')

  return (
    <>
      <section className="card">
        {autoSubmitted && <div className="alert alert--danger">Time ran out, so the quiz was submitted automatically.</div>}
        {score.pending > 0 && (
          <div className="alert alert--info">
            {score.pending} short-answer question{score.pending === 1 ? '' : 's'} still need{score.pending === 1 ? 's' : ''} your self-grade below; the score updates as you grade.
          </div>
        )}
        <div className="score-hero">
          <div className="score-ring" style={{ '--pct': score.percent } as CSSProperties}>
            <div className="score-ring__inner">
              <div>
                <div className="score-ring__num">{score.percent}%</div>
                <div className="score-ring__sub">grade {letterGrade(score.percent)}</div>
              </div>
            </div>
          </div>
          <div>
            <h2 style={{ marginBottom: '0.3rem' }}>
              {score.correct} of {score.total} correct
            </h2>
            <div className="score-facts">
              <span>
                <strong>
                  {score.points}/{score.pointsTotal}
                </strong>{' '}
                points
              </span>
              <span>
                time <strong>{formatDuration(seconds)}</strong>
                {config.timerMinutes > 0 ? ` of ${config.timerMinutes}:00` : ''}
              </span>
              {score.unanswered > 0 && (
                <span>
                  <strong>{score.unanswered}</strong> unanswered
                </span>
              )}
            </div>
            <p className="small muted" style={{ margin: '0.5rem 0 0.8rem' }}>
              {describeQuizConfig(config)} · seed <code>{config.seed}</code>
            </p>
            <div className="row">
              {score.missedIds.length > 0 && (
                <button type="button" className="btn btn--primary" onClick={onRetryMissed}>
                  Retry {score.missedIds.length} missed only
                </button>
              )}
              <button type="button" className="btn" onClick={onRetake}>
                Retake same quiz
              </button>
              <button type="button" className="btn" onClick={onNewQuiz}>
                New quiz
              </button>
              <button type="button" className="btn" onClick={copyLink}>
                {copied ? 'Link copied ✓' : 'Copy share link'}
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="section-title">
          <h2>Review</h2>
          <button type="button" className="chip" aria-pressed={missedOnly} onClick={() => setMissedOnly((m) => !m)}>
            {missedOnly ? 'showing missed only' : 'show missed only'}
          </button>
        </div>
        <div className="stack">
          {shown.length === 0 && <div className="card empty">Nothing missed. Well done.</div>}
          {shown.map((q, i) => {
            const record = records.get(q.id)
            const verdict = judge(q, record)
            const number = questions.indexOf(q) + 1
            return (
              <article className="card review-item" key={q.id}>
                <div className="review-item__head">
                  <strong>Q{number}</strong>
                  <VerdictBadge verdict={verdict} />
                  <ChapterBadge chapter={q.chapter} />
                  <CoverageBadge coverage={q.coverage} />
                  <LikelihoodBadge likelihood={q.likelihood} />
                  <DifficultyBadge difficulty={q.difficulty} />
                </div>
                <div className="review-item__prompt">{q.prompt}</div>
                {q.type === 'short' ? (
                  <QuestionBody question={q} record={record} revealed onRespond={() => undefined} onSelfGrade={verdict === 'pending' ? (correct) => onSelfGrade(q.id, correct) : undefined} />
                ) : (
                  <>
                    <div className={`answer-line answer-line--yours${verdict === 'correct' ? '' : ' is-wrong'}`}>
                      Your answer: {responseText(q, record?.response ?? null)}
                    </div>
                    {verdict !== 'correct' && <div className="answer-line answer-line--correct">Correct answer: {correctAnswerText(q)}</div>}
                  </>
                )}
                <div className="feedback" style={{ marginTop: '0.7rem' }}>
                  <div>{q.explanation}</div>
                  <div className="feedback__source">
                    Source: {q.source.book ?? '—'}
                    {q.source.lecture ? ` · ${q.source.lecture}` : ''} · {q.section}
                  </div>
                </div>
                {i === shown.length - 1 && <span className="visually-hidden">end of review</span>}
              </article>
            )
          })}
        </div>
      </section>
    </>
  )
}
