import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { ChapterBadge, CoverageBadge } from '../components/Badge.tsx'
import { ChipGroup } from '../components/ChipGroup.tsx'
import { Empty, ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadLexicon } from '../content/repository.ts'
import { COVERAGES, type Coverage, type LexiconEntry, type UnitIndex } from '../content/types.ts'
import { COVERAGE_HELP, COVERAGE_LABEL } from '../lib/labels.ts'
import { randomSeedString, rngFromSeed } from '../lib/random.ts'
import { applyResult, buildQueue, emptyCardState, requeue, summarize, type CardResult, type CardState } from '../lib/spaced.ts'
import { clearCardStates, loadCardStates, saveCardStates } from '../lib/storage.ts'

interface FlashcardsPageProps {
  unit: UnitIndex
  path: string
}

type Direction = 'term-first' | 'definition-first'

export function FlashcardsPage({ unit, path }: FlashcardsPageProps) {
  useDocumentTitle('Flashcards')
  const unitId = unit.meta.id
  const lexicon = useAsync(() => loadLexicon(unitId), [unitId])

  const [chapters, setChapters] = useState<number[]>([])
  const [coverage, setCoverage] = useState<Coverage[]>([])
  const [direction, setDirection] = useState<Direction>('term-first')
  const [states, setStates] = useState<Record<string, CardState>>(() => loadCardStates(unitId))
  const statesRef = useRef(states)
  useEffect(() => {
    statesRef.current = states
  }, [states])
  const [queue, setQueue] = useState<string[]>([])
  const [flipped, setFlipped] = useState(false)
  const [reviewed, setReviewed] = useState(0)
  const [deckSeed, setDeckSeed] = useState(() => randomSeedString())

  const deck = useMemo(() => {
    const all = lexicon.data ?? []
    return all.filter((e) => (chapters.length === 0 || chapters.includes(e.chapter)) && (coverage.length === 0 || coverage.includes(e.coverage)))
  }, [lexicon.data, chapters, coverage])

  const byTerm = useMemo(() => new Map(deck.map((e) => [e.term, e])), [deck])

  // Rebuild the queue whenever the deck (filters) changes or the user reshuffles.
  useEffect(() => {
    // Read states through a ref: answering a card must not reshuffle the queue.
    setQueue(buildQueue(deck.map((e) => e.term), statesRef.current, rngFromSeed(deckSeed)))
    setFlipped(false)
    setReviewed(0)
  }, [deck, deckSeed])

  const currentTerm = queue[0]
  const current: LexiconEntry | undefined = currentTerm ? byTerm.get(currentTerm) : undefined
  const summary = summarize(deck.map((e) => e.term), states)

  const answer = useCallback(
    (result: CardResult) => {
      if (!currentTerm) return
      const previous = states[currentTerm] ?? emptyCardState()
      const nextState = applyResult(previous, result)
      const nextStates = { ...states, [currentTerm]: nextState }
      setStates(nextStates)
      saveCardStates(unitId, nextStates)
      setQueue((q) => requeue(q, currentTerm, result, nextState.streak))
      setFlipped(false)
      setReviewed((n) => n + 1)
    },
    [currentTerm, states, unitId],
  )

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement) {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes(e.target.tagName)) return
        // A focused button already handles space/enter as a click.
        if (e.target.tagName === 'BUTTON' && (e.key === ' ' || e.key === 'Enter')) return
      }
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault()
        setFlipped((f) => !f)
      } else if (e.key === 'ArrowRight') {
        if (flipped) answer('know')
      } else if (e.key === 'ArrowLeft') {
        if (flipped) answer('miss')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [answer, flipped])

  const chapterOptions = useMemo(() => {
    const set = new Set<number>((lexicon.data ?? []).map((e) => e.chapter))
    return [...set].sort((a, b) => a - b).map((n) => ({ value: n, label: `ch ${n}` }))
  }, [lexicon.data])

  const front = current ? (direction === 'term-first' ? current.term : current.definition) : ''
  const back = current ? (direction === 'term-first' ? current.definition : current.term) : ''

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Flashcards</span>
      </div>
      <h1 className="page-title">Flashcards</h1>
      <p className="page-lead">
        Flip a card, then say whether you knew it. Cards you know drift further back in the deck; cards you miss come back
        in two turns. Progress is saved on this device.
      </p>
      <UnitNav unit={unit} currentPath={path} />

      {lexicon.status === 'loading' && <Loading what="flashcards" />}
      {lexicon.status === 'error' && <ErrorBox error={lexicon.error} />}
      {lexicon.status === 'ready' && (
        <>
          <div className="card card--tight no-print" style={{ marginBottom: '0.8rem' }}>
            <div className="filters">
              <ChipGroup label="Chapter" options={chapterOptions} selected={chapters} onChange={setChapters} />
              <ChipGroup
                label="Coverage"
                options={COVERAGES.map((c) => ({ value: c, label: COVERAGE_LABEL[c], title: COVERAGE_HELP[c] }))}
                selected={coverage}
                onChange={setCoverage}
              />
            </div>
            <div className="row row--between" style={{ marginTop: '0.8rem' }}>
              <div className="row">
                <span className="filter-block__label">Show first</span>
                <button type="button" className="chip" aria-pressed={direction === 'term-first'} onClick={() => setDirection('term-first')}>
                  term
                </button>
                <button type="button" className="chip" aria-pressed={direction === 'definition-first'} onClick={() => setDirection('definition-first')}>
                  definition
                </button>
              </div>
              <div className="row">
                <button type="button" className="btn btn--sm" onClick={() => setDeckSeed(randomSeedString())}>
                  Reshuffle
                </button>
                <button
                  type="button"
                  className="btn btn--sm btn--ghost btn--danger"
                  onClick={() => {
                    if (window.confirm('Forget which cards you know (this device only)?')) {
                      clearCardStates(unitId)
                      setStates({})
                      setDeckSeed(randomSeedString())
                    }
                  }}
                >
                  Reset progress
                </button>
              </div>
            </div>
          </div>

          <div className="deck-summary">
            <span>
              <strong>{summary.total}</strong> cards
            </span>
            <span>
              <strong>{summary.unseen}</strong> new or missed
            </span>
            <span>
              <strong>{summary.learning}</strong> learning
            </span>
            <span>
              <strong>{summary.known}</strong> known
            </span>
            <span>
              <strong>{reviewed}</strong> reviewed this session
            </span>
          </div>

          {!current ? (
            <Empty>No cards match these filters.</Empty>
          ) : (
            <>
              <div className="flashcard-scene">
                <button
                  type="button"
                  className={`flashcard${flipped ? ' is-flipped' : ''}`}
                  onClick={() => setFlipped((f) => !f)}
                  aria-label={flipped ? 'Hide answer' : 'Show answer'}
                >
                  <div className="flashcard__face">
                    <span className="flashcard__kicker">{direction === 'term-first' ? 'Term' : 'Definition'}</span>
                    <span className="flashcard__badges">
                      <ChapterBadge chapter={current.chapter} />
                      <CoverageBadge coverage={current.coverage} />
                    </span>
                    <div className={direction === 'term-first' ? 'flashcard__term' : 'flashcard__definition'}>{front}</div>
                    <span className="flashcard__hint">tap or press space to flip</span>
                  </div>
                  <div className="flashcard__face flashcard__face--back">
                    <span className="flashcard__kicker">{direction === 'term-first' ? 'Definition' : 'Term'}</span>
                    <div className={direction === 'term-first' ? 'flashcard__definition' : 'flashcard__term'}>{back}</div>
                    {current.related.length > 0 && (
                      <span className="flashcard__hint">related: {current.related.join(', ')}</span>
                    )}
                  </div>
                </button>
              </div>
              <div className="flashcard-actions">
                <button type="button" className="btn btn--danger btn--lg" onClick={() => answer('miss')} disabled={!flipped}>
                  ✗ Missed it
                </button>
                <button type="button" className="btn btn--primary btn--lg" onClick={() => answer('know')} disabled={!flipped}>
                  ✓ Knew it
                </button>
              </div>
              <p className="kbd-hint" style={{ textAlign: 'center', marginTop: '0.7rem' }}>
                <kbd>space</kbd> flip · <kbd>←</kbd> missed · <kbd>→</kbd> knew it
              </p>
            </>
          )}
        </>
      )}
    </>
  )
}
