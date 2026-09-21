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
    likelyQuiz: readJson(dir, 'likely-quiz.json'),
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

function errorsMentioning(files: UnitFiles, text: string): number {
  return validateUnit(files).errors.filter((e) => e.message.includes(text) || e.where.includes(text)).length
}

describe('shipped content', () => {
  it('the example template passes with no errors and no warnings', () => {
    const result = validateUnit(fixture())
    expect(result.errors).toEqual([])
    expect(result.warnings).toEqual([])
    expect(result.counts.questions).toBe(6)
    expect(result.counts.likelyQuiz).toBe(6)
  })

  it('every unit under content/units/ passes with no errors', () => {
    const unitIds = readdirSync(UNITS_DIR)
    expect(unitIds.length).toBeGreaterThan(0)
    for (const unitId of unitIds) {
      const result = validateUnit(loadUnitDir(join(UNITS_DIR, unitId), unitId))
      expect(result.errors, `unit ${unitId}`).toEqual([])
      expect(result.counts.questions).toBeGreaterThan(0)
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

  it('rejects likely-quiz ids that do not exist or repeat', () => {
    const files = fixture()
    const ids = files.likelyQuiz as string[]
    files.likelyQuiz = [...ids.slice(0, 4), 'ex-ch99-q99', ids[0]!]
    const errors = validateUnit(files).errors
    expect(errors.some((e) => e.message.includes('"ex-ch99-q99" does not exist'))).toBe(true)
    expect(errors.some((e) => e.message.includes('listed more than once'))).toBe(true)
  })

  it('rejects a unit id that does not match its folder', () => {
    const files = fixture()
    files.unitId = 'renamed-folder'
    expect(errorsMentioning(files, 'folder is named')).toBe(1)
  })

  it('treats a missing question bank as an error but missing extras as warnings', () => {
    const files = fixture()
    files.questions = undefined
    files.lexicon = undefined
    files.likelyQuiz = undefined
    files.hasCrossReference = false
    files.chapters = []
    const result = validateUnit(files)
    expect(result.errors.map((e) => e.file)).toEqual(['questions.json'])
    expect(result.warnings.map((w) => w.file).sort()).toEqual(['chapters/', 'cross-reference.md', 'lexicon.json', 'likely-quiz.json'])
  })

  it('warns when the predicted quiz length differs from the real assessment', () => {
    const files = fixture()
    files.likelyQuiz = (files.likelyQuiz as string[]).slice(0, 2)
    expect(validateUnit(files).warnings.some((w) => w.message.includes('lists 2 ids but the assessment has 6'))).toBe(true)
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
