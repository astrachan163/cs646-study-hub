import {
  COVERAGES,
  DIFFICULTIES,
  LIKELIHOODS,
  QUESTION_ID_PATTERN,
  QUESTION_TYPES,
} from '../content/types.ts'

/**
 * Content validator shared by the CI script (`npm run validate`) and the tests.
 * It works on already-parsed data so it never touches the filesystem itself.
 * Every message says which file, which item, and how to fix it.
 */

export interface UnitFiles {
  /** Folder name under content/units/ */
  unitId: string
  unit: unknown
  questions: unknown | undefined
  lexicon: unknown | undefined
  likelyQuiz: unknown | undefined
  /** Chapter numbers found as chapters/chNN.md */
  chapters: number[]
  hasCrossReference: boolean
}

export type IssueLevel = 'error' | 'warning'

export interface ValidationIssue {
  level: IssueLevel
  file: string
  /** Where inside the file, e.g. "item 7 (id mb-ch02-q07)" */
  where: string
  message: string
  fix: string
}

export interface ValidationResult {
  unitId: string
  errors: ValidationIssue[]
  warnings: ValidationIssue[]
  counts: { questions: number; lexicon: number; likelyQuiz: number; chapters: number }
}

type Issues = ValidationIssue[]

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((v) => typeof v === 'string')
}

function isPositiveInt(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value > 0
}

function isValidDate(value: unknown): value is string {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value))
}

function push(issues: Issues, level: IssueLevel, file: string, where: string, message: string, fix: string): void {
  issues.push({ level, file, where, message, fix })
}

function checkEnum<T extends string>(
  issues: Issues,
  file: string,
  where: string,
  field: string,
  value: unknown,
  allowed: readonly T[],
): value is T {
  if (typeof value === 'string' && (allowed as readonly string[]).includes(value)) return true
  push(
    issues,
    'error',
    file,
    where,
    `"${field}" is ${JSON.stringify(value)} but must be one of: ${allowed.join(', ')}.`,
    `Change "${field}" to one of the allowed values (spelled exactly, lower-case).`,
  )
  return false
}

// ---------------------------------------------------------------- unit.json

function validateUnitMeta(issues: Issues, unitId: string, unit: unknown): void {
  const file = 'unit.json'
  if (!isRecord(unit)) {
    push(issues, 'error', file, 'top level', 'The file must contain one JSON object { ... }.', 'Wrap the fields in { } and check for a missing comma or bracket.')
    return
  }
  if (unit.id !== unitId) {
    push(
      issues,
      'error',
      file,
      '"id"',
      `"id" is ${JSON.stringify(unit.id)} but the folder is named "${unitId}".`,
      `Make "id" exactly "${unitId}" (or rename the folder to match the id).`,
    )
  }
  if (!isNonEmptyString(unit.title)) {
    push(issues, 'error', file, '"title"', '"title" must be a non-empty text string.', 'Add a title such as "Quiz 1: Mastering Bitcoin Chapters 1-5".')
  }
  if (!isNonEmptyString(unit.course)) {
    push(issues, 'error', file, '"course"', '"course" must name a course id (matching a file in content/courses/).', 'Set "course": "cs646-fall-2026".')
  }
  const a = unit.assessment
  if (!isRecord(a)) {
    push(issues, 'error', file, '"assessment"', '"assessment" must be an object with type, questions, points, minutes, opens, closes.', 'Copy the assessment block from the template in CONTENT-GUIDE.md.')
  } else {
    if (!isNonEmptyString(a.type)) push(issues, 'error', file, '"assessment.type"', 'must be text such as "quiz" or "exam".', 'Set "type": "quiz".')
    if (!isPositiveInt(a.questions)) push(issues, 'error', file, '"assessment.questions"', 'must be a whole number greater than 0.', 'Set it to the number of questions on the real assessment, e.g. 20.')
    if (typeof a.points !== 'number' || a.points <= 0) push(issues, 'error', file, '"assessment.points"', 'must be a number greater than 0.', 'Set it to the points the real assessment is worth, e.g. 20.')
    if (typeof a.minutes !== 'number' || a.minutes <= 0) push(issues, 'error', file, '"assessment.minutes"', 'must be a number greater than 0.', 'Set it to the time limit in minutes, e.g. 10.')
    if (!isValidDate(a.opens)) push(issues, 'error', file, '"assessment.opens"', 'must be a date-time like "2026-09-22T18:30:00-05:00".', 'Use YYYY-MM-DDTHH:MM:SS followed by the time-zone offset (-05:00 for Central Daylight Time).')
    if (!isValidDate(a.closes)) push(issues, 'error', file, '"assessment.closes"', 'must be a date-time like "2026-09-22T18:40:00-05:00".', 'Use the same format as "opens".')
    if (isValidDate(a.opens) && isValidDate(a.closes) && Date.parse(a.closes) < Date.parse(a.opens)) {
      push(issues, 'warning', file, '"assessment.closes"', '"closes" is earlier than "opens".', 'Swap the two values or fix the typo.')
    }
  }
  if (!Array.isArray(unit.sources)) {
    push(issues, 'error', file, '"sources"', '"sources" must be a list of {"label": "...", "url": "..." or null}.', 'Add at least one source such as the textbook chapters.')
  } else {
    unit.sources.forEach((s, i) => {
      if (!isRecord(s) || !isNonEmptyString(s.label) || !(s.url === null || typeof s.url === 'string')) {
        push(issues, 'error', file, `"sources" item ${i + 1}`, 'each source needs a text "label" and a "url" (text or null).', 'Example: {"label": "Mastering Bitcoin ch01-05", "url": "https://github.com/bitcoinbook/bitcoinbook"}')
      }
    })
  }
  if (!isStringArray(unit.scopeNotes)) {
    push(issues, 'error', file, '"scopeNotes"', '"scopeNotes" must be a list of text strings (it may be empty: []).', 'Example: ["Instructor said calculations are out of scope"]')
  }
}

