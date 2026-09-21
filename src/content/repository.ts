/**
 * Content access layer. Vite's `import.meta.glob` scans the `content/` folder at
 * build time, so adding a unit is just adding a folder: no registry to edit.
 *
 * Small metadata (unit.json, courses) is bundled eagerly; everything else is a
 * lazily loaded chunk so pages only download what they show.
 */
import { stripFrontmatter } from '../lib/markdown.ts'
import {
  CHAPTER_FILE_PATTERN,
  type Course,
  type LexiconEntry,
  type Question,
  type UnitIndex,
  type UnitMeta,
} from './types.ts'

type JsonModule<T> = { default: T }
type LazyJson<T> = () => Promise<JsonModule<T>>
type LazyRaw = () => Promise<string>

const unitMetaModules = import.meta.glob<JsonModule<UnitMeta>>('/content/units/*/unit.json', {
  eager: true,
})
const courseModules = import.meta.glob<JsonModule<Course>>('/content/courses/*.json', {
  eager: true,
})
const questionModules = import.meta.glob<JsonModule<Question[]>>(
  '/content/units/*/questions.json',
)
const lexiconModules = import.meta.glob<JsonModule<LexiconEntry[]>>(
  '/content/units/*/lexicon.json',
)
const likelyQuizModules = import.meta.glob<JsonModule<string[]>>(
  '/content/units/*/likely-quiz.json',
)
const chapterModules = import.meta.glob<string>('/content/units/*/chapters/*.md', {
  query: '?raw',
  import: 'default',
})
const crossReferenceModules = import.meta.glob<string>('/content/units/*/cross-reference.md', {
  query: '?raw',
  import: 'default',
})

const UNIT_DIR_PATTERN = /^\/content\/units\/([^/]+)\//

function unitIdFromPath(path: string): string | null {
  const match = UNIT_DIR_PATTERN.exec(path)
  return match?.[1] ?? null
}

function chapterNumberFromPath(path: string): number | null {
  const file = path.split('/').pop() ?? ''
  const match = CHAPTER_FILE_PATTERN.exec(file)
  return match?.[1] ? Number(match[1]) : null
}

function buildIndex(): Map<string, UnitIndex> {
  const index = new Map<string, UnitIndex>()
  for (const [path, mod] of Object.entries(unitMetaModules)) {
    const folderId = unitIdFromPath(path)
    if (!folderId) continue
    index.set(folderId, {
      meta: mod.default,
      chapters: [],
      hasCrossReference: false,
      hasLexicon: false,
      hasQuestions: false,
      hasLikelyQuiz: false,
    })
  }
  const mark = (paths: string[], apply: (u: UnitIndex, path: string) => void) => {
    for (const path of paths) {
      const id = unitIdFromPath(path)
      const unit = id ? index.get(id) : undefined
      if (unit) apply(unit, path)
    }
  }
  mark(Object.keys(chapterModules), (u, path) => {
    const n = chapterNumberFromPath(path)
    if (n !== null) u.chapters.push(n)
  })
  mark(Object.keys(crossReferenceModules), (u) => (u.hasCrossReference = true))
  mark(Object.keys(lexiconModules), (u) => (u.hasLexicon = true))
  mark(Object.keys(questionModules), (u) => (u.hasQuestions = true))
  mark(Object.keys(likelyQuizModules), (u) => (u.hasLikelyQuiz = true))
  for (const unit of index.values()) unit.chapters.sort((a, b) => a - b)
  return index
}

const unitIndex = buildIndex()

/** All units, soonest assessment first. */
export function listUnits(): UnitIndex[] {
  return [...unitIndex.values()].sort(
    (a, b) => Date.parse(a.meta.assessment.opens) - Date.parse(b.meta.assessment.opens),
  )
}

export function getUnit(unitId: string): UnitIndex | undefined {
  return unitIndex.get(unitId)
}

export function listCourses(): Course[] {
  return Object.values(courseModules).map((m) => m.default)
}

export function getCourse(courseId: string): Course | undefined {
  return listCourses().find((c) => c.id === courseId)
}

function findLazy<T>(modules: Record<string, T>, unitId: string, suffix: string): T | undefined {
  return modules[`/content/units/${unitId}/${suffix}`]
}

async function loadJson<T>(loader: LazyJson<T> | undefined, what: string, unitId: string): Promise<T> {
  if (!loader) throw new Error(`Unit "${unitId}" has no ${what}.`)
  const mod = await loader()
  return mod.default
}

export function loadQuestions(unitId: string): Promise<Question[]> {
  return loadJson(findLazy(questionModules, unitId, 'questions.json'), 'questions.json', unitId)
}

export function loadLexicon(unitId: string): Promise<LexiconEntry[]> {
  return loadJson(findLazy(lexiconModules, unitId, 'lexicon.json'), 'lexicon.json', unitId)
}

export function loadLikelyQuiz(unitId: string): Promise<string[]> {
  return loadJson(findLazy(likelyQuizModules, unitId, 'likely-quiz.json'), 'likely-quiz.json', unitId)
}

export async function loadChapter(unitId: string, chapter: number): Promise<string> {
  const file = `chapters/ch${String(chapter).padStart(2, '0')}.md`
  const loader: LazyRaw | undefined = findLazy(chapterModules, unitId, file)
  if (!loader) throw new Error(`Unit "${unitId}" has no ${file}.`)
  return stripFrontmatter(await loader())
}

export async function loadCrossReference(unitId: string): Promise<string> {
  const loader: LazyRaw | undefined = findLazy(crossReferenceModules, unitId, 'cross-reference.md')
  if (!loader) throw new Error(`Unit "${unitId}" has no cross-reference.md.`)
  return stripFrontmatter(await loader())
}
