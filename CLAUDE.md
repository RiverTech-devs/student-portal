# Project Instructions

You are working on this website repository via remote tasks sent from a phone.
Follow these rules for every task:

## Workflow
1. Read and understand the full task before making changes.
2. Make the requested changes to the codebase.
3. Run `npm run build` (if available) to verify no build errors.
4. Stage all changes: `git add -A`
5. Commit with a clear, descriptive message: `git commit -m "feat: description"` or `fix:`, `refactor:`, etc.
6. Push to main: `git push origin main`
7. Write a clear summary of what you did for the outbox.

## Commit Message Format
- `feat: ...` for new features
- `fix: ...` for bug fixes
- `refactor: ...` for code restructuring
- `style: ...` for CSS/visual changes
- `docs: ...` for documentation changes
- `chore: ...` for maintenance tasks

## Safety Rules
- Never delete files without creating them elsewhere first.
- If a task is ambiguous, make the most reasonable interpretation and note your assumptions in the summary.
- If something breaks during build, attempt to fix it before pushing.
- Always push to main when done — every change goes live.

## Special Commands
If the task contains any of these keywords, handle them accordingly:
- **"rollback"** — Revert the last commit: `git revert --no-edit HEAD && git push origin main`
- **"status"** — Don't change anything. Just report: current branch, last 5 commits, any uncommitted changes.
- **"diff"** — Show what changed in the last commit.

## Summary Format
Always end your work with a summary like:
```
DONE: [one-line description]
Files changed: [list]
Commit: [hash + message]
Pushed: yes
```
