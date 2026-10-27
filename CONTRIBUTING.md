# Contributing to SyntaxFiddle

Thanks for your interest in contributing! This guide covers the two highest-impact ways
to contribute — adding cron recipes and adding cron dialects — plus the general rules for
every change.

## Development setup

```bash
npm install
npm run dev        # http://localhost:3000
```

Before opening a PR:

```bash
npm run typecheck
npm run test
```

CI runs typecheck, tests, and a full static build on every PR — your branch should pass
all three locally first.

## Adding a cron recipe (easiest, one line)

All recipe pages are generated from data. Open `lib/cron/recipes.ts` and add a seed to
the appropriate category array:

```ts
// [slug, expression, human name, dialect?]
["every-8-minutes", "*/8 * * * *", "Every 8 Minutes"],
["aws-eventbridge-daily-at-8am", "0 8 * * ? *", "Daily at 8 AM (AWS EventBridge)", "aws"],
```

Everything else is automatic: the static page, field-breakdown table, FAQ, JSON-LD
schema markup, code snippets, related-recipe links, and the sitemap entry.

Rules for recipes:

- The slug must match the query developers actually search (e.g. `daily-at-8am`).
- The expression must validate in the stated dialect — `npm test` covers the engine.
- Check the page renders correctly after `npm run build` (see `out/cron/<slug>/`).
- Never duplicate an expression that already exists on another page — compete with
  content, not with yourself.

## Adding a cron dialect

Salesforce `System.schedule` is the most requested missing dialect. A dialect needs:

1. An entry in `lib/cron/dialects.ts` (label, field definitions, validation rules).
2. Engine support in `lib/cron/engine.ts` — parsing, validation, and next-run matching.
3. Conversion helpers in `lib/cron/recipes.ts` (`unixEquivalentExpression`, etc.) so the
   snippet tabs can convert to and from the new dialect.
4. Tests in `lib/__tests__/` with real-world expressions from the platform's docs.

## Adding a tool

SyntaxFiddle tools follow strict rules:

- **100% client-side.** No network calls after page load, ever. If it needs a server,
  it does not belong here.
- **Deterministic TypeScript engines.** Same input → same output, unit-tested.
- **Code-split per route.** One tool must never pay for another tool's bundle weight.
- **Graceful degradation.** Reserve space for dynamic regions to keep CLS at zero.
- **Accessibility.** Keyboard-navigable, labeled controls, `sr-only` headings where
  appropriate.

## Bug reports

Open an issue with: the URL, browser/OS, what you typed or pasted, what you expected,
and what happened. Screenshots of the network panel are welcome — nothing sensitive can
leak, since nothing is sent.

## Pull requests

1. Fork and branch from `main` (`feat/my-feature` or `fix/my-bugfix`).
2. Keep PRs focused — one feature or fix per PR.
3. Add or update tests for any logic change.
4. Ensure `npm run typecheck && npm run test` pass locally.

## Licensing of contributions

By submitting a pull request, you agree that your contribution is licensed under
the GNU Affero General Public License v3.0 (`AGPL-3.0-or-later`), the same license
as the rest of the codebase. No contributor license agreement (CLA) is required.
