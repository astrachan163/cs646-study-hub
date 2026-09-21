import { routes } from '../app/routes.ts'
import { useDocumentTitle } from '../app/useDocumentTitle.ts'

export function NotFoundPage({ path }: { path: string }) {
  useDocumentTitle('Not found')
  return (
    <div className="card">
      <h1>Page not found</h1>
      <p className="muted">
        There is nothing at <code>{path}</code>. The unit may have been renamed or the link is incomplete.
      </p>
      <a className="btn btn--primary" href={routes.home()}>
        Back to the home page
      </a>
    </div>
  )
}
