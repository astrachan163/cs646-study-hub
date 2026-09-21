import { useMemo, useState } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { ChapterBadge, CoverageBadge, DifficultyBadge, LikelihoodBadge, TypeBadge } from '../components/Badge.tsx'
import { ChipGroup } from '../components/ChipGroup.tsx'
import { Empty, ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadQuestions } from '../content/repository.ts'
import {
  COVERAGES,
  DIFFICULTIES,
  LIKELIHOODS,
  QUESTION_TYPES,
  type Coverage,
  type Difficulty,
  type Likelihood,
  type QuestionType,
  type UnitIndex,
} from '../content/types.ts'
import { correctAnswerText } from '../lib/answers.ts'
import { COVERAGE_HELP, COVERAGE_LABEL, TYPE_LABEL } from '../lib/labels.ts'
import { defaultQuizConfig, parseQuizConfig, serializeQuizConfig } from '../lib/quizConfig.ts'
import { filterQuestions } from '../lib/select.ts'

interface BankPageProps {
  unit: UnitIndex
  path: string
  params: URLSearchParams
}

export function BankPage({ unit, path, params }: BankPageProps) {
  useDocumentTitle('Question Bank')
  const unitId = unit.meta.id
  const questions = useAsync(() => loadQuestions(unitId), [unitId])
  // The bank accepts the same filter params as the quiz so links can pre-filter it.
  const initial = useMemo(() => parseQuizConfig(params, defaultQuizConfig(unit.meta, 'bank')), [params, unit.meta])
  const [search, setSearch] = useState(params.get('q') ?? '')
  const [chapters, setChapters] = useState<number[]>(initial.chapters)
  const [coverage, setCoverage] = useState<Coverage[]>(initial.coverage)
  const [difficulty, setDifficulty] = useState<Difficulty[]>(initial.difficulty)
  const [likelihood, setLikelihood] = useState<Likelihood[]>(initial.likelihood)
  const [types, setTypes] = useState<QuestionType[]>([])
  const [showAnswers, setShowAnswers] = useState(false)

  const filtered = useMemo(
    () => filterQuestions(questions.data ?? [], { chapters, coverage, difficulty, likelihood, types, search }),
    [questions.data, chapters, coverage, difficulty, likelihood, types, search],
  )

  const counts = useMemo(() => {
    const all = questions.data ?? []
    return {
      total: all.length,
      high: all.filter((q) => q.likelihood === 'high').length,
      medium: all.filter((q) => q.likelihood === 'medium').length,
      low: all.filter((q) => q.likelihood === 'low').length,
    }
  }, [questions.data])

  const practiceHref = useMemo(() => {
    const defaults = defaultQuizConfig(unit.meta, 'x')
    const n = Math.min(defaults.n, filtered.length)
    // Text search cannot be expressed as filters, so pass explicit ids then (capped to keep the URL short).
    const useIds = search.trim().length > 0 || types.length > 0
    const config = {
      ...defaults,
      n: Math.max(1, n),
      chapters: useIds ? [] : chapters,
      coverage: useIds ? [] : coverage,
      difficulty: useIds ? [] : difficulty,
      likelihood: useIds ? [] : likelihood,
      ids: useIds ? filtered.slice(0, 100).map((q) => q.id) : [],
    }
    const serialized = serializeQuizConfig(config, defaults)
    serialized.delete('seed')
    return routes.quiz(unitId, serialized)
  }, [unit.meta, filtered, search, types, chapters, coverage, difficulty, likelihood, unitId])

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Question Bank</span>
      </div>
      <h1 className="page-title">Question Bank</h1>
      <p className="page-lead">Every question we have, with its answer, explanation and source. Filter it down and practice exactly that slice.</p>
      <UnitNav unit={unit} currentPath={path} />

      {questions.status === 'loading' && <Loading what="question bank" />}
      {questions.status === 'error' && <ErrorBox error={questions.error} />}
      {questions.status === 'ready' && (
        <>
          <div className="stat-row">
            <div className="stat">
              <strong>{counts.total}</strong> questions
            </div>
            <div className="stat">
              <strong>{counts.high}</strong> high likelihood
            </div>
            <div className="stat">
              <strong>{counts.medium}</strong> medium
            </div>
            <div className="stat">
              <strong>{counts.low}</strong> low
            </div>
          </div>

          <div className="card card--tight" style={{ marginBottom: '1rem' }}>
            <div className="search-row">
              <input className="input" type="search" placeholder="Search prompts, choices, tags…" value={search} onChange={(e) => setSearch(e.target.value)} aria-label="Search questions" />
              {search && (
                <button type="button" className="btn btn--sm" onClick={() => setSearch('')}>
                  Clear
                </button>
              )}
            </div>
            <div className="filters">
              <ChipGroup label="Chapter" options={unit.chapters.map((n) => ({ value: n, label: `ch ${n}` }))} selected={chapters} onChange={setChapters} />
              <ChipGroup label="Coverage" options={COVERAGES.map((c) => ({ value: c, label: COVERAGE_LABEL[c], title: COVERAGE_HELP[c] }))} selected={coverage} onChange={setCoverage} />
              <ChipGroup label="Difficulty" options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} selected={difficulty} onChange={setDifficulty} />
              <ChipGroup label="Likelihood" options={LIKELIHOODS.map((l) => ({ value: l, label: l }))} selected={likelihood} onChange={setLikelihood} />
              <ChipGroup label="Type" options={QUESTION_TYPES.map((t) => ({ value: t, label: TYPE_LABEL[t] }))} selected={types} onChange={setTypes} />
            </div>
          </div>

          <div className="row row--between" style={{ marginBottom: '0.6rem' }}>
            <span className="muted small">
              {filtered.length} of {counts.total} questions
            </span>
            <div className="row">
              <button type="button" className="chip" aria-pressed={showAnswers} onClick={() => setShowAnswers((s) => !s)}>
                {showAnswers ? 'answers shown' : 'show all answers'}
              </button>
              <a className={`btn btn--sm btn--primary${filtered.length === 0 ? ' disabled' : ''}`} href={practiceHref} aria-disabled={filtered.length === 0}>
                Practice these {Math.min(filtered.length, unit.meta.assessment.questions)} →
              </a>
            </div>
          </div>

          <div className="stack">
            {filtered.length === 0 && (
              <div className="card">
                <Empty>No questions match. Clear a filter or shorten the search.</Empty>
              </div>
            )}
            {filtered.map((q) => (
              <details className="card bank-item" key={q.id} open={showAnswers || undefined}>
                <summary>
                  <div className="review-item__head" style={{ marginBottom: 0 }}>
                    <code className="small">{q.id}</code>
                    <ChapterBadge chapter={q.chapter} />
                    <TypeBadge type={q.type} />
                    <CoverageBadge coverage={q.coverage} />
                    <LikelihoodBadge likelihood={q.likelihood} />
                    <DifficultyBadge difficulty={q.difficulty} />
                  </div>
                  <div className="bank-item__prompt">{q.prompt}</div>
                </summary>
                <div className="bank-item__body">
                  {q.type === 'mcq' && (
                    <ol type="A">
                      {q.choices.map((c, i) => (
                        <li key={i} className={i === q.answer ? 'is-answer' : undefined}>
                          {c}
                        </li>
                      ))}
                    </ol>
                  )}
                  <div className="answer-line answer-line--correct">
                    <strong>Answer:</strong> {correctAnswerText(q)}
                  </div>
                  <p className="small" style={{ margin: '0.5rem 0 0.3rem' }}>
                    {q.explanation}
                  </p>
                  <div className="small muted">
                    {q.section} · {q.source.book ?? '—'}
                    {q.source.lecture ? ` · ${q.source.lecture}` : ''}
                    {q.tags.length > 0 ? ` · tags: ${q.tags.join(', ')}` : ''}
                  </div>
                </div>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  )
}
