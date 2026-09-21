import { existsSync, readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { CHAPTER_FILE_PATTERN } from '../content/types.ts'
import { validateCourse, validateUnit, type UnitFiles } from './validate.ts'

const TEMPLATE_DIR = join(process.cwd(), 'templates/unit-template')
const UNITS_DIR = join(process.cwd(), 'content/units')
const COURSES_DIR = join(process.cwd(), 'content/courses')

function readJson(dir: string, file: string): unknown | undefined {
  const path = join(dir, file)
  return existsSync(path) ? (JSON.parse(readFileSync(path, 'utf8')) as unknown) : undefined
}

function loadUnitDir(dir: string, unitId: string): UnitFiles {
  const chaptersDir = join(dir, 'chapters')
  const chapters = existsSync(chaptersDir)
    ? readdirSync(chaptersDir)
        .map((f) => CHAPTER_FILE_PATTERN.exec(f)?.[1])
        .filter((n): n is string => n !== undefined)
        .map(Number)
        .sort((a, b) => a - b)
    : []
  return {
    unitId,
    unit: readJson(dir, 'unit.json'),
    questions: readJson(dir, 'questions.json'),
    lexicon: readJson(dir, 'lexicon.json'),
    likelyQuizzes: readJson(dir, 'likely-quizzes.json'),
    chapters,
    hasCrossReference: existsSync(join(dir, 'cross-reference.md')),
  }
}

/** The template is the fixture for negative tests: small, complete, and known to be valid. */
function fixture(): UnitFiles {
  return loadUnitDir(TEMPLATE_DIR, 'unit-template')
}

function questionsOf(files: UnitFiles): Record<string, unknown>[] {
  return files.questions as Record<string, unknown>[]
}

function quizzesOf(files: UnitFiles): Record<string, unknown>[] {
  return files.likelyQuizzes as Record<string, unknown>[]
}

function errorsMentioning(files: UnitFiles, text: string): number {
  return validateUnit(files).errors.filter((e) => e.message.includes(text) || e.where.includes(text)).length
}

describe('shipped content', () => {
  it('the example template passes with no errors and no warnings', () => {
    const result = validateUnit(fixture())
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.counts.questions).toBe(6)
    expect(result.counts.likelyQuizzes).toBe(3)
  })

  it('every unit under content/units/ passes with no errors and ships three predicted quizzes', () => {
    const unitIds = readdirSync(UNITS_DIR)
    expect(unitIds.length).toBeGreaterThan(0)
    for (const unitId of unitIds) {
      const result = validateUnit(loadUnitDir(join(UNITS_DIR, unitId), unitId))
      expect(result.errors, `unit ${unitId}`).toEqual([])
      expect(result.counts.questions).toBeGreaterThan(0)
      expect(result.counts.likelyQuizzes, `unit ${unitId}`).toBe(3)
      expect(existsSync(join(UNITS_DIR, unitId, 'likely-quiz.json')), `unit ${unitId} still has the old likely-quiz.json`).toBe(false)
    }
  })

  it('every course file passes with no errors', () => {
    const unitIds = readdirSync(UNITS_DIR)
    for (const file of readdirSync(COURSES_DIR)) {
      const issues = validateCourse(file.replace(/\.json$/, ''), readJson(COURSES_DIR, file), unitIds)
      expect(issues.filter((i) => i.level === 'error'), file).toEqual([])
    }
  })
})