// ------------------------------------------------------------ questions.json

function questionWhere(index: number, item: unknown): string {
  const id = isRecord(item) && typeof item.id === 'string' ? ` (id ${item.id})` : ''
  return `item ${index + 1}${id}`
}

function validateQuestions(issues: Issues, questions: unknown, chapters: number[]): string[] {
  const file = 'questions.json'
  const ids: string[] = []
  if (!Array.isArray(questions)) {
    push(issues, 'error', file, 'top level', 'The file must be a JSON list [ ... ] of question objects.', 'Wrap all questions in [ ] and separate them with commas.')
    return ids
  }
  if (questions.length === 0) {
    push(issues, 'error', file, 'top level', 'The question list is empty.', 'Add at least one question.')
  }
  const seenIds = new Map<string, number>()
  const seenPrompts = new Map<string, number>()
  questions.forEach((q, i) => {
    const where = questionWhere(i, q)
    if (!isRecord(q)) {
      push(issues, 'error', file, where, 'must be an object { ... }.', 'Check for a stray comma or a missing brace.')
      return
    }
    if (!isNonEmptyString(q.id) || !QUESTION_ID_PATTERN.test(q.id)) {
      push(issues, 'error', file, where, `"id" ${JSON.stringify(q.id)} does not match the pattern <source>-ch<NN>-q<NN> (e.g. mb-ch02-q07).`, 'Use lower-case letters/digits for the source, two-digit chapter, two-digit question number.')
    } else {
      const firstIndex = seenIds.get(q.id)
      if (firstIndex !== undefined) {
        push(issues, 'error', file, where, `duplicate id "${q.id}" (also used by item ${firstIndex + 1}).`, 'Give every question a unique id.')
      } else {
        seenIds.set(q.id, i)
        ids.push(q.id)
      }
      const chapterInId = Number(q.id.match(/-ch(\d{2})-/)?.[1])
      if (isPositiveInt(q.chapter) && chapterInId !== q.chapter) {
        push(issues, 'warning', file, where, `"chapter" is ${q.chapter} but the id says ch${String(chapterInId).padStart(2, '0')}.`, 'Make the id and the chapter field agree.')
      }
    }
    if (!isPositiveInt(q.chapter)) {
      push(issues, 'error', file, where, '"chapter" must be a whole number greater than 0.', 'Set "chapter" to the book chapter number, e.g. 2.')
    } else if (chapters.length > 0 && !chapters.includes(q.chapter)) {
      push(issues, 'warning', file, where, `"chapter" ${q.chapter} has no study guide file chapters/ch${String(q.chapter).padStart(2, '0')}.md.`, 'Add the chapter file or check the chapter number.')
    }
    if (!isNonEmptyString(q.section)) push(issues, 'error', file, where, '"section" must be text such as "How Bitcoin Works > Bitcoin Transactions".', 'Fill in the book section.')
    if (!isNonEmptyString(q.prompt)) {
      push(issues, 'error', file, where, '"prompt" (the question text) is missing or empty.', 'Write the question in "prompt".')
    } else {
      const key = q.prompt.trim().toLowerCase()
      const dup = seenPrompts.get(key)
      if (dup !== undefined) push(issues, 'warning', file, where, `same prompt as item ${dup + 1}.`, 'Remove or reword one of them.')
      else seenPrompts.set(key, i)
    }
    if (checkEnum(issues, file, where, 'type', q.type, QUESTION_TYPES)) {
      switch (q.type) {
        case 'mcq': {
          if (!isStringArray(q.choices) || q.choices.length < 2 || q.choices.some((c) => c.trim() === '')) {
            push(issues, 'error', file, where, 'multiple-choice questions need "choices": a list of at least 2 non-empty texts.', 'Add the answer options as a list of strings.')
          } else if (!Number.isInteger(q.answer) || typeof q.answer !== 'number' || q.answer < 0 || q.answer >= q.choices.length) {
            push(issues, 'error', file, where, `"answer" is ${JSON.stringify(q.answer)}; with ${q.choices.length} choices it must be a whole number from 0 to ${q.choices.length - 1} (0 = first choice).`, 'Count the choices starting at 0 and set "answer" to the index of the correct one.')
          }
          break
        }
        case 'tf': {
          if (typeof q.answer !== 'boolean') {
            push(issues, 'error', file, where, `true/false questions need "answer": true or false (no quotes); got ${JSON.stringify(q.answer)}.`, 'Set "answer": true or "answer": false.')
          }
          if (q.choices !== undefined) push(issues, 'warning', file, where, 'true/false questions should not have "choices".', 'Delete the "choices" field.')
          break
        }
        case 'short': {
          if (!isNonEmptyString(q.answer)) {
            push(issues, 'error', file, where, 'short-answer questions need "answer": the model answer as text.', 'Write the expected answer in "answer".')
          }
          break
        }
        default: {
          const exhaustive: never = q.type
          return exhaustive
        }
      }
    }
    if (typeof q.explanation !== 'string') {
      push(issues, 'error', file, where, '"explanation" must be text (why the answer is right and the distractors are wrong).', 'Add an "explanation" string.')
    } else if (q.explanation.trim() === '') {
      push(issues, 'warning', file, where, '"explanation" is empty, so the results page cannot teach anything.', 'Write one or two sentences of explanation.')
    }
    if (!isRecord(q.source)) {
      push(issues, 'error', file, where, '"source" must be an object like {"book": "...", "lecture": "..." or null}.', 'Add "source": {"book": "ch02 > ...", "lecture": null}.')
    } else {
      for (const key of ['book', 'lecture'] as const) {
        if (!(key in q.source)) push(issues, 'warning', file, where, `"source.${key}" is missing.`, `Add "${key}": null if there is no ${key} reference.`)
        else if (!(q.source[key] === null || typeof q.source[key] === 'string')) push(issues, 'error', file, where, `"source.${key}" must be text or null.`, `Set "${key}" to a text reference or null.`)
      }
    }
    checkEnum(issues, file, where, 'coverage', q.coverage, COVERAGES)
    const likelihoodOk = checkEnum(issues, file, where, 'likelihood', q.likelihood, LIKELIHOODS)
    checkEnum(issues, file, where, 'difficulty', q.difficulty, DIFFICULTIES)
    if (!isStringArray(q.tags)) {
      push(issues, 'error', file, where, '"tags" must be a list of text strings (it may be empty: []).', 'Example: ["utxo", "transactions"]')
    } else if (q.tags.includes('calculation') && likelihoodOk && q.likelihood !== 'low') {
      push(issues, 'error', file, where, 'questions tagged "calculation" must have "likelihood": "low" (the instructor excluded calculations).', 'Set "likelihood": "low" or remove the "calculation" tag.')
    }
  })
  return ids
}

