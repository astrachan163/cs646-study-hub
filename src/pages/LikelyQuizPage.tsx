import { useState } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { ChapterBadge, CoverageBadge, LikelihoodBadge, TypeBadge } from '../components/Badge.tsx'
import { ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadLikelyQuiz, loadQuestions } from '../content/repository.ts'
import type { Question, UnitIndex } from '../content/types.ts'
import { correctAnswerText } from '../lib/answers.ts'

interface LikelyQuizPageProps {
  unit: UnitIndex
  path: string
}

export function LikelyQuizPage({ unit, path }: LikelyQuizPageProps) {
  useDocumentTitle('Likely Quiz')
  const unitId = unit.meta.id
  const [showAnswers, setShowAnswers] = useState(false)
  const data = useAsync(async () => {
    const [questions, ids] = await Promise.all([loadQuestions(unitId), loadLikelyQuiz(unitId)])
    const byId = new Map(questions.map((q) => [q.id, q]))
    const ordered: Question[] = ids.flatMap((id) => {
      const q = byId.get(id)
      return q ? [q] : []
    })
    return ordered
  }, [unitId])

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Likely Quiz</span>
      </div>
      <h1 className="page-title">Likely Quiz</h1>
      <p className="page-lead">
        Our best prediction of the {unit.meta.assessment.questions} questions on the real quiz, in a plausible order. Print it, cover the answers,
        and quiz yourself.
      </p>
      <UnitNav unit={unit} currentPath={path} />

      {data.status === 'loading' && <Loading what="predicted quiz" />}
      {data.status === 'error' && <ErrorBox error={data.error} />}
      {data.status === 'ready' && (
        <>
          <div className="row row--between no-print" style={{ marginBottom: '0.9rem' }}>
            <span className="muted small">{data.data.length} predicted questions</span>
            <div className="row">
              <button type="button" className="chip" aria-pressed={showAnswers} onClick={() => setShowAnswers((s) => !s)}>
                {showAnswers ? 'hide answers' : 'show answers'}
              </button>
              <button type="button" className="btn btn--sm" onClick={() => window.print()}>
                Print
              </button>
              <a className="btn btn--sm btn--primary" href={routes.quiz(unitId, new URLSearchParams({ set: 'likely', seed: 'likely' }))}>
                Take it as a timed quiz
              </a>
            </div>
          </div>
          <div className="stack">
            {data.data.map((q, i) => (
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
          </div>
        </>
      )}
    </>
  )
}