describe('validateUnit catches content mistakes', () => {
  it('rejects a bad id pattern', () => {
    const files = fixture()
    questionsOf(files)[0]!.id = 'Chapter1-Question1'
    expect(errorsMentioning(files, 'does not match the pattern')).toBe(1)
  })

  it('rejects duplicate ids', () => {
    const files = fixture()
    questionsOf(files)[1]!.id = questionsOf(files)[0]!.id
    expect(errorsMentioning(files, 'duplicate id')).toBe(1)
  })

  it('rejects a multiple-choice answer index outside the choices', () => {
    const files = fixture()
    const mcq = questionsOf(files).find((q) => q.type === 'mcq')!
    mcq.answer = 4
    const errors = validateUnit(files).errors
    expect(errors.some((e) => e.message.includes('must be a whole number from 0 to 3'))).toBe(true)
  })

  it('rejects a true/false answer given as a string', () => {
    const files = fixture()
    const tf = questionsOf(files).find((q) => q.type === 'tf')!
    tf.answer = 'true'
    expect(errorsMentioning(files, 'true or false (no quotes)')).toBe(1)
  })

  it('rejects a short answer without a model answer', () => {
    const files = fixture()
    const short = questionsOf(files).find((q) => q.type === 'short')!
    short.answer = ''
    expect(errorsMentioning(files, 'short-answer questions need')).toBe(1)
  })

  it('rejects an unknown enum value', () => {
    const files = fixture()
    questionsOf(files)[0]!.coverage = 'lecture'
    expect(errorsMentioning(files, '"coverage" is "lecture"')).toBe(1)
  })

  it('enforces the instructor rule: calculation questions must be low likelihood', () => {
    const files = fixture()
    const calc = questionsOf(files).find((q) => (q.tags as string[]).includes('calculation'))!
    calc.likelihood = 'high'
    expect(errorsMentioning(files, 'tagged "calculation"')).toBe(1)
  })

  it('rejects a unit id that does not match its folder', () => {
    const files = fixture()
    files.unitId = 'renamed-folder'
    expect(errorsMentioning(files, 'folder is named')).toBe(1)
  })

  it('treats a missing question bank and missing predicted quizzes as errors, other missing extras as warnings', () => {
    const files = fixture()
    files.questions = undefined
    files.lexicon = undefined
    files.likelyQuizzes = undefined
    files.hasCrossReference = false
    files.chapters = []
    const result = validateUnit(files)
    expect(result.errors.map((e) => e.file).sort()).toEqual(['likely-quizzes.json', 'questions.json'])
    expect(result.errors.find((e) => e.file === 'likely-quizzes.json')?.message).toContain('likely-quiz.json is no longer read')
    expect(result.warnings.map((w) => w.file).sort()).toEqual(['chapters/', 'cross-reference.md', 'lexicon.json'])
  })
})