// -------------------------------------------------------------- lexicon.json

function validateLexicon(issues: Issues, lexicon: unknown): number {
  const file = 'lexicon.json'
  if (!Array.isArray(lexicon)) {
    push(issues, 'error', file, 'top level', 'The file must be a JSON list [ ... ] of term objects.', 'Wrap all entries in [ ] and separate them with commas.')
    return 0
  }
  const terms = new Map<string, number>()
  lexicon.forEach((entry, i) => {
    const where = isRecord(entry) && typeof entry.term === 'string' ? `item ${i + 1} ("${entry.term}")` : `item ${i + 1}`
    if (!isRecord(entry)) {
      push(issues, 'error', file, where, 'must be an object { ... }.', 'Check for a stray comma or a missing brace.')
      return
    }
    if (!isNonEmptyString(entry.term)) {
      push(issues, 'error', file, where, '"term" is missing or empty.', 'Add the term text.')
    } else {
      const key = entry.term.trim().toLowerCase()
      const dup = terms.get(key)
      if (dup !== undefined) push(issues, 'error', file, where, `duplicate term (also item ${dup + 1}).`, 'Merge the two entries or rename one.')
      else terms.set(key, i)
    }
    if (!isNonEmptyString(entry.definition)) push(issues, 'error', file, where, '"definition" is missing or empty.', 'Write the definition.')
    if (!isPositiveInt(entry.chapter)) push(issues, 'error', file, where, '"chapter" must be a whole number greater than 0.', 'Set the chapter where the term is introduced.')
    checkEnum(issues, file, where, 'coverage', entry.coverage, COVERAGES)
    if (entry.related === undefined) push(issues, 'warning', file, where, '"related" is missing.', 'Add "related": [] or a list of related terms.')
    else if (!isStringArray(entry.related)) push(issues, 'error', file, where, '"related" must be a list of text strings.', 'Example: "related": ["transaction", "input"]')
  })
  lexicon.forEach((entry, i) => {
    if (!isRecord(entry) || !isStringArray(entry.related) || typeof entry.term !== 'string') return
    for (const rel of entry.related) {
      if (!terms.has(rel.trim().toLowerCase())) {
        push(issues, 'warning', file, `item ${i + 1} ("${entry.term}")`, `related term "${rel}" is not defined in the lexicon.`, 'Add an entry for it or remove it from "related".')
      }
    }
  })
  return lexicon.length
}

