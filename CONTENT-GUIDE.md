# Content guide: adding a quiz or test unit to the CS 646 Study Hub

This is the standard operating procedure (SOP) for turning study material into a new unit on the
live site. It assumes you have never used a terminal (the text-only window where you type commands)
and explains every term the first time it appears. If you only need to fix a typo in an existing
question, jump to [SOP B](#sop-b-fix-or-improve-existing-content).

Table of contents

1. [Vocabulary you will meet](#1-vocabulary-you-will-meet)
2. [The map: where everything lives](#2-the-map-where-everything-lives)
3. [The content contract (what each file must contain)](#3-the-content-contract)
4. [SOP A: add a new unit and publish it](#sop-a-add-a-new-unit-and-publish-it)
5. [SOP B: fix or improve existing content](#sop-b-fix-or-improve-existing-content)
6. [Troubleshooting: what an error means and how to fix it](#6-troubleshooting)
7. [Lessons learned](#7-lessons-learned)

---

## 1. Vocabulary you will meet

| Term | Plain meaning |
|---|---|
| **Repository (repo)** | The project folder, tracked by Git so every change is recorded and can be undone. Ours is `cs646-study-hub`. |
| **Git** | The program that records versions of the folder. You "commit" (save a labelled snapshot) and "push" (upload the snapshot to GitHub). |
| **GitHub** | The website that stores the repository online and runs our automation. |
| **GitHub Actions / CI** | Automation that runs on GitHub after every push: it checks the content, builds the site and publishes it. "CI" = continuous integration = "check every change automatically". |
| **GitHub Pages** | GitHub's free static-website hosting. The site lives at `https://<github-user>.github.io/cs646-study-hub/`. |
| **Terminal** | A window where you type commands instead of clicking. On a Mac it is the app called Terminal (or the panel at the bottom of Cursor/VS Code called "Terminal"). Every command in this guide says *where* to run it. |
| **Project root** | The top folder of the repository, the one that contains `package.json`. "Run this in the project root" means the terminal's current folder must be that folder. |
| **`cd`** | The command that changes the terminal's current folder ("change directory"). `cd ~/Projects/cs646-study-hub` moves into the project root. |
| **Node.js / npm** | Node runs JavaScript outside a browser; npm is its package installer and script runner. `npm run validate` runs the script named `validate` from `package.json`. |
| **JSON** | A strict text format for data: `{"key": "value"}` objects and `[1, 2, 3]` lists. Every quote, comma and bracket matters. |
| **Markdown (.md)** | Lightweight text formatting: `# Heading`, `**bold**`, `- bullet`, and tables with `|`. Chapters are Markdown. |
| **Mermaid** | Diagrams written as text inside a Markdown code fence that starts with three backticks and the word `mermaid`. The site draws them as boxes and arrows. |
| **Unit** | One quiz or test worth of material: a folder under `content/units/`. |
| **Validator** | Our checker (`npm run validate`) that reads every content file and reports mistakes in plain English before they reach the site. |

---

## 2. The map: where everything lives

```
cs646-study-hub/                      <- project root
├── content/                          <- ALL study material (you edit here)
│   ├── courses/
│   │   └── cs646-fall-2026.json      <- course facts + calendar of assessments
│   └── units/
│       └── quiz-1-mastering-bitcoin-ch01-05/   <- one folder per quiz/test
│           ├── unit.json             <- title, real quiz facts (20 q, 20 pts, 10 min, date)
│           ├── chapters/ch01.md ...  <- one study guide per chapter (Markdown + Mermaid)
│           ├── cross-reference.md    <- lecture <-> book tables
│           ├── lexicon.json          <- glossary terms
│           ├── questions.json        <- the question bank
│           └── likely-quiz.json      <- the predicted 20 question ids, in order
├── templates/unit-template/          <- a tiny complete unit to copy from
├── src/                              <- the app code (you do not need to touch it)
├── scripts/validate-content.ts       <- the validator the CI and you run
├── .github/workflows/deploy.yml      <- the automation that checks + publishes
├── CONTENT-GUIDE.md                  <- this file
└── PUBLISHING.md                     <- first-time publishing from your computer
```

Rule of thumb: **content authors only ever create or edit files under `content/`**. Adding a
folder under `content/units/` is enough; the app discovers it automatically when it is built.

---

## 3. The content contract

Every unit folder must follow this contract exactly. Spellings are case-sensitive and lower-case.

### 3.1 `unit.json` (required)

```json
{
  "id": "quiz-1-mastering-bitcoin-ch01-05",
  "title": "Quiz 1: Mastering Bitcoin Chapters 1-5",
  "course": "cs646-fall-2026",
  "assessment": {
    "type": "quiz",
    "questions": 20,
    "points": 20,
    "minutes": 10,
    "opens": "2026-09-22T18:30:00-05:00",
    "closes": "2026-09-22T18:40:00-05:00"
  },
  "sources": [
    {"label": "Mastering Bitcoin ch01-05", "url": "https://github.com/bitcoinbook/bitcoinbook"},
    {"label": "Lecture notes weeks 1-4", "url": null}
  ],
  "scopeNotes": ["Instructor said calculations are out of scope", "Skipped slides are low priority"]
}
```

| Field | Rule |
|---|---|
| `id` | Must be **identical to the folder name**. Lower-case letters, digits and hyphens. |
| `assessment.questions/points/minutes` | Numbers from the real assessment. The practice quiz copies them as defaults. |
| `assessment.opens/closes` | Date and time **with the time-zone offset**. Central Daylight Time (Mar-Nov 1, 2026) is `-05:00`; Central Standard Time (from Nov 1, 2026) is `-06:00`. Example: `2026-12-08T17:00:00-06:00`. |
| `sources[].url` | A web link in quotes, or the word `null` (no quotes) when there is none. |
| `scopeNotes` | A list of sentences shown on the unit page. May be empty: `[]`. |

### 3.2 `questions.json` (required): a list `[ ... ]` of question objects

Three question types exist. Copy the matching example.

Multiple choice (`"type": "mcq"`): `answer` is the **position of the correct choice counting from 0**
(first choice = 0, second = 1, third = 2, fourth = 3).

```json
{
  "id": "mb-ch02-q07",
  "chapter": 2,
  "section": "How Bitcoin Works > Bitcoin Transactions",
  "type": "mcq",
  "prompt": "Which statement best describes a UTXO?",
  "choices": ["A user's account balance", "An unspent output of a previous transaction", "A pending transaction", "The miner's fee"],
  "answer": 1,
  "explanation": "UTXO = unspent transaction output. Bitcoin has no accounts; a balance is the sum of UTXOs your keys can unlock.",
  "source": {"book": "ch02 > Transaction Inputs and Outputs", "lecture": "Week 2 slides 12-14"},
  "coverage": "lecture+book",
  "likelihood": "high",
  "difficulty": "easy",
  "tags": ["utxo", "transactions"]
}
```

True/false (`"type": "tf"`): `answer` is `true` or `false` **without quotes**, and there is no `choices` field.

```json
{
  "id": "mb-ch01-q05",
  "chapter": 1,
  "section": "Introduction > What Is Bitcoin?",
  "type": "tf",
  "prompt": "The total supply of bitcoin is capped at about 21 million.",
  "answer": true,
  "explanation": "Issuance halves every 210,000 blocks, so the supply approaches but never exceeds 21 million.",
  "source": {"book": "ch01 > What Is Bitcoin?", "lecture": "Week 1 slide 12"},
  "coverage": "lecture+book",
  "likelihood": "high",
  "difficulty": "easy",
  "tags": ["supply"]
}
```

Short answer (`"type": "short"`): `answer` is the model answer as text; students grade themselves.

```json
{
  "id": "mb-ch05-q09",
  "chapter": 5,
  "section": "Wallet Recovery > Backing Up Nonkey Data",
  "type": "short",
  "prompt": "Besides the recovery code, name two pieces of nonkey data needed to recover a wallet.",
  "answer": "The derivation path / script type (descriptor), the passphrase, and cosigner xpubs for multisig.",
  "explanation": "Recovery software must know where in the key tree to look and with which script type.",
  "source": {"book": "ch05 > Backing Up Nonkey Data", "lecture": null},
  "coverage": "book-only",
  "likelihood": "medium",
  "difficulty": "medium",
  "tags": ["recovery"]
}
```

Field rules for every question:

| Field | Allowed values |
|---|---|
| `id` | Pattern `<source>-ch<NN>-q<NN>`, e.g. `mb-ch02-q07` (mb = Mastering Bitcoin, me = Mastering Ethereum). Must be unique in the unit. The chapter in the id should match the `chapter` field. |
| `chapter` | Whole number; should have a matching `chapters/chNN.md`. |
| `coverage` | `lecture+book` (teacher covered it AND it is in the book), `book-only`, `lecture-only`, `skipped-slide`. |
| `likelihood` | `high`, `medium`, `low`. **Questions tagged `calculation` must be `low`** (the instructor excluded calculations); the validator enforces this. |
| `difficulty` | `easy`, `medium`, `hard`. |
| `source.book` / `source.lecture` | Text in quotes or `null`. |
| `tags` | A list of short lower-case words. May be empty: `[]`. |

How the practice quiz uses these fields: it picks questions at random but **weighted** so `high`
likelihood questions appear about four times as often as `low` ones (weights 4 / 2 / 1). Filters
in the quiz setup use `chapter`, `coverage`, `difficulty` and `likelihood`.

### 3.3 `lexicon.json` (recommended): a list of terms

```json
{"term": "UTXO", "definition": "Unspent transaction output ...", "chapter": 2,
 "coverage": "lecture+book", "related": ["transaction", "input", "output"]}
```

Terms must be unique. Names in `related` should be other terms in the same file (otherwise you get
a warning, not an error). The Lexicon and Flashcards pages are built from this file.

### 3.4 `likely-quiz.json` (recommended): the predicted quiz

A plain list of question ids in the order the predicted quiz should be shown:

```json
["mb-ch01-q01", "mb-ch01-q02", "mb-ch02-q07"]
```

Every id must exist in `questions.json`, none may repeat, and ideally the list has exactly
`assessment.questions` entries (20 for Quiz 1); a different length is a warning.

### 3.5 `chapters/chNN.md` (recommended): one Markdown file per chapter

- File names are `ch01.md`, `ch02.md`, ... (two digits). The number is the book chapter.
- Start with a single `# Title` line; use `##` for sections (they become the page's table of contents).
- Diagrams: a fenced block starting with three backticks followed by `mermaid`, then the diagram, then three backticks:

  ```mermaid
  flowchart LR
    A["Private key"] --> B["Public key"] --> C["Address"]
  ```

  Put labels with spaces or punctuation inside `["double quotes"]` as above; unquoted labels with
  `(`, `)` or `:` are the most common reason a diagram fails to draw. A broken diagram does not
  break the page: the site shows the diagram's text with a red note so you can fix it.
- Tables use the `| a | b |` syntax with a `|---|---|` line under the header.

### 3.6 `cross-reference.md` (recommended)

One table per chapter with the columns
`Topic | Book section | Lecture (week/slide) | Teacher emphasis (covered / mentioned / skipped) | Quiz likelihood | Notes`,
followed by a table titled **Not in the lecture notes but likely on the quiz** with the columns
`Concept | Book section | Why it is likely | One-line answer to know`. Use `## Chapter N — Title`
headings; the page's "Jump to" list is built from them.

### 3.7 `content/courses/cs646-fall-2026.json` (course calendar)

Each entry in `schedule` drives the countdown and the calendar on the home page. When a unit exists
for an assessment, put its id in `unit`; otherwise `null`. When the date is not announced yet, put
`null` in `at`; the calendar then shows "date to be announced" and the countdown skips it.

```json
{"title": "Quiz 2: Mastering Bitcoin Chapters 06-10", "type": "quiz", "points": 20,
 "at": "2026-10-13T18:30:00-05:00", "unit": "quiz-2-mastering-bitcoin-ch06-10"}
```

---

## SOP A: add a new unit and publish it

Worked example throughout: adding **Quiz 2: Mastering Bitcoin Chapters 6-10**, folder name
`quiz-2-mastering-bitcoin-ch06-10`.

### Step 1: open the project

Open the `cs646-study-hub` folder in Cursor (File > Open Folder...). The file tree on the left is
the same tree shown in [section 2](#2-the-map-where-everything-lives).

If you have not yet copied the project onto your computer, follow `PUBLISHING.md` first; it ends
with the project in `~/Projects/cs646-study-hub` (the `~` symbol means your home folder).

### Step 2: copy the template into a new unit folder

Where: the file tree in Cursor (or Finder).

1. Right-click `templates/unit-template` > Copy.
2. Right-click the `content/units` folder > Paste.
3. Rename the pasted folder to `quiz-2-mastering-bitcoin-ch06-10`.

Naming rules: lower-case letters, digits and hyphens only; no spaces. The name is part of the
site's web address, e.g. `.../#/unit/quiz-2-mastering-bitcoin-ch06-10`.

Verify: the tree now shows `content/units/quiz-2-mastering-bitcoin-ch06-10/` containing
`unit.json`, `questions.json`, `lexicon.json`, `likely-quiz.json`, `cross-reference.md` and a
`chapters/` folder.

Pitfall to avoid: do not edit the template itself; always copy it. The template is also used by
the automated tests, and changing it can make the tests fail.

### Step 3: fill in `unit.json`

Open the new folder's `unit.json` and change every value:

- `id`: exactly the folder name, `quiz-2-mastering-bitcoin-ch06-10`.
- `title`: what students should see, e.g. `Quiz 2: Mastering Bitcoin Chapters 6-10`.
- `assessment`: the real numbers and the date from Canvas, with the time-zone offset (see 3.1).
- `sources` and `scopeNotes`: replace the example sentences.

Verify: the file still starts with `{` and ends with `}`, and every line except the last inside
each `{ }` or `[ ]` ends with a comma.

### Step 4: write the chapters

In `chapters/`, delete the example files and create `ch06.md` ... `ch10.md`. Each file: a `# Title`,
`##` sections, bullet points of what matters, a Mermaid diagram where a picture helps, and a
"Terms to know" list at the end. Keep each chapter to what fits a 10-minute quiz.

### Step 5: write `questions.json`

Replace the example questions with your own, following [3.2](#32-questionsjson-required-a-list------of-question-objects).
Aim for at least 40 per chapter so the random quiz feels fresh. Checklist per question:

- [ ] `id` follows the pattern and the chapter number in it matches `chapter`
- [ ] for `mcq`, `answer` counts from 0 and points at the correct choice
- [ ] for `tf`, `answer` is `true`/`false` without quotes and there is no `choices`
- [ ] `explanation` says why the right answer is right and the wrong ones are wrong
- [ ] `coverage`, `likelihood`, `difficulty` use the allowed words exactly
- [ ] calculation questions carry the tag `calculation` and `likelihood: low`

### Step 6: write `lexicon.json`, `likely-quiz.json` and `cross-reference.md`

Follow 3.3, 3.4 and 3.6. The predicted quiz should have exactly as many ids as the real quiz has
questions.

### Step 7: add the assessment to the course calendar

Open `content/courses/cs646-fall-2026.json`. In `schedule`, add (or update) the entry for Quiz 2
and set `"unit": "quiz-2-mastering-bitcoin-ch06-10"`. Keep entries separated by commas.

### Step 8: run the validator on your computer

This is the same check GitHub will run. Doing it first saves a round trip.

Where: a terminal **in the project root**. In Cursor: menu Terminal > New Terminal opens one that
is already in the project root (the prompt shows `cs646-study-hub`). In the macOS Terminal app you
first type `cd ~/Projects/cs646-study-hub` and press Return.

One-time preparation (only the first time on this computer, takes about a minute):

```bash
npm ci
```

What it does: reads `package-lock.json` and installs the exact helper programs the project needs
into a `node_modules` folder. Expected output ends with a line like `added 250 packages`.

Now run the validator (type the line, press Return):

```bash
npm run validate
```

Expected output when everything is right:

```
Unit quiz-1-mastering-bitcoin-ch01-05 [200 questions, 210 terms, 20 predicted, 5 chapters]: OK (0 error(s), 0 warning(s))
Unit quiz-2-mastering-bitcoin-ch06-10 [212 questions, 180 terms, 20 predicted, 5 chapters]: OK (0 error(s), 0 warning(s))
Course cs646-fall-2026: OK (0 error(s), 0 warning(s))

Content is valid. 0 error(s), 0 warning(s).
```

When something is wrong you get the file, the item and the fix, for example:

```
ERROR: questions.json → item 7 (id mb-ch07-q07): "answer" is 4; with 4 choices it must be a whole number from 0 to 3 (0 = first choice).
    fix: Count the choices starting at 0 and set "answer" to the index of the correct one.
```

Fix the file, save it, and run `npm run validate` again until the last line says `Content is valid`.
Warnings do not block publishing but are worth fixing.

### Step 9: preview the site on your computer (optional but recommended)

Where: the same terminal, project root.

```bash
npm run dev
```

What it does: starts a small local web server ("dev server") that serves the site from your files
and refreshes automatically as you edit. It prints a line like `Local: http://localhost:5173/`.
Hold Command and click that link (or paste it into a browser). Check your new unit appears on the
home page, open its Study Guide (diagrams draw?), take a short practice quiz.

To stop the server, click in the terminal and press Control+C. The terminal prompt returns.

### Step 10: commit and push (save the snapshot and upload it)

Option 1, no typing, in Cursor: click the Source Control icon in the left bar (three connected
dots). You see the changed files. Type a message such as `Add Quiz 2 unit (Mastering Bitcoin ch06-10)`
in the box, click **Commit**, then click **Sync Changes** (or **Push**).

Option 2, terminal, project root, one line at a time (press Return after each):

```bash
git status
```

Shows the files you changed (red = not yet staged). Confirms you are in the right folder.

```bash
git add content
```

Stages everything under `content/` for the snapshot ("stage" = put in the box to be committed).

```bash
git commit -m "Add Quiz 2 unit (Mastering Bitcoin ch06-10)"
```

Records the snapshot with that message. Expected output: `1 file changed` or more, no errors.

```bash
git push
```

Uploads the snapshot to GitHub. Expected output ends with `main -> main`. If it asks you to log in,
follow the prompts (see `PUBLISHING.md` for the one-time login).

### Step 11: watch the automation and verify the live site

1. In a browser open `https://github.com/astrachan163/cs646-study-hub/actions`. The top entry
   is your push; a yellow dot means running, a green check means published, a red cross means a
   check failed (click it, then the red step, to read the same messages the validator printed).
2. Wait for the green check (about two minutes).
3. Open the live site `https://astrachan163.github.io/cs646-study-hub/`. If you still see the old
   version, force a fresh load: Command+Shift+R on Mac, Control+F5 on Windows.
4. Verify: the new unit card is on the home page; its Study Guide shows your chapters; the
   Practice Quiz setup shows the right question count; the countdown names the next assessment.

### Rollback: undo a bad publish

If the live site shows something wrong and you want the previous version back immediately:

Where: terminal, project root.

```bash
git log --oneline -5
```

Lists the last five snapshots, newest first, each with a short code (e.g. `a1b2c3d`) and message.

```bash
git revert HEAD --no-edit
```

Creates a new snapshot that undoes the newest one (`HEAD` = the newest). Nothing is lost; the
history keeps both.

```bash
git push
```

Publishes the undo. The automation runs again and the previous content is live in about two minutes.

---

## SOP B: fix or improve existing content

1. Open the file under `content/units/<unit>/` and make the change (for example correct a
   distractor in `questions.json`).
2. Terminal in the project root: `npm run validate` and confirm `Content is valid`.
3. Commit and push as in Step 10 with a message such as `Fix answer for mb-ch03-q04`.
4. Check the Actions page for the green check and force-refresh the live site (Step 11).

---

## 6. Troubleshooting

| What you see | What it means | What to do |
|---|---|---|
| `the file is not valid JSON: Unexpected token ...` | A comma, quote or bracket is missing or extra. | Paste the file into https://jsonlint.com to see the exact spot; the usual culprits are a comma after the last item or a missing comma between items. |
| `"id" is "..." but the folder is named "..."` | `unit.json` and the folder disagree. | Make them identical. |
| `"answer" is 4; with 4 choices it must be ... 0 to 3` | Choices are counted from 0. | Set `answer` to the position minus one. |
| `true/false questions need "answer": true or false (no quotes)` | You wrote `"true"` with quotes. | Remove the quotes. |
| `questions tagged "calculation" must have "likelihood": "low"` | Instructor rule. | Set `likelihood` to `low` or remove the tag. |
| `id "..." does not exist in questions.json` (likely-quiz.json) | A typo in the predicted list. | Copy the id from `questions.json`. |
| `npm: command not found` | Node.js is not installed or the terminal was opened before installing it. | Install Node.js (see `PUBLISHING.md`), then open a new terminal. |
| `npm ci` fails with `ENOENT package-lock.json` | The terminal is not in the project root. | `cd ~/Projects/cs646-study-hub` and try again. |
| Actions page shows a red cross | A check failed on GitHub. | Click the run, then the failed step; fix locally, `npm run validate`, commit, push. The live site is unchanged until a run is green. |
| Live site still shows old content | Browser cache or the run is not finished. | Wait for the green check, then Command+Shift+R (Mac) / Control+F5 (Windows). |
| A diagram shows red text "This diagram could not be drawn" | Mermaid syntax error. | Quote labels with `["..."]`; test the snippet at https://mermaid.live. |
| Cross-Reference or Likely Quiz tab is missing | The unit has no `cross-reference.md` / `likely-quiz.json`. | Add the file; the tab appears automatically. |

Notes: people often say "upload to GitHub" when they mean **push**, and "save" when they mean
**commit**. Both are fine in conversation; the commands are `git commit` then `git push`.

---

## 7. Lessons learned

A running list of confirmed lessons from real attempts. Add an entry whenever a mistake costs time,
so the next person skips it.

- Multiple-choice answers count from **0**, not 1. The validator says exactly which range is allowed.
- Time-zone offsets matter for the countdown: Central time is `-05:00` in summer and `-06:00` after
  November 1, 2026. Without the offset the site guesses.
- GitHub's default automation token cannot switch a repository's Pages source; a human must select
  "GitHub Actions" once in Settings > Pages (or run the one-line `gh api` command in `PUBLISHING.md`).
- A Markdown file that starts with a `---` metadata block is fine: the site strips it before rendering.
- Content produced elsewhere drops straight in: the first unit's 200 questions and 210 terms were
  copied into the folder unchanged and passed the validator on the first run.
