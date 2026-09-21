# Publishing the CS 646 Study Hub for the first time

Goal: after these steps the site is live at **https://astrachan163.github.io/cs646-study-hub/**
and every later `git push` to `main` republishes it automatically.

Why this has to be done from your computer: the cloud agent that built the project only had a
GitHub credential scoped to the `crypto-blockchain-group` repository, so it could not create a new
repository under your account. Everything below runs on your Mac, in about 15 minutes, and you
only do it once.

What you need: a Mac (Windows notes are included), your GitHub login for the account
`astrachan163`, and the project folder (a complete Git repository with history) that was delivered at
`internal/study-hub-repo/` in the shared Project store (also called "Context" in the Cursor app).

Table of contents

1. [Install the tools (Git, GitHub CLI, Node.js)](#1-install-the-tools)
2. [Put the project folder in place](#2-put-the-project-folder-in-place)
3. [Log the GitHub CLI into your account](#3-log-the-github-cli-into-your-account)
4. [Create the public repository and upload the project](#4-create-the-public-repository-and-upload-the-project)
5. [Turn on GitHub Pages (one human click or one command)](#5-turn-on-github-pages)
6. [Watch the first deployment](#6-watch-the-first-deployment)
7. [Confirm the live site](#7-confirm-the-live-site)
8. [Share it, and how updates work from now on](#8-share-it-and-how-updates-work-from-now-on)
9. [Troubleshooting](#9-troubleshooting)
10. [Rollback](#10-rollback)

A note on the commands: each grey box is **one command**. Type it (or paste it) into the terminal,
press Return, wait for the prompt to come back, then move to the next box. Never paste several boxes
at once. Every box says which folder the terminal must be in.

---

## Fast path (for an operator who already has `git`, `gh` and `node` installed and `gh` logged in as `astrachan163`)

Exactly these commands, in this order, one at a time, in the macOS Terminal. Expected results are
in the comments. The detailed sections below explain every step for a first-time reader.

```bash
# 0. Confirm the identity (must print "Logged in to github.com account astrachan163")
gh auth status
```

```bash
# 1. Put the delivered repository in place and enter it.
#    The Project store is visible on Andrew's Mac at the path below (from docs/study-playbook.md);
#    adjust the source path if the store lives elsewhere.
mkdir -p ~/Projects && cp -R "/Users/andrewstrachan/Library/Application Support/Cursor/AgentStores/cursor_agent_stores/bc-8da73848-359a-43c4-adda-67db640463db/files/internal/study-hub-repo" ~/Projects/cs646-study-hub && cd ~/Projects/cs646-study-hub
```

```bash
# 2. Sanity check: branch "main", a clean tree ("nothing to commit"), and the commit history present.
git branch --show-current && git status && git log --oneline | cat
```

```bash
# 2b. Only if step 2 says "not a git repository" (the copy lost the hidden .git folder):
#     recreate the history from the files (one commit) and continue.
git init -b main && git add -A && git commit -m "Import CS 646 Study Hub"
```

```bash
# 3. Create the public repository under astrachan163 and push main with its history.
#    Expected: "Created repository astrachan163/cs646-study-hub on GitHub" ... "main -> main".
gh repo create astrachan163/cs646-study-hub --public --source=. --remote=origin --push --description "Study guides, flashcards and practice quizzes for UAB CS 646 (Fall 2026)"
```

```bash
# 3b. Only if step 3 says the name already exists: connect and push instead.
git remote add origin https://github.com/astrachan163/cs646-study-hub.git && git push -u origin main
```

```bash
# 4. Switch GitHub Pages on with "GitHub Actions" as the source.
#    Expected JSON containing "build_type": "workflow". If it answers 409 (already exists), run step 4b.
gh api -X POST repos/astrachan163/cs646-study-hub/pages -f build_type=workflow
```

```bash
# 4b. Only on 409: change the existing Pages configuration to the workflow source.
gh api -X PUT repos/astrachan163/cs646-study-hub/pages -f build_type=workflow
```

```bash
# 5. Verify Pages is configured (expected: "workflow" and the site URL on two lines).
gh api repos/astrachan163/cs646-study-hub/pages --jq '.build_type, .html_url'
```

```bash
# 6. The push in step 3 started a run before Pages was enabled, so trigger a fresh one.
#    Expected: "Created workflow_dispatch event".
gh workflow run "Validate, test and deploy" --ref main
```

```bash
# 7. Watch it (about two minutes; ends with "completed with 'success'"). Pick the newest run if asked.
gh run watch --exit-status
```

```bash
# 8. Confirm the live site answers 200 (Pages can take up to a minute after the run; repeat if 404).
curl -s -o /dev/null -w "%{http_code}\n" https://astrachan163.github.io/cs646-study-hub/
```

```bash
# 9. Point the repository's homepage link at the live site.
gh repo edit astrachan163/cs646-study-hub --homepage https://astrachan163.github.io/cs646-study-hub/
```

Then open **https://astrachan163.github.io/cs646-study-hub/** in a browser and run the checklist in
[section 7](#7-confirm-the-live-site). If anything fails, the matching row in
[Troubleshooting](#9-troubleshooting) names the cause.

---

## 1. Install the tools

Open the **Terminal** app (press Command+Space, type `Terminal`, press Return). A window with a
blinking cursor appears; that is the terminal. The folder it starts in is your home folder.

### 1.1 Homebrew (the Mac package installer)

Where: Terminal, any folder. Check whether it is installed:

```bash
brew --version
```

If you see a version number (e.g. `Homebrew 4.x`), skip ahead. If you see `command not found`,
install it by pasting the one-line installer from https://brew.sh (it starts with `/bin/bash -c`),
press Return, type your Mac password when asked (nothing appears while typing; that is normal), and
follow the two "Next steps" lines it prints at the end.

### 1.2 Git, GitHub CLI and Node.js

Where: Terminal, any folder.

```bash
brew install git gh node
```

What it does: installs Git (version control), `gh` (GitHub's command-line tool, used to create the
repository and switch on Pages) and Node.js (only needed if you want to preview or validate locally).
Takes a few minutes.

Verify each one prints a version:

```bash
git --version
```

```bash
gh --version
```

```bash
node --version
```

Expected: `git version 2.x`, `gh version 2.x`, `v22.x` (or newer). Windows: install from
https://git-scm.com, https://cli.github.com and https://nodejs.org, then use "Git Bash" as the terminal.

---

## 2. Put the project folder in place

The delivered repository folder is `study-hub-repo` (inside the Project store's `internal/`
folder). Copy it to a `Projects` folder in your home folder and rename it:

Where: Finder. Create `Projects` in your home folder if it does not exist (Finder > Go > Home,
then File > New Folder). Drag `study-hub-repo` into `Projects` and rename it to `cs646-study-hub`.

Verify in Terminal:

```bash
cd ~/Projects/cs646-study-hub
```

What it does: moves the terminal into the project root. No output is good output.

```bash
ls -a
```

Lists the files including hidden ones. You must see `.git` (the history), `package.json`,
`content`, `src`, `CONTENT-GUIDE.md`, `PUBLISHING.md`.

```bash
git log --oneline -3
```

Shows the three most recent snapshots with their messages. Seeing them proves the history came along.

```bash
git branch --show-current
```

Expected: `main`.

Pitfall: if `ls -a` does not show `.git`, the folder was copied without its hidden history folder
(some cloud drives skip hidden files). Copy again with Finder or with
`cp -R <source>/study-hub-repo ~/Projects/cs646-study-hub` in Terminal.

---

## 3. Log the GitHub CLI into your account

Where: Terminal, any folder.

```bash
gh auth login
```

Answer the questions with the arrow keys and Return:
`GitHub.com` > `HTTPS` > `Yes` (authenticate Git with your GitHub credentials) > `Login with a web browser`.
It shows an 8-character code and opens the browser; paste the code, approve, and come back.

Verify:

```bash
gh auth status
```

Expected: `Logged in to github.com account astrachan163`. If it names another account, run
`gh auth logout` and log in again with the right one.

---

## 4. Create the public repository and upload the project

Where: Terminal, **project root** (`cd ~/Projects/cs646-study-hub` if you moved away).

```bash
gh repo create astrachan163/cs646-study-hub --public --source=. --remote=origin --push --description "Study guides, flashcards and practice quizzes for UAB CS 646 (Fall 2026)"
```

What each part does:

- `gh repo create astrachan163/cs646-study-hub`: creates a new, empty repository with that name under your account.
- `--public`: anyone with the link can view it (required for free GitHub Pages).
- `--source=.`: use the current folder (the dot) as the project.
- `--remote=origin`: nickname the online copy `origin` (Git's conventional name for "the main remote").
- `--push`: upload the `main` branch with its whole history right away.
- `--description`: the one-line blurb shown on the repository page.

Expected output: `✓ Created repository astrachan163/cs646-study-hub on GitHub` followed by push
progress ending in `main -> main`.

Verify:

```bash
gh repo view --web
```

Opens the repository page in your browser. You should see the files and the README.

Pitfalls:

- `Name already exists on this account`: the repository already exists. Skip creation and connect
  the folder instead: `git remote add origin https://github.com/astrachan163/cs646-study-hub.git`
  then `git push -u origin main`.
- `must be run from a git repository`: the terminal is not in the project root; `cd ~/Projects/cs646-study-hub`.

Do not create this inside or alongside the `crypto-blockchain-group` repository; it is deliberately a
separate project.

---

## 5. Turn on GitHub Pages

GitHub's automation token is not allowed to switch on Pages by itself, so this is the one step a
human must do. Pick either way.

Way A, one command. Where: Terminal, any folder.

```bash
gh api -X POST repos/astrachan163/cs646-study-hub/pages -f build_type=workflow
```

What it does: calls GitHub's API and says "this repository publishes Pages from a GitHub Actions
workflow". Expected: a block of JSON containing `"build_type": "workflow"`. If you see
`409` / `already exists`, Pages was already on; run the same command with `-X PUT` instead of `-X POST`
to switch the source to `workflow`.

Way B, clicking. In the browser open
`https://github.com/astrachan163/cs646-study-hub/settings/pages`. Under **Build and deployment**,
set **Source** to **GitHub Actions**. There is no save button; the choice applies immediately.

Verify:

```bash
gh api repos/astrachan163/cs646-study-hub/pages --jq '.build_type, .html_url'
```

Expected two lines: `workflow` and `https://astrachan163.github.io/cs646-study-hub/`.

---

## 6. Watch the first deployment

The push in step 4 already started the workflow, but it ran **before** Pages was enabled, so its
deploy step may have failed. Start it again now:

Where: Terminal, project root.

```bash
gh workflow run "Validate, test and deploy" --ref main
```

What it does: manually triggers the automation on `main`. Expected: `✓ Created workflow_dispatch event`.

```bash
gh run watch
```

What it does: shows the run's steps live (pick the newest run if it asks). It ends with
`✓ ... completed with 'success'` after roughly two minutes. Press Control+C if you want to stop
watching; the run continues on GitHub.

The same view exists in the browser at `https://github.com/astrachan163/cs646-study-hub/actions`.

---

## 7. Confirm the live site

Open **https://astrachan163.github.io/cs646-study-hub/** in a browser.

Checklist:

- [ ] The header reads "CS 646 Study Hub" and the home page shows the Quiz 1 unit card and a countdown.
- [ ] Click **Study guide**: chapters open and diagrams are drawn (boxes and arrows, not text).
- [ ] Click **Practice quiz**, then **Start quiz**: a timer counts down from 10:00 and choices are clickable.
- [ ] Click the moon icon at the top right: the site switches to dark mode.

If the page is a GitHub "404" page, see [Troubleshooting](#9-troubleshooting). Also set the
repository's homepage link so visitors find the site from the repo page:

```bash
gh repo edit astrachan163/cs646-study-hub --homepage https://astrachan163.github.io/cs646-study-hub/
```

---

## 8. Share it, and how updates work from now on

Send classmates the link `https://astrachan163.github.io/cs646-study-hub/`. Nothing to install, no login.
A student can also share a specific practice quiz with **Copy share link** on the quiz page; the link
contains the exact configuration and a seed, so two people get the identical 20 questions.

From now on every change follows `CONTENT-GUIDE.md`: edit files under `content/`, run
`npm run validate`, commit, push. The workflow publishes automatically within about two minutes,
and it refuses to publish content with errors, so the live site never breaks because of a typo in JSON.

---

## 9. Troubleshooting

| What you see | Meaning | Fix |
|---|---|---|
| `gh: command not found` | GitHub CLI not installed, or the terminal was opened before installing. | `brew install gh`, then open a new terminal window. |
| `HTTP 404` when creating or `Resource not accessible` | Logged into the wrong account or not logged in. | `gh auth status`; if needed `gh auth logout` then `gh auth login`. |
| Live URL shows GitHub's 404 page | Pages is not enabled, or the source is not "GitHub Actions", or the first successful deploy has not finished. | Do step 5, then step 6, wait for the green run, force-refresh (Command+Shift+R). |
| Workflow red at "Validate content" | A content file has a mistake. | Click the step to read the message; fix locally; `npm run validate`; commit; push. |
| Workflow red at "Deploy" with `Get Pages site failed` | Pages was not enabled when the run started. | Step 5, then re-run with `gh workflow run "Validate, test and deploy" --ref main`. |
| Site loads but styles or scripts are missing | The build used the wrong base path. | The workflow derives it from the repository name; if you renamed the repo, just push again. For a custom domain set a repository variable `BASE_PATH` to `/` (Settings > Secrets and variables > Actions > Variables). |
| `permission denied (publickey)` on push | Git is trying SSH without a key. | Use HTTPS: `git remote set-url origin https://github.com/astrachan163/cs646-study-hub.git` then `git push`. |

---

## 10. Rollback

To take the site back to the previous version: in the project root run
`git revert HEAD --no-edit` (creates a snapshot that undoes the newest one) and then `git push`.
The workflow republishes the previous content. To remove the site entirely, GitHub repository
Settings > Pages > **Unpublish site**; the repository and its history stay intact.