// ---------------------------------------------------------- likely-quiz.json

function validateLikelyQuiz(issues: Issues, likelyQuiz: unknown, questionIds: string[], expectedCount: number | null): number {
  const file = 'likely-quiz.json'
  if (!isStringArray(likelyQuiz)) {
    push(issues, 'error', file, 'top level', 'The file must be a JSON list of question ids, e.g. ["mb-ch01-q01", "mb-ch02-q03"].', 'List the ids in the order the predicted quiz should be shown.')
    return 0
  }
  const known = new Set(questionIds)
  const seen = new Set<string>()
  likelyQuiz.forEach((id, i) => {
    if (!known.has(id)) push(issues, 'error', file, `item ${i + 1}`, `id "${id}" does not exist in questions.json.`, 'Fix the typo or add the question to questions.json.')
    if (seen.has(id)) push(issues, 'error', file, `item ${i + 1}`, `id "${id}" is listed more than once.`, 'Remove the duplicate.')
    seen.add(id)
  })
  if (expectedCount !== null && likelyQuiz.length !== expectedCount) {
    push(issues, 'warning', file, 'top level', `lists ${likelyQuiz.length} ids but the assessment has ${expectedCount} questions.`, `Aim for exactly ${expectedCount} ids so the predicted quiz matches the real one.`)
  }
  return likelyQuiz.length
}

// -------------------------------------------------------------------- unit

