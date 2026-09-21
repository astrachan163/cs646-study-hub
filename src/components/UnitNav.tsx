import { routes } from '../app/routes.ts'
import type { UnitIndex } from '../content/types.ts'

interface UnitNavProps {
  unit: UnitIndex
  currentPath: string
}

export function UnitNav({ unit, currentPath }: UnitNavProps) {
  const id = unit.meta.id
  const items: { href: string; label: string; match: string; show: boolean }[] = [
    { href: routes.unit(id), label: 'Overview', match: `/unit/${id}`, show: true },
    { href: routes.study(id), label: 'Study Guide', match: `/unit/${id}/study`, show: unit.chapters.length > 0 },
    { href: routes.crossReference(id), label: 'Cross-Reference', match: `/unit/${id}/cross-reference`, show: unit.hasCrossReference },
    { href: routes.lexicon(id), label: 'Lexicon', match: `/unit/${id}/lexicon`, show: unit.hasLexicon },
    { href: routes.flashcards(id), label: 'Flashcards', match: `/unit/${id}/flashcards`, show: unit.hasLexicon },
    { href: routes.quiz(id), label: 'Practice Quiz', match: `/unit/${id}/quiz`, show: unit.hasQuestions },
    { href: routes.likely(id), label: 'Likely Quiz', match: `/unit/${id}/likely`, show: unit.likelyQuizzes.length > 0 },
    { href: routes.bank(id), label: 'Question Bank', match: `/unit/${id}/bank`, show: unit.hasQuestions },
  ]
  return (
    <nav className="unit-nav" aria-label="Unit sections">
      {items
        .filter((item) => item.show)
        .map((item) => {
          const active = item.match === `/unit/${id}` ? currentPath === item.match : currentPath.startsWith(item.match)
          return (
            <a key={item.label} href={item.href} className={active ? 'active' : undefined} aria-current={active ? 'page' : undefined}>
              {item.label}
            </a>
          )
        })}
    </nav>
  )
}
