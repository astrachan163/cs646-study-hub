import { useMemo, useState } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { ChapterBadge, CoverageBadge, LikelihoodBadge, TypeBadge } from '../components/Badge.tsx'
import { Empty, ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadQuestions } from '../content/repository.ts'
import type { LikelyQuiz, Question, UnitIndex } from '../content/types.ts'
import { correctAnswerText } from '../lib/answers.ts'
import { BASIS_HELP, BASIS_LABEL, findLikelyQuiz, likelyQuizQuestions, parseQuizBasis, sortLikelyQuizzes } from '../lib/likelyQuizzes.ts'
import { likelyQuizLaunchParams } from '../lib/quizConfig.ts'

interface LikelyQuizPageProps {
  unit: UnitIndex
  path: string
  /** The tab in the URL, e.g. "book" in #/unit/<id>/likely/book; missing or unknown opens the primary quiz. */
  basisArg?: string
}

function tabId(quiz: LikelyQuiz): string {
  return `likely-tab-${quiz.basis}`
}

export function LikelyQuizPage({ unit, path, basisArg }: LikelyQuizPageProps) {
  const unitId = unit.meta.id
  const quizzes = useMemo(() => sortLikelyQuizzes(unit.likelyQuizzes), [unit.likelyQuizzes])
  const selected = findLikelyQuiz(quizzes, parseQuizBasis(basisArg))
  useDocumentTitle(selected ? `Likely Quiz · ${BASIS_LABEL[selected.basis]}` : 'Likely Quiz')
  const [showAnswers, setShowAnswers] = useState(false)
  const bank = useAsync(() => loadQuestions(unitId), [unitId])
  const questions: Question[] = useMemo(
    () => (selected && bank.data ? likelyQuizQuestions(selected, bank.data) : []),
    [selected, bank.data],
  )

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Likely Quiz</span>
      </div>
      <h1 className="page-title">Likely Quiz</h1>
      <p className="page-lead no-print">
        Three predictions of the {unit.meta.assessment.questions} questions on the real quiz, each built from a different source. The lecture + book
        prediction is our best guess; print any of them, cover the answers, and quiz yourself.
      </p>
      <UnitNav unit={unit} currentPath={path} />

      {!selected && <Empty>This unit has no predicted quizzes yet (content/units/{unitId}/likely-quizzes.json).</Empty>}

      {selected && (
        <>
          <div className="tabs no-print" role="tablist" aria-label="Predicted quizzes">
            {quizzes.map((quiz) => {
              const active = quiz.basis === selected.basis
              return (
                <a
                  key={quiz.basis}
                  id={tabId(quiz)}
                  role="tab"
                  aria-selected={active}
                  aria-controls="likely-panel"
                  className={`tab${active ? ' is-active' : ''}`}
                  href={routes.likely(unitId, quiz.basis)}
                  title={BASIS_HELP[quiz.basis]}
                >
                  <span className="tab__label">{BASIS_LABEL[quiz.basis]}</span>
                  {quiz.primary && <span className="tab__tag">primary prediction</span>}
                  <span className="tab__count">{quiz.questionIds.length} questions</span>
                </a>
              )
            })}
          </div>

          <section id="likely-panel" role="tabpanel" aria-labelledby={tabId(selected)} className="stack">
            <header className="card likely-intro">
              <h2 style={{ marginBottom: '0.25rem' }}>{selected.title}</h2>
              <p className="likely-intro__description">{selected.description}</p>
              <div className="row row--between no-print">
                <span className="muted small">
                  {questions.length} predicted questions, in order{selected.primary ? ' · primary prediction' : ''}
                </span>
                <div className="row">
                  <button type="button" className="chip" aria-pressed={showAnswers} onClick={() => setShowAnswers((s) => !s)}>
                    {showAnswers ? 'hide answers' : 'show answers'}
                  </button>
                  <button type="button" className="btn btn--sm" onClick={() => window.print()}>
                    Print
                  </button>
                  <a className="btn btn--sm btn--primary" href={routes.quiz(unitId, likelyQuizLaunchParams(selected.basis))}>
                    Take this as a timed practice quiz
                  </a>
                </div>
              </div>
            </header>

            {bank.status === 'loading' && <Loading what="predicted quiz" />}
            {bank.status === 'error' && <ErrorBox error={bank.error} />}
            {bank.status === 'ready' && questions.length === 0 && <Empty>None of this quiz's question ids exist in the question bank.</Empty>}
            {bank.status === 'ready' &&
              questions.map((q, i) => (
                <article className="card likely-item" key={q.id}>
                  <div className="review-item__head">
                    <span className="likely-item__num">{i + 1}.</span>
                    <ChapterBadge chapter={q.chapter} />
                    <TypeBadge type={q.type} />
                    <CoverageBadge coverage={q.coverage} />
                    <LikelihoodBadge likelihood={q.likelihood} />
                  </div>
                  <div className="review-item__prompt">{q.prompt}</div>
                  {q.type === 'mcq' && (
                    <ol type="A">
                      {q.choices.map((c, ci) => (
                        <li key={ci} className={showAnswers && ci === q.answer ? 'is-answer' : undefined}>
                          {c}
                        </li>
                      ))}
                    </ol>
                  )}
                  {q.type === 'tf' && <div className="small muted">True or false?</div>}
                  {showAnswers && (
                    <div className="likely-item__answer">
                      <strong>Answer:</strong> {correctAnswerText(q)}
                      <div className="small" style={{ marginTop: '0.3rem' }}>
                        {q.explanation}
                      </div>
                    </div>
                  )}
                </article>
              ))}
          </section>
        </>
      )}
    </>
  )
}
