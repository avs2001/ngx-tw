# ngx-tw

Angular component library for applications built with **Tailwind CSS v4** and
**Angular CDK**. Quality bar: Angular Material — accessible, composable,
well-tested — styled with Tailwind utilities instead of Material Design tokens.

This repo is the monorepo that produces the `@cdevhub/ngx-tw` npm package. Consumers
only need the published package; this README documents the repo layout and the
local development workflow.

> For install and usage, see the library README:
> [`projects/ngx-tw/README.md`](./projects/ngx-tw/README.md).

## What's here

| Path                           | Purpose                                                               |
|--------------------------------|-----------------------------------------------------------------------|
| `projects/ngx-tw/`             | The publishable library. Each component is its own secondary entry point (e.g. `@cdevhub/ngx-tw/button`). |
| `projects/ngx-tw/theme/`       | Default semantic theme CSS — ships as an asset, not an entry point.  |
| `projects/ngx-tw/core/`        | Shared types (`TwColor`, `TwSize`) and utilities.                     |
| `projects/demo/`               | Demo application with an overview / examples / API page per component.|
| `e2e/`                         | Playwright end-to-end harness (scaffold — specs to be filled in).     |
| `docs/`                        | Long-form notes and component specs.                                  |

## Tech stack

- **Angular `^21.2.0`** — standalone, signal-based APIs, `OnPush` everywhere.
- **`@angular/cdk ^21.0.0`** — focus management, overlays, a11y, collections.
- **Tailwind CSS `^4.0.0`** — utility-first styling; no component CSS files.
- **tailwind-variants** — variant-driven class composition with `twMerge`.
- **Vitest** — unit test runner (Angular v21 default).
- **Playwright** — e2e runner.
- **ESLint** (flat config) with `angular-eslint` + `typescript-eslint`.
- **Prettier** — shared formatting config in `package.json`.

## Getting started

```bash
npm install
npm start               # runs the demo app on http://localhost:4600
```

## Common scripts

| Script             | What it does                                        |
|--------------------|-----------------------------------------------------|
| `npm start`        | Serve the demo app (port 4600)                      |
| `npm run build`    | Build the demo app                                  |
| `npm run build:lib`| Build the publishable library into `dist/ngx-tw`    |
| `npm run watch:lib`| Rebuild the library on change                       |
| `npm test`         | Run unit tests (Vitest)                             |
| `npm run e2e`      | Run Playwright e2e tests                            |
| `npm run lint`     | Lint TypeScript and templates                       |
| `npm run lint:fix` | Lint with auto-fix                                  |

## Releases

Releases are automated with [Changesets](https://github.com/changesets/changesets).

1. On the feature branch, run `npm run changeset` and commit the generated
   `.changeset/*.md` file alongside your code change.
2. Open a PR into `develop`. CI (`lint`, `build-lib`, `unit-test`, `pack-check`,
   `e2e-smoke`, `e2e-a11y`) must pass.
3. On merge to `develop`, the `release` workflow opens (or updates) a
   **"Version Packages"** PR that bumps `projects/ngx-tw/package.json` and
   regenerates `CHANGELOG.md` from the pending changesets.
4. Merging that PR publishes `@cdevhub/ngx-tw` to npm with provenance,
   creates a matching GitHub Release + tag (`@cdevhub/ngx-tw@<version>`),
   and triggers the `pages` workflow to redeploy the demo.

Changes that should not produce a release (docs, CI, refactors, demo-only
edits) need **no** changeset — the Version Packages PR only opens when at
least one changeset is present.

See [`.changeset/README.md`](./.changeset/README.md) for the changeset format
and [`CHANGELOG.md`](./CHANGELOG.md) for version history.

## Contributing

Architectural conventions, styling tokens, and the component quality checklist
live in [`.claude/CLAUDE.md`](./.claude/CLAUDE.md). Please read it before adding
or modifying components.

## License

[MIT](./LICENSE) © Iuga Ciprian
