import { useState } from 'react'
import { routes } from '../app/routes.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { useNow } from '../app/useNow.ts'
import { Countdown } from '../components/Countdown.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { getCourse } from '../content/repository.ts'
import type { UnitIndex } from '../content/types.ts'
import { bestAttempt, clearAttempts, loadAttempts, loadCardStates, loadReadChapters } from '../lib/storage.ts'
import { formatDate, formatDuration } from '../lib/time.ts'

interface UnitPageProps {
  unit: UnitIndex
  path: string
}

export function UnitPage({ unit, path }: UnitPageProps) {
  const meta = unit.meta
  useDocumentTitle(meta.title)
  const course = getCourse(meta.course)
  const now = useNow(60_000)
  const [attempts, setAttempts] = useState(() => loadAttempts(meta.id))
  const best = bestAttempt(attempts)
  const readChapters = loadReadChapters(meta.id)
  const cardStates = loadCardStates(meta.id)
  const knownCards = Object.values(cardStates).filter((s) => s.streak >= 2).length
  const a = meta.assessment

  const tools: { href: string; icon: string; title: string; meta: string; show: boolean }[] = [
    { href: routes.study(meta.id), icon: '📖', title: 'Study Guide', meta: `${unit.chapters.length} chapters with diagrams`, show: unit.chapters.length > 0 },
    { href: routes.crossReference(meta.id), icon: '🔀', title: 'Cross-Reference', meta: 'lecture ↔ book tables, what is likely', show: unit.hasCrossReference },
    { href: routes.lexicon(meta.id), icon: '📚', title: 'Lexicon', meta: 'searchable definitions by chapter', show: unit.hasLexicon },
    { href: routes.flashcards(meta.id), icon: '🃏', title: 'Flashcards', meta: 'term ↔ definition, spaced shuffle', show: unit.hasLexicon },
    { href: routes.quiz(meta.id), icon: '⏱️', title: 'Practice Quiz', meta: `${a.questions} questions in ${a.minutes} min, like the real one`, show: unit.hasQuestions },
    { href: routes.likely(meta.id), icon: '🎯', title: 'Likely Quiz', meta: 'three predictions: lecture-only, lecture + book, book-only; printable', show: unit.likelyQuizzes.length > 0 },
    { href: routes.bank(meta.id), icon: '🗂️', title: 'Question Bank', meta: 'browse and filter every question', show: unit.hasQuestions },
  ]

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <span>{meta.title}</span>
      </div>
      <h1 className="page-title">{meta.title}</h1>
      <p className="page-lead">
        {a.type === 'quiz' ? 'Quiz' : a.type}: {a.questions} questions, {a.points} points, {a.minutes} minutes.
      </p>
      <UnitNav unit={unit} currentPath={path} />

      <div className="two-col">
        <div className="stack">
          <section>
            <div className="card-grid">
              {tools
                .filter((t) => t.show)
                .map((t) => (
                  <a key={t.title} className="card tool-card" href={t.href}>
                    <span className="tool-card__icon" aria-hidden="true">
                      {t.icon}
                    </span>
                    <span className="tool-card__title">{t.title}</span>
                    <span className="tool-card__meta">{t.meta}</span>
                  </a>
                ))}
            </div>
          </section>

          <section className="card">
            <div className="section-title">
              <h2>Your practice history</h2>
              {attempts.length > 0 && (
                <button
                  type="button"
                  className="btn btn--sm btn--ghost btn--danger"
                  onClick={() => {
                    if (window.confirm('Delete all saved attempts for this unit on this device?')) {
                      clearAttempts(meta.id)
                      setAttempts([])
                    }
                  }}
                >
                  Clear history
                </button>
              )}
            </div>
            {attempts.length === 0 ? (
              <p className="muted">
                No attempts yet. <a href={routes.quiz(meta.id)}>Take a practice quiz</a> and your scores will appear here (saved in this browser only).
              </p>
            ) : (
              <>
                <div className="progress-line" style={{ marginBottom: '0.6rem' }}>
                  <span>
                    best <strong>{best?.percent}%</strong>
                  </span>
                  <span>{attempts.length} attempt{attempts.length === 1 ? '' : 's'}</span>
                  <span>{readChapters.length}/{unit.chapters.length} chapters opened</span>
                  {unit.hasLexicon && <span>{knownCards} flashcards known</span>}
                </div>
                <div className="table-wrap">
                  <table className="table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Score</th>
                        <th>Time</th>
                        <th>Mode</th>
                        <th></th>
                      </tr>
                    </thead>
                    <tbody>
                      {attempts.slice(0, 10).map((attempt) => (
                        <tr key={attempt.id}>
                          <td>{formatDate(attempt.finishedAt)}</td>
                          <td>
                            <strong>{attempt.correct}/{attempt.total}</strong> ({attempt.percent}%)
                          </td>
                          <td>{formatDuration(attempt.seconds)}</td>
                          <td>{attempt.mode === 'instant' ? 'instant feedback' : 'feedback at end'}</td>
                          <td className="row">
                            <a className="btn btn--sm" href={routes.quiz(meta.id, new URLSearchParams(attempt.config))}>
                              Retake
                            </a>
                            {attempt.missedIds.length > 0 && (
                              <a
                                className="btn btn--sm"
                                href={routes.quiz(
                                  meta.id,
                                  new URLSearchParams({ ids: attempt.missedIds.join(','), n: String(attempt.missedIds.length), seed: `${attempt.id}-retry` }),
                                )}
                              >
                                Retry {attempt.missedIds.length} missed
                              </a>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </section>
        </div>

        <aside className="stack">
          <Countdown
            label={Date.parse(a.opens) > now ? 'Time until the real quiz' : 'Real quiz'}
            title={`${meta.title}`}
            at={a.opens}
            timeZone={course?.timezone}
            facts={`${a.questions} q · ${a.points} pts · ${a.minutes} min`}
          />
          {meta.scopeNotes.length > 0 && (
            <section className="card card--tight">
              <h3>Scope notes</h3>
              <ul className="small" style={{ paddingLeft: '1.1rem', margin: 0 }}>
                {meta.scopeNotes.map((note) => (
                  <li key={note}>{note}</li>
                ))}
              </ul>
            </section>
          )}
          {meta.sources.length > 0 && (
            <section className="card card--tight">
              <h3>Sources</h3>
              <ul className="small" style={{ paddingLeft: '1.1rem', margin: 0 }}>
                {meta.sources.map((s) => (
                  <li key={s.label}>
                    {s.url ? (
                      <a href={s.url} target="_blank" rel="noreferrer">
                        {s.label}
                      </a>
                    ) : (
                      s.label
                    )}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </aside>
      </div>
    </>
  )
}
