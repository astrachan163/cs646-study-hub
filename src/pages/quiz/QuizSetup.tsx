import { useMemo, useState } from 'react'
import { routes } from '../../app/routes.ts'
import { ChipGroup } from '../../components/ChipGroup.tsx'
import { COVERAGES, DIFFICULTIES, LIKELIHOODS, type LikelyQuiz, type Question, type UnitIndex } from '../../content/types.ts'
import { COVERAGE_HELP, COVERAGE_LABEL } from '../../lib/labels.ts'
import { BASIS_HELP, BASIS_LABEL, findLikelyQuiz, sortLikelyQuizzes } from '../../lib/likelyQuizzes.ts'
import { describeQuizConfig, serializeQuizConfig, type QuizConfig } from '../../lib/quizConfig.ts'
import { randomSeedString } from '../../lib/random.ts'
import { filterQuestions } from '../../lib/select.ts'

interface QuizSetupProps {
  unit: UnitIndex
  questions: Question[]
  likelyQuizzes: LikelyQuiz[]
  config: QuizConfig
  defaults: QuizConfig
  onChange: (config: QuizConfig) => void
  onStart: () => void
}

export function QuizSetup({ unit, questions, likelyQuizzes, config, defaults, onChange, onStart }: QuizSetupProps) {
  const [copied, setCopied] = useState(false)
  const predictions = useMemo(() => sortLikelyQuizzes(likelyQuizzes), [likelyQuizzes])
  const prediction = config.set === 'likely' ? findLikelyQuiz(predictions, config.likelyQuiz) : undefined
  const predictedCount = prediction?.questionIds.length ?? 0
  const pool = useMemo(
    () =>
      filterQuestions(questions, {
        chapters: config.chapters,
        coverage: config.coverage,
        difficulty: config.difficulty,
        likelihood: config.likelihood,
        ids: config.ids,
      }),
    [questions, config],
  )
  const chapterOptions = useMemo(() => unit.chapters.map((n) => ({ value: n, label: `ch ${n}` })), [unit.chapters])
  const willGet = config.set === 'likely' ? predictedCount : Math.min(config.n, pool.length)
  const shareUrl = `${window.location.origin}${window.location.pathname}${routes.quiz(unit.meta.id, serializeQuizConfig(config, defaults))}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copy this link:', shareUrl)
    }
  }

  return (
    <div className="two-col">
      <div className="card stack">
        {config.set === 'likely' && (
          <>
            <div className="alert alert--info">
              This is a <strong>predicted quiz</strong>: the {predictedCount} questions of one prediction from the Likely Quiz page, in order. Filters do not apply.{' '}
              <button type="button" className="btn btn--sm" onClick={() => onChange({ ...config, set: 'random', ids: [], likelyQuiz: null })}>
                Switch to a random quiz
              </button>
            </div>
            <div className="filter-block" role="radiogroup" aria-label="Which prediction">
              <div className="filter-block__label">Which prediction</div>
              <div className="chip-group">
                {predictions.map((quiz) => {
                  const active = prediction?.basis === quiz.basis
                  return (
                    <button
                      type="button"
                      key={quiz.basis}
                      className="chip"
                      role="radio"
                      aria-checked={active}
                      aria-pressed={active}
                      title={BASIS_HELP[quiz.basis]}
                      onClick={() => onChange({ ...config, likelyQuiz: quiz.basis })}
                    >
                      {BASIS_LABEL[quiz.basis]}
                      {quiz.primary ? ' (primary)' : ''}
                    </button>
                  )
                })}
              </div>
              {prediction && (
                <p className="small muted" style={{ margin: '0.2rem 0 0' }}>
                  <strong>{prediction.title}.</strong> {prediction.description}
                </p>
              )}
            </div>
          </>
        )}
        {config.set === 'random' && config.ids.length > 0 && (
          <div className="alert alert--info">
            This quiz is limited to <strong>{config.ids.length} specific questions</strong> (for example, the ones you missed last time).{' '}
            <button type="button" className="btn btn--sm" onClick={() => onChange({ ...config, ids: [], n: defaults.n })}>
              Use the whole bank instead
            </button>
          </div>
        )}

        {config.set === 'random' && (
          <>
            <div className="filters">
              <div className="filter-block">
                <label className="filter-block__label" htmlFor="quiz-n">
                  Number of questions
                </label>
                <div className="row">
                  <input
                    id="quiz-n"
                    className="input"
                    style={{ width: 110 }}
                    type="number"
                    min={1}
                    max={Math.max(1, pool.length)}
                    value={config.n}
                    onChange={(e) => onChange({ ...config, n: Math.max(1, Number.parseInt(e.target.value || '1', 10)) })}
                  />
                  <button type="button" className="chip" aria-pressed={config.n === defaults.n} onClick={() => onChange({ ...config, n: defaults.n })}>
                    {defaults.n} (like the real quiz)
                  </button>
                  <button type="button" className="chip" aria-pressed={config.n === pool.length && pool.length !== defaults.n} onClick={() => onChange({ ...config, n: pool.length })}>
                    all {pool.length}
                  </button>
                </div>
              </div>
              <div className="filter-block">
                <label className="filter-block__label" htmlFor="quiz-t">
                  Timer (minutes, 0 = untimed)
                </label>
                <div className="row">
                  <input
                    id="quiz-t"
                    className="input"
                    style={{ width: 110 }}
                    type="number"
                    min={0}
                    max={180}
                    value={config.timerMinutes}
                    onChange={(e) => onChange({ ...config, timerMinutes: Math.max(0, Number.parseInt(e.target.value || '0', 10)) })}
                  />
                  <button type="button" className="chip" aria-pressed={config.timerMinutes === defaults.timerMinutes} onClick={() => onChange({ ...config, timerMinutes: defaults.timerMinutes })}>
                    {defaults.timerMinutes} min (real)
                  </button>
                  <button type="button" className="chip" aria-pressed={config.timerMinutes === 0} onClick={() => onChange({ ...config, timerMinutes: 0 })}>
                    untimed
                  </button>
                </div>
              </div>
            </div>

            <div className="filters">
              <ChipGroup label="Chapters" options={chapterOptions} selected={config.chapters} onChange={(chapters) => onChange({ ...config, chapters })} />
              <ChipGroup
                label="Coverage"
                options={COVERAGES.map((c) => ({ value: c, label: COVERAGE_LABEL[c], title: COVERAGE_HELP[c] }))}
                selected={config.coverage}
                onChange={(coverage) => onChange({ ...config, coverage })}
              />
              <ChipGroup label="Difficulty" options={DIFFICULTIES.map((d) => ({ value: d, label: d }))} selected={config.difficulty} onChange={(difficulty) => onChange({ ...config, difficulty })} />
              <ChipGroup
                label="Quiz likelihood"
                options={LIKELIHOODS.map((l) => ({ value: l, label: l }))}
                selected={config.likelihood}
                onChange={(likelihood) => onChange({ ...config, likelihood })}
              />
            </div>
          </>
        )}

        <div className="filters">
          <div className="filter-block" role="radiogroup" aria-label="Feedback">
            <div className="filter-block__label">Feedback</div>
            <div className="chip-group">
              <button type="button" className="chip" role="radio" aria-checked={config.feedback === 'instant'} aria-pressed={config.feedback === 'instant'} onClick={() => onChange({ ...config, feedback: 'instant' })}>
                after each question
              </button>
              <button type="button" className="chip" role="radio" aria-checked={config.feedback === 'end'} aria-pressed={config.feedback === 'end'} onClick={() => onChange({ ...config, feedback: 'end' })}>
                at the end (like the real quiz)
              </button>
            </div>
          </div>
          <div className="filter-block">
            <label className="filter-block__label" htmlFor="quiz-seed">
              Seed (same seed = same questions)
            </label>
            <div className="row">
              <input id="quiz-seed" className="input" style={{ width: 160 }} type="text" value={config.seed} onChange={(e) => onChange({ ...config, seed: e.target.value.trim() || randomSeedString() })} />
              <button type="button" className="btn btn--sm" onClick={() => onChange({ ...config, seed: randomSeedString() })}>
                New seed
              </button>
            </div>
          </div>
        </div>

        <div className="row row--between" style={{ marginTop: '0.4rem' }}>
          <span className="muted small">
            {config.set === 'likely'
              ? `${predictedCount} predicted questions, in order`
              : `${pool.length} questions match · you will get ${willGet}${pool.length > willGet ? ', weighted toward high likelihood' : ''}`}
          </span>
          <div className="row">
            <button type="button" className="btn" onClick={copyLink}>
              {copied ? 'Link copied ✓' : 'Copy share link'}
            </button>
            <button type="button" className="btn btn--primary btn--lg" onClick={onStart} disabled={willGet === 0}>
              Start quiz
            </button>
          </div>
        </div>
      </div>

      <aside className="stack">
        <div className="card card--tight">
          <h3>This configuration</h3>
          <p className="small" style={{ marginBottom: '0.4rem' }}>
            {describeQuizConfig(config)}
          </p>
          <p className="small muted" style={{ marginBottom: 0 }}>
            The real quiz: {unit.meta.assessment.questions} questions, {unit.meta.assessment.points} points, {unit.meta.assessment.minutes} minutes.
          </p>
        </div>
        <div className="card card--tight">
          <h3>Tips</h3>
          <ul className="small" style={{ paddingLeft: '1.1rem', margin: 0 }}>
            <li>Use "at the end" feedback with the timer on to rehearse the real conditions.</li>
            <li>Use "after each question" to learn: every answer comes with an explanation and source.</li>
            <li>Share the link with a classmate; the seed gives you both the identical questions.</li>
            {predictions.length > 0 && config.set === 'random' && (
              <li>
                Or take the{' '}
                <button type="button" className="link-chip" onClick={() => onChange({ ...config, set: 'likely', ids: [], likelyQuiz: null })}>
                  predicted quiz in order
                </button>
                .
              </li>
            )}
          </ul>
        </div>
      </aside>
    </div>
  )
}
