import { useMemo, useState } from 'react'
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

interface LexiconPageProps {
  unit: UnitIndex
  path: string
  initialSearch: string
}

function matches(entry: LexiconEntry, needle: string): boolean {
  if (!needle) return true
  const n = needle.toLowerCase()
  return (
    entry.term.toLowerCase().includes(n) ||
    entry.definition.toLowerCase().includes(n) ||
    entry.related.some((r) => r.toLowerCase().includes(n))
  )
}

export function LexiconPage({ unit, path, initialSearch }: LexiconPageProps) {
  useDocumentTitle('Lexicon')
  const unitId = unit.meta.id
  const lexicon = useAsync(() => loadLexicon(unitId), [unitId])
  const [search, setSearch] = useState(initialSearch)
  const [chapters, setChapters] = useState<number[]>([])
  const [coverage, setCoverage] = useState<Coverage[]>([])

  const entries = useMemo(() => {
    const all = lexicon.data ?? []
    return all
      .filter((e) => (chapters.length === 0 || chapters.includes(e.chapter)) && (coverage.length === 0 || coverage.includes(e.coverage)))
      .filter((e) => matches(e, search.trim()))
      .sort((a, b) => a.term.localeCompare(b.term, 'en', { sensitivity: 'base' }))
  }, [lexicon.data, chapters, coverage, search])

  const chapterOptions = useMemo(() => {
    const set = new Set<number>((lexicon.data ?? []).map((e) => e.chapter))
    return [...set].sort((a, b) => a - b).map((n) => ({ value: n, label: `ch ${n}` }))
  }, [lexicon.data])

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span> <span>Lexicon</span>
      </div>
      <h1 className="page-title">Lexicon</h1>
      <p className="page-lead">Every term you should be able to define, with its chapter and whether the instructor covered it.</p>
      <UnitNav unit={unit} currentPath={path} />

      {lexicon.status === 'loading' && <Loading what="lexicon" />}
      {lexicon.status === 'error' && <ErrorBox error={lexicon.error} />}
      {lexicon.status === 'ready' && (
        <>
          <div className="card card--tight" style={{ marginBottom: '1rem' }}>
            <div className="search-row">
              <input
                className="input"
                type="search"
                placeholder="Search terms, definitions, related terms…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label="Search the lexicon"
              />
              {search && (
                <button type="button" className="btn btn--sm" onClick={() => setSearch('')}>
                  Clear
                </button>
              )}
            </div>
            <div className="filters">
              <ChipGroup label="Chapter" options={chapterOptions} selected={chapters} onChange={setChapters} />
              <ChipGroup
                label="Coverage"
                options={COVERAGES.map((c) => ({ value: c, label: COVERAGE_LABEL[c], title: COVERAGE_HELP[c] }))}
                selected={coverage}
                onChange={setCoverage}
              />
            </div>
          </div>

          <div className="row row--between" style={{ marginBottom: '0.5rem' }}>
            <span className="muted small">
              {entries.length} of {lexicon.data.length} terms
            </span>
            <a className="btn btn--sm" href={routes.flashcards(unitId)}>
              Drill these as flashcards →
            </a>
          </div>

          <div className="card">
            {entries.length === 0 && <Empty>No terms match. Try a shorter search or clear the filters.</Empty>}
            {entries.map((entry) => (
              <article className="lexicon-entry" key={entry.term} id={`term-${entry.term.replace(/\s+/g, '-').toLowerCase()}`}>
                <div className="lexicon-entry__head">
                  <span className="lexicon-entry__term">{entry.term}</span>
                  <ChapterBadge chapter={entry.chapter} />
                  <CoverageBadge coverage={entry.coverage} />
                </div>
                <p style={{ marginBottom: 0 }}>{entry.definition}</p>
                {entry.related.length > 0 && (
                  <div className="related">
                    <span>Related:</span>
                    {entry.related.map((r) => (
                      <button type="button" key={r} className="link-chip" onClick={() => setSearch(r)} title={`Search for "${r}"`}>
                        {r}
                      </button>
                    ))}
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