export function validateUnit(files: UnitFiles): ValidationResult {
  const issues: Issues = []
  validateUnitMeta(issues, files.unitId, files.unit)

  if (files.chapters.length === 0) {
    push(issues, 'warning', 'chapters/', 'folder', 'no chapter files found (chapters/ch01.md, ch02.md, ...).', 'Add one Markdown file per chapter so the Study Guide has content.')
  }
  if (!files.hasCrossReference) {
    push(issues, 'warning', 'cross-reference.md', 'file', 'missing, so the Cross-Reference page will be empty.', 'Add cross-reference.md with the lecture <-> book tables.')
  }

  let questionIds: string[] = []
  if (files.questions === undefined) {
    push(issues, 'error', 'questions.json', 'file', 'missing. A unit needs a question bank for the practice quiz.', 'Add questions.json (see CONTENT-GUIDE.md for the template).')
  } else {
    questionIds = validateQuestions(issues, files.questions, files.chapters)
  }

  let lexiconCount = 0
  if (files.lexicon === undefined) {
    push(issues, 'warning', 'lexicon.json', 'file', 'missing, so the Lexicon and Flashcards pages will be empty.', 'Add lexicon.json.')
  } else {
    lexiconCount = validateLexicon(issues, files.lexicon)
  }

  let likelyCount = 0
  const expected =
    isRecord(files.unit) && isRecord(files.unit.assessment) && isPositiveInt(files.unit.assessment.questions)
      ? files.unit.assessment.questions
      : null
  if (files.likelyQuiz === undefined) {
    push(issues, 'warning', 'likely-quiz.json', 'file', 'missing, so the Likely Quiz page will be empty.', 'Add likely-quiz.json listing the predicted question ids in order.')
  } else {
    likelyCount = validateLikelyQuiz(issues, files.likelyQuiz, questionIds, expected)
  }

  return {
    unitId: files.unitId,
    errors: issues.filter((i) => i.level === 'error'),
    warnings: issues.filter((i) => i.level === 'warning'),
    counts: {
      questions: Array.isArray(files.questions) ? files.questions.length : 0,
      lexicon: lexiconCount,
      likelyQuiz: likelyCount,
      chapters: files.chapters.length,
    },
  }
}

// ------------------------------------------------------------------ course

export function validateCourse(fileId: string, course: unknown, unitIds: string[]): ValidationIssue[] {
  const issues: Issues = []
  const file = `courses/${fileId}.json`
  if (!isRecord(course)) {
    push(issues, 'error', file, 'top level', 'The file must contain one JSON object { ... }.', 'Copy the course template from CONTENT-GUIDE.md.')
    return issues
  }
  if (course.id !== fileId) push(issues, 'error', file, '"id"', `"id" is ${JSON.stringify(course.id)} but the file is named ${fileId}.json.`, `Make "id" exactly "${fileId}".`)
  for (const key of ['code', 'name', 'term', 'institution', 'instructor', 'meeting', 'timezone'] as const) {
    if (!isNonEmptyString(course[key])) push(issues, 'error', file, `"${key}"`, `"${key}" must be non-empty text.`, `Fill in "${key}".`)
  }
  if (!Array.isArray(course.textbooks)) push(issues, 'error', file, '"textbooks"', 'must be a list of {"title": "...", "url": "..." or null}.', 'Add the textbooks list (it may be empty).')
  if (!Array.isArray(course.schedule)) {
    push(issues, 'error', file, '"schedule"', 'must be a list of assessments {"title", "type", "points", "at", "unit"}.', 'Add the schedule list (it may be empty).')
  } else {
    course.schedule.forEach((item, i) => {
      const where = `"schedule" item ${i + 1}`
      if (!isRecord(item)) {
        push(issues, 'error', file, where, 'must be an object { ... }.', 'Check the braces and commas.')
        return
      }
      if (!isNonEmptyString(item.title)) push(issues, 'error', file, where, '"title" must be non-empty text.', 'Name the assessment.')
      if (!isNonEmptyString(item.type)) push(issues, 'error', file, where, '"type" must be text such as "quiz", "exam" or "project".', 'Set the type.')
      if (!(item.points === null || typeof item.points === 'number')) push(issues, 'error', file, where, '"points" must be a number or null.', 'Set the points or null if unknown.')
      if (!isValidDate(item.at)) push(issues, 'error', file, where, '"at" must be a date-time like "2026-09-29T17:00:00-05:00".', 'Use YYYY-MM-DDTHH:MM:SS plus the time-zone offset.')
      if (!(item.unit === null || typeof item.unit === 'string')) push(issues, 'error', file, where, '"unit" must be a unit id or null.', 'Set "unit": null until a study unit exists.')
      else if (typeof item.unit === 'string' && !unitIds.includes(item.unit)) push(issues, 'warning', file, where, `"unit" "${item.unit}" has no folder under content/units/.`, 'Create the unit folder or set "unit": null.')
    })
  }
  return issues
}

export function formatIssue(issue: ValidationIssue): string {
  const label = issue.level === 'error' ? 'ERROR' : 'warning'
  return `${label}: ${issue.file} → ${issue.where}: ${issue.message}\n    fix: ${issue.fix}`
}
