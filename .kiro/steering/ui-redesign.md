---
inclusion: fileMatch
fileMatchPattern: ['app/**/*.{ts,tsx}', 'components/**/*.{ts,tsx}', 'styles/**/*.{css,scss}']
---

# UI Redesign Rule

When the task is visual redesign, layout refinement, styling, typography or responsiveness:

## Scope

Only inspect files directly required for the requested page.

Do NOT inspect unrelated routes.

Do NOT inspect APIs.

Do NOT inspect authentication.

Do NOT inspect server actions.

Do NOT inspect CMS.

Do NOT inspect backend utilities.

Do NOT inspect business logic.

Do NOT inspect tests.

Do NOT inspect documentation.

Assume existing functionality works unless explicitly told otherwise.

---

## Editing Strategy

Prefer modifying existing components.

Do not recreate components.

Do not move files.

Do not rename files.

Prefer CSS changes over JSX changes.

Reuse the current implementation.

Never perform project-wide refactors.

---

## Reading Strategy

Read the requested page first.

Only follow imports that are directly rendered by that page.

Do not recursively inspect unrelated dependencies.

Do not inspect files that are not necessary for the requested change.

---

## Goal

Achieve visual parity.

Nothing else.