describe('validateUnit enforces the likely-quizzes.json contract', () => {
  it('accepts the template: three quizzes, one per basis, one primary, ids shared across quizzes', () => {
    const quizzes = quizzesOf(fixture())
    expect(quizzes.map((q) => q.basis)).toEqual(['lecture', 'mixed', 'book'])
    expect(quizzes.filter((q) => q.primary === true)).toHaveLength(1)
    const [a, b] = quizzes as { questionIds: string[] }[]
    expect(a!.questionIds.some((id) => b!.questionIds.includes(id))).toBe(true)
    expect(validateUnit(fixture()).errors).toEqual([])
  })

  it('rejects a file that is not a list of quizzes', () => {
    const files = fixture()
    files.likelyQuizzes = { lecture: [], mixed: [], book: [] }
    expect(errorsMentioning(files, 'exactly three quiz objects')).toBe(1)
    files.likelyQuizzes = ['ex-ch01-q01', 'ex-ch01-q05']
    expect(validateUnit(files).errors.filter((e) => e.file === 'likely-quizzes.json').length).toBeGreaterThan(0)
  })

  it('rejects the wrong number of quizzes', () => {
    const two = fixture()
    two.likelyQuizzes = quizzesOf(two).slice(0, 2)
    expect(errorsMentioning(two, 'lists 2 quizzes but there must be exactly 3')).toBe(1)
    const four = fixture()
    four.likelyQuizzes = [...quizzesOf(four), { ...quizzesOf(four)[0]!, id: 'extra', primary: false }]
    expect(errorsMentioning(four, 'lists 4 quizzes but there must be exactly 3')).toBe(1)
  })

  it('rejects an unknown basis and a basis used twice', () => {
    const files = fixture()
    quizzesOf(files)[0]!.basis = 'slides'
    expect(errorsMentioning(files, '"basis" is "slides"')).toBe(1)
    const twice = fixture()
    quizzesOf(twice)[0]!.basis = 'book'
    expect(errorsMentioning(twice, '"basis" "book" is also used by quiz 1')).toBe(1)
  })

  it('rejects zero primaries and multiple primaries', () => {
    const none = fixture()
    for (const q of quizzesOf(none)) q.primary = false
    expect(errorsMentioning(none, 'no quiz has "primary": true')).toBe(1)
    const many = fixture()
    for (const q of quizzesOf(many)) q.primary = true
    expect(errorsMentioning(many, '3 quizzes have "primary": true')).toBe(1)
    const quoted = fixture()
    quizzesOf(quoted)[1]!.primary = 'true'
    expect(errorsMentioning(quoted, '"primary" must be true or false')).toBe(1)
  })

  it('rejects question ids that do not exist or repeat inside one quiz', () => {
    const files = fixture()
    const quiz = quizzesOf(files)[1]!
    const ids = quiz.questionIds as string[]
    quiz.questionIds = [...ids.slice(0, 4), 'ex-ch99-q99', ids[0]!]
    const errors = validateUnit(files).errors
    expect(errors.some((e) => e.message.includes('"ex-ch99-q99" does not exist') && e.where.includes('quiz 2 (id mixed)'))).toBe(true)
    expect(errors.some((e) => e.message.includes('"ex-ch01-q05" is listed more than once in this quiz'))).toBe(true)
  })

  it('rejects a quiz whose question count differs from the real assessment', () => {
    const files = fixture()
    const quiz = quizzesOf(files)[2]!
    quiz.questionIds = (quiz.questionIds as string[]).slice(0, 2)
    expect(errorsMentioning(files, 'lists 2 question ids but the assessment has 6')).toBe(1)
  })

  it('rejects duplicate quiz ids and missing text fields', () => {
    const files = fixture()
    const quizzes = quizzesOf(files)
    quizzes[2]!.id = quizzes[0]!.id
    quizzes[1]!.title = ''
    delete quizzes[0]!.description
    quizzes[0]!.questionIds = 'ex-ch01-q01'
    const errors = validateUnit(files).errors
    expect(errors.some((e) => e.message.includes('duplicate quiz id "lecture"'))).toBe(true)
    expect(errors.some((e) => e.message.includes('"title" must be a non-empty text string'))).toBe(true)
    expect(errors.some((e) => e.message.includes('"description" must be text'))).toBe(true)
    expect(errors.some((e) => e.message.includes('"questionIds" must be a list of question ids'))).toBe(true)
  })

  it('only warns about an empty description', () => {
    const files = fixture()
    quizzesOf(files)[0]!.description = '   '
    const result = validateUnit(files)
    expect(result.errors).toEqual([])
    expect(result.warnings.some((w) => w.message.includes('"description" is empty'))).toBe(true)
  })

  it('warns about a question whose chapter has no study guide file', () => {
    const files = fixture()
    questionsOf(files)[0]!.chapter = 7
    expect(validateUnit(files).warnings.some((w) => w.message.includes('chapters/ch07.md'))).toBe(true)
  })

  it('rejects duplicate lexicon terms and warns about unknown related terms', () => {
    const files = fixture()
    const lexicon = files.lexicon as Record<string, unknown>[]
    lexicon[1]!.term = lexicon[0]!.term
    lexicon[2]!.related = ['not-a-real-term']
    const result = validateUnit(files)
    expect(result.errors.some((e) => e.file === 'lexicon.json' && e.message.includes('duplicate term'))).toBe(true)
    expect(result.warnings.some((w) => w.message.includes('"not-a-real-term" is not defined'))).toBe(true)
  })

  it('reports non-JSON-object files clearly', () => {
    const files = fixture()
    files.unit = 'not an object'
    files.questions = { not: 'a list' }
    const result = validateUnit(files)
    expect(result.errors.some((e) => e.file === 'unit.json' && e.message.includes('one JSON object'))).toBe(true)
    expect(result.errors.some((e) => e.file === 'questions.json' && e.message.includes('JSON list'))).toBe(true)
  })
})

describe('validateCourse', () => {
  const course = readJson(COURSES_DIR, 'cs646-fall-2026.json') as Record<string, unknown>

  it('warns about schedule entries pointing at units that do not exist yet', () => {
    const issues = validateCourse('cs646-fall-2026', course, [])
    expect(issues.every((i) => i.level === 'warning')).toBe(true)
    expect(issues.some((i) => i.message.includes('has no folder under content/units/'))).toBe(true)
  })

  it('rejects a mismatched id and bad dates', () => {
    const broken = { ...course, id: 'other', schedule: [{ title: 'x', type: 'quiz', points: 1, at: 'tomorrow', unit: null }] }
    const issues = validateCourse('cs646-fall-2026', broken, [])
    expect(issues.some((i) => i.where === '"id"')).toBe(true)
    expect(issues.some((i) => i.message.includes('date-time'))).toBe(true)
  })

  it('accepts "at": null for assessments whose date is not announced yet', () => {
    const tba = { ...course, schedule: [{ title: 'Quiz 2', type: 'quiz', points: 20, at: null, unit: null }] }
    expect(validateCourse('cs646-fall-2026', tba, [])).toEqual([])
  })
})
