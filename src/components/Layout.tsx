import type { ReactNode } from 'react'
import { routes } from '../app/routes.ts'
import type { Theme } from '../lib/storage.ts'

interface LayoutProps {
  theme: Theme
  onToggleTheme: () => void
  children: ReactNode
}

export function Layout({ theme, onToggleTheme, children }: LayoutProps) {
  return (
    <>
      <header className="site-header">
        <div className="site-header__inner">
          <a className="brand" href={routes.home()}>
            <span className="brand__mark" aria-hidden="true">
              646
            </span>
            <span>
              CS 646 Study Hub
              <span className="brand__sub">Blockchain &amp; Cryptocurrency · UAB Fall 2026</span>
            </span>
          </a>
          <div className="header-spacer" />
          <button
            type="button"
            className="icon-button"
            onClick={onToggleTheme}
            aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            title={theme === 'dark' ? 'Light mode' : 'Dark mode'}
          >
            {theme === 'dark' ? '☀️' : '🌙'}
          </button>
        </div>
      </header>
      <main>{children}</main>
      <footer className="site-footer">
        Built by classmates for classmates. Content lives in plain files; see CONTENT-GUIDE.md in the repository to add a
        unit. Your progress is stored only in this browser.
      </footer>
    </>
  )
}
