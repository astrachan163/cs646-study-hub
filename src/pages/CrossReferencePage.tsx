import { useMemo } from 'react'
import { routes } from '../app/routes.ts'
import { useAsync } from '../app/useAsync.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'
import { Markdown } from '../components/Markdown.tsx'
import { ErrorBox, Loading } from '../components/States.tsx'
import { UnitNav } from '../components/UnitNav.tsx'
import { loadCrossReference } from '../content/repository.ts'
import type { UnitIndex } from '../content/types.ts'
import { extractHeadings } from '../lib/markdown.ts'
import type { Theme } from '../lib/storage.ts'

interface CrossReferencePageProps {
  unit: UnitIndex
  path: string
  theme: Theme
}

export function CrossReferencePage({ unit, path, theme }: CrossReferencePageProps) {
  useDocumentTitle('Cross-Reference')
  const unitId = unit.meta.id
  const content = useAsync(() => loadCrossReference(unitId), [unitId])
  const headings = useMemo(() => (content.data ? extractHeadings(content.data).filter((h) => h.level === 2) : []), [content.data])

  return (
    <>
      <div className="crumbs">
        <a href={routes.home()}>Home</a> <span>/</span> <a href={routes.unit(unitId)}>{unit.meta.title}</a> <span>/</span>{' '}
        <span>Cross-Reference</span>
      </div>
      <h1 className="page-title">Cross-Reference</h1>
      <p className="page-lead">
        Where the lecture and the book overlap, what the instructor emphasised or skipped, and book-only concepts that could still
        appear on the quiz. Tables scroll sideways on small screens.
      </p>
      <UnitNav unit={unit} currentPath={path} />

      {content.status === 'loading' && <Loading what="cross-reference tables" />}
      {content.status === 'error' && <ErrorBox error={content.error} />}
      {content.status === 'ready' && (
        <div className="study-layout">
          <aside className="study-sidebar">
            <div className="card card--tight">
              <div className="filter-block__label" style={{ marginBottom: '0.4rem' }}>
                Jump to
              </div>
              <ul className="chapter-list">
                {headings.map((h) => (
                  <li key={h.id}>
                    <a
                      href={`#${path}`}
                      onClick={(e) => {
                        e.preventDefault()
                        document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
                      }}
                    >
                      {h.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
          <article className="card">
            <Markdown source={content.data} theme={theme} />
          </article>
        </div>
      )}
    </>
  )
}
