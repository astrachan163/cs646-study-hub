import { useEffect, useMemo, useState } from 'react'
import { useNow } from '../../app/useNow.ts'
import { ChapterBadge, CoverageBadge, DifficultyBadge, LikelihoodBadge, TypeBadge } from '../../components/Badge.tsx'
import type { Question } from '../../content/types.ts'
import type { QuizConfig } from '../../lib/quizConfig.ts'
import { judge, type AnswerRecord, type Response } from '../../lib/score.ts'
import { formatDuration } from '../../lib/time.ts'
import { QuestionBody } from './QuestionBody.tsx'

interface QuizRunnerProps {
  questions: Question[]
  config: QuizConfig
  records: Map<string, AnswerRecord>
  startedAt: number
  onRespond: (questionId: string, response: Response) => void
  onSelfGrade: (questionId: string, correct: boolean) => void
  onFinish: (auto: boolean) => void
  onAbandon: () => void
}

export function QuizRunner({ questions, config, records, startedAt, onRespond, onSelfGrade, onFinish, onAbandon }: QuizRunnerProps) {
  const [index, setIndex] = useState(0)
  // In instant mode, the current question is revealed once the student commits an answer.
  const [revealedIds, setRevealedIds] = useState<Set<string>>(() => new Set())
  const timed = config.timerMinutes > 0
  const now = useNow(500, timed)
  const totalSeconds = config.timerMinutes * 60
  const elapsed = Math.floor((now - startedAt) / 1000)
  const remaining = totalSeconds - elapsed

  useEffect(() => {
    if (timed && remaining <= 0) onFinish(true)
  }, [timed, remaining, onFinish])

  const question = questions[index]
  const record = question ? records.get(question.id) : undefined
  const revealed = question ? config.feedback === 'instant' && revealedIds.has(question.id) : false
  const answeredCount = useMemo(
    () => questions.filter((q) => judge(q, records.get(q.id)) !== 'unanswered').length,
    [questions, records],
  )
  const isLast = index === questions.length - 1

  const reveal = () => {
    if (!question) return
    setRevealedIds((s) => new Set(s).add(question.id))
  }

  const respond = (response: Response) => {
    if (!question) return
    onRespond(question.id, response)
    // Multiple choice and true/false lock in immediately in instant mode; short answers wait for "Check".
    if (config.feedback === 'instant' && question.type !== 'short') reveal()
  }

  const goNext = () => {
    if (isLast) onFinish(false)
    else setIndex((i) => i + 1)
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!question) return
      if (e.target instanceof HTMLElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
      if (question.type === 'mcq' && !revealed) {
        const n = Number.parseInt(e.key, 10)
        if (n >= 1 && n <= question.choices.length) {
          respond(n - 1)
          return
        }
        const letter = e.key.toUpperCase()
        const idx = letter.charCodeAt(0) - 65
        if (letter.length === 1 && idx >= 0 && idx < question.choices.length) {
          respond(idx)
          return
        }
      }
      if (question.type === 'tf' && !revealed) {
        if (e.key.toLowerCase() === 't') respond(true)
        if (e.key.toLowerCase() === 'f') respond(false)
      }
      if (e.key === 'Enter' && e.target instanceof HTMLElement && e.target.tagName !== 'BUTTON') {
        if (config.feedback === 'instant' && !revealed) {
          if (question.type === 'short' && record?.response) reveal()
        } else {
          goNext()
        }
      }
      if (e.key === 'ArrowRight' && config.feedback === 'end' && !isLast) setIndex((i) => i + 1)
      if (e.key === 'ArrowLeft' && config.feedback === 'end' && index > 0) setIndex((i) => i - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  if (!question) return <div className="card empty">No questions to show.</div>

  const verdict = judge(question, record)
  const canAdvanceInstant = config.feedback !== 'instant' || (revealed && verdict !== 'pending')

  return (
    <>
      <div className="quiz-top">
        <div>
          <strong>
            Question {index + 1} of {questions.length}
          </strong>
          <span className="muted small"> · {answeredCount} answered</span>
        </div>
        {timed ? (
          <div className={`timer${remaining <= 60 ? ' timer--warning' : ''}`} role="timer" aria-live={remaining <= 60 ? 'polite' : 'off'} aria-label="Time remaining">
            ⏱ {formatDuration(Math.max(0, remaining))}
          </div>
        ) : (
          <div className="timer" role="timer" aria-label="Time elapsed">
            ⏱ {formatDuration(elapsed)}
          </div>
        )}
      </div>
      <div className="progress" aria-hidden="true">
        <div className="progress__bar" style={{ width: `${((index + 1) / questions.length) * 100}%` }} />
      </div>

      <article className="card question" aria-live="polite">
        <div className="question__meta">
          <ChapterBadge chapter={question.chapter} />
          <TypeBadge type={question.type} />
          {revealed && (
            <>
              <CoverageBadge coverage={question.coverage} />
              <LikelihoodBadge likelihood={question.likelihood} />
              <DifficultyBadge difficulty={question.difficulty} />
            </>
          )}
        </div>
        <div className="question__prompt">{question.prompt}</div>
        <QuestionBody question={question} record={record} revealed={revealed} onRespond={respond} onSelfGrade={(correct) => onSelfGrade(question.id, correct)} />

        {revealed && question.type !== 'short' && (
          <div className={`feedback feedback--${verdict === 'correct' ? 'correct' : 'incorrect'}`}>
            <div className="feedback__title">{verdict === 'correct' ? '✓ Correct' : '✗ Not quite'}</div>
            <div>{question.explanation}</div>
            <div className="feedback__source">
              Source: {question.source.book ?? '—'}
              {question.source.lecture ? ` · ${question.source.lecture}` : ''} · section: {question.section}
            </div>
          </div>
        )}
        {revealed && question.type === 'short' && (
          <div className="feedback">
            <div className="feedback__title">Explanation</div>
            <div>{question.explanation}</div>
            <div className="feedback__source">
              Source: {question.source.book ?? '—'}
              {question.source.lecture ? ` · ${question.source.lecture}` : ''}
            </div>
          </div>
        )}

        <div className="quiz-actions">
          <div className="row">
            {config.feedback === 'end' && (
              <button type="button" className="btn" onClick={() => setIndex((i) => Math.max(0, i - 1))} disabled={index === 0}>
                ← Previous
              </button>
            )}
            <button type="button" className="btn btn--ghost btn--danger btn--sm" onClick={onAbandon}>
              Quit quiz
            </button>
          </div>
          <div className="row">
            {config.feedback === 'instant' && question.type === 'short' && !revealed && (
              <button type="button" className="btn btn--primary" onClick={reveal} disabled={!record?.response}>
                Check answer
              </button>
            )}
            {config.feedback === 'instant' && canAdvanceInstant && (
              <button type="button" className="btn btn--primary" onClick={goNext}>
                {isLast ? 'See results' : 'Next →'}
              </button>
            )}
            {config.feedback === 'end' && !isLast && (
              <button type="button" className="btn btn--primary" onClick={goNext}>
                Next →
              </button>
            )}
            {config.feedback === 'end' && (
              <button
                type="button"
                className={`btn ${isLast ? 'btn--primary' : ''}`}
                onClick={() => {
                  const unanswered = questions.length - answeredCount
                  if (unanswered === 0 || window.confirm(`${unanswered} question${unanswered === 1 ? ' is' : 's are'} unanswered. Submit anyway?`)) onFinish(false)
                }}
              >
                Submit quiz
              </button>
            )}
          </div>
        </div>
      </article>

      {config.feedback === 'end' && (
        <div className="palette" aria-label="Jump to question">
          {questions.map((q, i) => {
            const answered = judge(q, records.get(q.id)) !== 'unanswered'
            return (
              <button
                type="button"
                key={q.id}
                className={`${answered ? 'is-answered' : ''}${i === index ? ' is-current' : ''}`}
                onClick={() => setIndex(i)}
                aria-label={`Question ${i + 1}${answered ? ', answered' : ''}`}
                aria-current={i === index ? 'true' : undefined}
              >
                {i + 1}
              </button>
            )
          })}
        </div>
      )}
      <p className="kbd-hint no-print" style={{ marginTop: '0.8rem' }}>
        Keyboard: <kbd>1</kbd>–<kbd>4</kbd> or <kbd>A</kbd>–<kbd>D</kbd> choose · <kbd>T</kbd>/<kbd>F</kbd> true/false · <kbd>Enter</kbd> next
      </p>
    </>
  )
}
