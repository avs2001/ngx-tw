# E2E tests

Playwright suite for the `ngx-tw` demo app. Specs verify the library end-to-end
through the demo's component examples pages.

## Prerequisites

1. **Install Playwright browsers** (once per machine):

   ```sh
   npm run e2e:install
   ```

2. **Build the library** before running specs. The demo imports `ngx-tw` from
   the built `dist/` output, not from source — without the build the dev
   server fails to compile any examples page:

   ```sh
   npm run build:lib
   ```

3. The demo dev server serves on **port 4600** (`npm start`). Playwright's
   `webServer` block starts it automatically; nothing extra is required for
   `npm run e2e`. The readiness probe uses `http://127.0.0.1:4600` (IPv4 only)
   to avoid `ECONNREFUSED` flakes on hosts that resolve `localhost` to `::1`.

## Commands

| Command | What it does |
|---|---|
| `npm run e2e` | Full suite — every project, every spec. |
| `npm run e2e:ui` | Playwright UI mode (interactive runner). |
| `npm run e2e:smoke` | `@smoke`-tagged specs on `chromium-light`. |
| `npm run e2e:a11y` | `@a11y`-tagged specs on `chromium-light`. |
| `npm run e2e:visual` | `@visual`-tagged specs across all projects. |
| `npm run e2e:update-snapshots` | Re-record screenshot baselines. |

Filter to a single project: `npm run e2e -- --project=chromium-light`.
Filter to a single spec file: `npm run e2e -- e2e/specs/00-smoke/routes.spec.ts`.

## Folder layout

```
e2e/
├── fixtures/      # Playwright test fixtures (theme reset, axe, overlays, clock)
├── support/       # Routes, selectors, a11y helpers, visual helpers
├── pages/         # Page Object Models, one per route group
├── specs/         # Specs organised by concern (smoke, components, a11y, visual)
└── __screenshots__/  # Visual baselines (committed, per-project)
```

## Browser projects

| Project | When it runs |
|---|---|
| `chromium-light` | Smoke + a11y on every PR. |
| `chromium-dark` | A11y dark sweep + visual. |
| `firefox` | Nightly full suite. |
| `webkit` | Nightly full suite (catches CDK overlay rendering differences). |
| `mobile-chrome` | Nightly (Pixel 7 viewport). |

## Troubleshooting

- **`ECONNREFUSED 127.0.0.1:4600`** — the dev server failed to boot. Most often
  caused by missing `npm run build:lib`. Check `playwright-report/` for the
  webServer log.
- **`Error: Port 4600 is already in use`** — another `ng serve` instance is
  running. Stop it, or set `reuseExistingServer: true` is the local default
  (CI uses `false`).
- **Visual diff failures on a new machine** — baselines are per-project and
  per-OS sensitive. Re-record with `npm run e2e:update-snapshots`, then check
  the diff into git only if the change is intentional.
- **Flaky overlay tests** — verify `reducedMotion: 'reduce'` is applied. The
  library's `animate.enter` / `animate.leave` keyframes are zeroed by the
  theme's `prefers-reduced-motion` media query; without the context option,
  tests race the CSS animations.
- **`ng e2e` vs `npm run e2e`** — in CI use only `npm run e2e`. Running
  `ng e2e` while Playwright's `webServer` is also configured causes two
  processes to fight for port 4600.

## Determinism

Every spec uses the shared `test` from `e2e/fixtures/base.ts`. Direct imports
from `@playwright/test` are a lint error (`eslint-plugin-playwright` enforces
this).

The shared fixture handles:
- **`localStorage` reset** — clears `ngx-tw-theme` and `ngx-tw-preset` before
  every test, then writes `'light'` so the resolved theme is deterministic
  regardless of the runner's `prefers-color-scheme`.
- **Frozen clock** — for date / time specs, use the `frozenClock` fixture
  (`setFixedTime`) rather than `Date.now()`.
- **Reduced motion** — applied globally via `contextOptions`.
- **Locale + timezone** — pinned to `en-US` / `UTC`.
