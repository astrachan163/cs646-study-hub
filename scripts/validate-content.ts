#!/usr/bin/env tsx
/**
 * Validates every unit and course under content/ and exits with code 1 when
 * anything is wrong. Run locally with `npm run validate`; CI runs it before
 * every build so a broken content file can never reach the live site.
 */
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { CHAPTER_FILE_PATTERN } from '../src/content/types.ts'
import {
  formatIssue,
  validateCourse,
  validateUnit,
  type UnitFiles,
  type ValidationIssue,
} from '../src/lib/validate.ts'

const contentRoot = resolve(process.argv[2] ?? 'content')
const unitsRoot = join(contentRoot, 'units')
const coursesRoot = join(contentRoot, 'courses')

interface ParsedJson {
  value: unknown | undefined
  syntaxError: string | null
}

function readJsonFile(path: string): ParsedJson {
  if (!existsSync(path)) return { value: undefined, syntaxError: null }
  const text = readFileSync(path, 'utf8')
  try {
    return { value: JSON.parse(text) as unknown, syntaxError: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    const position = /position (\d+)/.exec(message)
    let hint = ''
    if (position?.[1]) {
      const index = Number(position[1])
      const before = text.slice(0, index)
      const line = before.split('\n').length
      const column = index - before.lastIndexOf('\n')
      hint = ` (around line ${line}, column ${column})`
    }
    return { value: undefined, syntaxError: `${message}${hint}` }
  }
}

function listDirs(path: string): string[] {
  if (!existsSync(path)) return []
  return readdirSync(path)
    .filter((name) => statSync(join(path, name)).isDirectory())
    .sort()
}

function chapterNumbers(unitDir: string): number[] {
  const dir = join(unitDir, 'chapters')
  if (!existsSync(dir)) return []
  return readdirSync(dir)
    .map((file) => CHAPTER_FILE_PATTERN.exec(file)?.[1])
    .filter((n): n is string => n !== undefined)
    .map(Number)
    .sort((a, b) => a - b)
}

let totalErrors = 0
let totalWarnings = 0

function report(title: string, errors: ValidationIssue[], warnings: ValidationIssue[]): void {
  const status = errors.length === 0 ? 'OK' : 'FAILED'
  console.log(`\n${title}: ${status} (${errors.length} error(s), ${warnings.length} warning(s))`)
  for (const issue of errors) console.log(`  ${formatIssue(issue)}`)
  for (const issue of warnings) console.log(`  ${formatIssue(issue)}`)
  totalErrors += errors.length
  totalWarnings += warnings.length
}

if (!existsSync(contentRoot)) {
  console.error(`No content folder found at ${contentRoot}`)
  process.exit(1)
}

const unitIds = listDirs(unitsRoot)
if (unitIds.length === 0) {
  console.error(`No units found under ${unitsRoot}. Add a folder such as content/units/quiz-1-mastering-bitcoin-ch01-05/.`)
  process.exit(1)
}

for (const unitId of unitIds) {
  const dir = join(unitsRoot, unitId)
  const syntaxErrors: ValidationIssue[] = []
  const parsed: Record<'unit' | 'questions' | 'lexicon' | 'likelyQuiz', unknown | undefined> = {
    unit: undefined,
    questions: undefined,
    lexicon: undefined,
    likelyQuiz: undefined,
  }
  const fileNames = {
    unit: 'unit.json',
    questions: 'questions.json',
    lexicon: 'lexicon.json',
    likelyQuiz: 'likely-quiz.json',
  } as const
  for (const [k, fileName] of Object.entries(fileNames) as [keyof typeof fileNames, string][]) {
    const result = readJsonFile(join(dir, fileName))
    if (result.syntaxError) {
      syntaxErrors.push({
        level: 'error',
        file: fileName,
        where: 'JSON syntax',
        message: `the file is not valid JSON: ${result.syntaxError}.`,
        fix: 'Look for a missing comma between items, a trailing comma after the last item, unmatched quotes, or a missing bracket. Pasting the file into https://jsonlint.com shows the exact spot.',
      })
      // Give the validator an empty stand-in so it can still report the other files.
      parsed[k] = k === 'unit' ? {} : []
    } else {
      parsed[k] = result.value
    }
  }

  const files: UnitFiles = {
    unitId,
    unit: parsed.unit ?? {},
    questions: parsed.questions,
    lexicon: parsed.lexicon,
    likelyQuiz: parsed.likelyQuiz,
    chapters: chapterNumbers(dir),
    hasCrossReference: existsSync(join(dir, 'cross-reference.md')),
  }
  if (parsed.unit === undefined) {
    syntaxErrors.push({
      level: 'error',
      file: 'unit.json',
      where: 'file',
      message: 'missing. Every unit folder needs a unit.json.',
      fix: 'Copy the unit.json template from CONTENT-GUIDE.md into the folder.',
    })
  }
  const result = validateUnit(files)
  report(
    `Unit ${unitId} [${result.counts.questions} questions, ${result.counts.lexicon} terms, ${result.counts.likelyQuiz} predicted, ${result.counts.chapters} chapters]`,
    [...syntaxErrors, ...result.errors],
    result.warnings,
  )
}

const courseFiles = existsSync(coursesRoot) ? readdirSync(coursesRoot).filter((f) => f.endsWith('.json')).sort() : []
if (courseFiles.length === 0) {
  report('Courses', [
    {
      level: 'error',
      file: 'courses/',
      where: 'folder',
      message: 'no course file found.',
      fix: 'Add content/courses/<course-id>.json (see CONTENT-GUIDE.md).',
    },
  ], [])
}
for (const file of courseFiles) {
  const fileId = file.replace(/\.json$/, '')
  const parsed = readJsonFile(join(coursesRoot, file))
  if (parsed.syntaxError) {
    report(`Course ${fileId}`, [
      {
        level: 'error',
        file: `courses/${file}`,
        where: 'JSON syntax',
        message: `the file is not valid JSON: ${parsed.syntaxError}.`,
        fix: 'Check commas, quotes and brackets.',
      },
    ], [])
    continue
  }
  const issues = validateCourse(fileId, parsed.value, unitIds)
  report(
    `Course ${fileId}`,
    issues.filter((i) => i.level === 'error'),
    issues.filter((i) => i.level === 'warning'),
  )
}

console.log(`\n${totalErrors === 0 ? 'Content is valid.' : 'Content has problems.'} ${totalErrors} error(s), ${totalWarnings} warning(s).`)
process.exit(totalErrors === 0 ? 0 : 1)
