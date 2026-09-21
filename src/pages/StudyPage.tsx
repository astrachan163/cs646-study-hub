import { useEffect, useMemo } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { Markdown } from '../components/Markdown.tsx'
import { ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadChapter, loadLexicon } from '../content/repository.ts'
import type { LexiconEntry, UnitIndex } from '../content/types.ts'
import { extractHeadings, titleFromMarkdown } from '../lib/markdown.ts'
import type { Theme } from '../lib/storage.ts'
import { loadReadChapters, markChapterRead } from '../lib/storage.ts'

interface StudyPageProps {
  unit: UnitIndex
  path: string
  chapterArg: string | undefined
  theme: Theme
}

export function StudyPage({ unit, path, chapterArg, theme }: StudyPageProps) {
  const unitId = unit.meta.id
  const requested = chapterArg !== undefined ? Number.parseInt(chapterArg, 10) : NaN
  const chapter = unit.chapters.includes(requested) ? requested : unit.chapters[0]

  const content = useAsync(
    async () => {
      if (chapter === undefined) return { markdown: '', terms: [] as LexiconEntry[] }
      const [markdown, lexicon] = await Promise.all([
        loadChapter(unitId, chapter),
        unit.hasLexicon ? loadLexicon(unitId) : Promise.resolve([] as LexiconEntry[]),
      ])
      return { markdown, terms: lexicon.filter((t) => t.chapter === chapter) }
    },
    [unitId, chapter],
  )

  useEffect(() => {
    if (chapter !== undefined) markChapterRead(unitId, chapter)
  }, [unitId, chapter])

  const headings = useMemo(() => (content.data ? extractHeadings(content.data.markdown) : []), [content.data])
  const title = content.data ? titleFromMarkdown(content.data.markdown, `Chapter ${chapter}`) : `Chapter ${chapter}`
  useDocumentTitle(title)

  const readChapters = loadReadChapters(unitId)
  const index = chapter === undefined ? -1 : unit.chapters.indexOf(chapter)
  const prev = index > 0 ? unit.chapters[index - 1] : undefined
  const next = index >= 0 ? unit.chapters[index + 1] : undefined

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span>{' '}
        <span>Study Guide</span>
      </div>
      <h1 className="page-title">Study Guide</h1>
      <p className="page-lead">One page per chapter: what matters, drawn as diagrams, plus the terms you must know.</p>
      <UnitNav unit={unit} currentPath={path} />

      {chapter === undefined ? (
        <div className="card empty">This unit has no chapter files yet.</div>
      ) : (
        <div className="study-layout">
          <aside className="study-sidebar">
            <div className="card card--tight">
              <div className="filter-block__label" style={{ marginBottom: '0.4rem' }}>
                Chapters
              </div>
              <ul className="chapter-list">
                {unit.chapters.map((n) => (
                  <li key={n}>
                    <a href={routes.study(unitId, n)} className={n === chapter ? 'active' : undefined} aria-current={n === chapter ? 'page' : undefined}>
                      <span>Chapter {n}</span>
                      {readChapters.includes(String(n)) && (
                        <span className="tick" title="opened">
                          ✓
                        </span>
                      )}
                    </a>
                  </li>
                ))}
              </ul>
              {headings.length > 0 && (
                <>
                  <div className="filter-block__label" style={{ margin: '0.9rem 0 0.4rem' }}>
                    On this page
                  </div>
                  <ul className="chapter-list">
                    {headings
                      .filter((h) => h.level === 2)
                      .map((h) => (
                        <li key={h.id}>
                          <a href={`#${path}?h=${h.id}`} onClick={(e) => {
                            e.preventDefault()
                            document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                          }}>
                            {h.text}
                          </a>
                        </li>
                      ))}
                  </ul>
                </>
              )}
            </div>
          </aside>

          <article className="card">
            {content.status === 'loading' && <Loading what={`chapter ${chapter}`} />}
            {content.status === 'error' && <ErrorBox error={content.error} />}
            {content.status === 'ready' && (
              <>
                <Markdown source={content.data.markdown} theme={theme} />
                {content.data.terms.length > 0 && (
                  <section className="section">
                    <h2>Lexicon terms from this chapter</h2>
                    <div className="term-list">
                      {content.data.terms.map((t) => (
                        <a key={t.term} className="link-chip" href={routes.lexicon(unitId, t.term)} title={t.definition}>
                          {t.term}
                        </a>
                      ))}
                    </div>
                    <p className="small muted" style={{ marginTop: '0.6rem' }}>
                      Drill these in <a href={routes.flashcards(unitId)}>Flashcards</a>, or practice this chapter only:{' '}
                      <a href={routes.quiz(unitId, new URLSearchParams({ ch: String(chapter), n: '10' }))}>10-question quiz on chapter {chapter}</a>.
                    </p>
                  </section>
                )}
                <nav className="pager" aria-label="Chapter navigation">
                  {prev !== undefined ? (
                    <a className="btn" href={routes.study(unitId, prev)}>
                      ← Chapter {prev}
                    </a>
                  ) : (
                    <span />
                  )}
                  {next !== undefined ? (
                    <a className="btn btn--primary" href={routes.study(unitId, next)}>
                      Chapter {next} →
                    </a>
                  ) : (
                    <a className="btn btn--primary" href={routes.quiz(unitId)}>
                      Take a practice quiz →
                    </a>
                  )}
                </nav>
              </>
            )}
          </article>
        </div>
      )}
    </>
  )
}
