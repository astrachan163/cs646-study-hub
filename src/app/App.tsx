import { useEffect } from 'react'
import { Layout } from '../components/Layout.tsx'
import { getUnit } from '../content/repository.ts'
import { matchRoute } from '../lib/router.ts'
import type { Theme } from '../lib/storage.ts'
import { BankPage } from '../pages/BankPage.tsx'
import { CrossReferencePage } from '../pages/CrossReferencePage.tsx'
import { FlashcardsPage } from '../pages/FlashcardsPage.tsx'
import { HomePage } from '../pages/HomePage.tsx'
import { LexiconPage } from '../pages/LexiconPage.tsx'
import { LikelyQuizPage } from '../pages/LikelyQuizPage.tsx'
import { NotFoundPage } from '../pages/NotFoundPage.tsx'
import { QuizPage } from '../pages/QuizPage.tsx'
import { StudyPage } from '../pages/StudyPage.tsx'
import { UnitPage } from '../pages/UnitPage.tsx'
import { useTheme } from './theme.ts'
import { useHashLocation, type AppLocation } from './useHashLocation.ts'

function Router({ location, theme }: { location: AppLocation; theme: Theme }) {
  const { path, params } = location

  if (path === '/') return <HomePage />

  const unitMatch =
    matchRoute('/unit/:unitId', path) ??
    matchRoute('/unit/:unitId/:section', path) ??
    matchRoute('/unit/:unitId/:section/:arg', path)
  const unitId = unitMatch?.unitId
  const unit = unitId ? getUnit(unitId) : undefined
  if (!unitMatch || !unitId || !unit) return <NotFoundPage path={path} />

  const section = unitMatch.section ?? ''
  const arg = unitMatch.arg

  switch (section) {
    case '':
      return <UnitPage unit={unit} path={path} />
    case 'study':
      return <StudyPage unit={unit} path={path} chapterArg={arg} theme={theme} />
    case 'cross-reference':
      return <CrossReferencePage unit={unit} path={path} theme={theme} />
    case 'lexicon':
      return <LexiconPage unit={unit} path={path} initialSearch={params.get('q') ?? ''} />
    case 'flashcards':
      return <FlashcardsPage unit={unit} path={path} />
    case 'quiz':
      return <QuizPage unit={unit} path={path} params={params} />
    case 'likely':
      return <LikelyQuizPage unit={unit} path={path} />
    case 'bank':
      return <BankPage unit={unit} path={path} params={params} />
    default:
      return <NotFoundPage path={path} />
  }
}

export function App() {
  const location = useHashLocation()
  const { theme, toggle } = useTheme()

  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [location.path])

  return (
    <Layout theme={theme} onToggleTheme={toggle}>
      <Router location={location} theme={theme} />
    </Layout>
  )
}
