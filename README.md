# ngx-tw

Angular component library for applications built with **Tailwind CSS v4** and
**Angular CDK**. Quality bar: Angular Material — accessible, composable,
well-tested — styled with Tailwind utilities instead of Material Design tokens.

This repo is the monorepo that produces the `ngx-tw` npm package. Consumers
only need the published package; this README documents the repo layout and the
local development workflow.

> For install and usage, see the library README:
> [`projects/ngx-tw/README.md`](./projects/ngx-tw/README.md).

## What's here

| Path                           | Purpose                                                               |
|--------------------------------|-----------------------------------------------------------------------|
| `projects/ngx-tw/`             | The publishable library. Each component is its own secondary entry point (e.g. `ngx-tw/button`). |
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

## Publishing the library

```bash
npm run build:lib
cd dist/ngx-tw
npm publish
```

See [`CHANGELOG.md`](./CHANGELOG.md) for version history and
[`projects/ngx-tw/README.md`](./projects/ngx-tw/README.md) for consumer docs.

## Contributing

Architectural conventions, styling tokens, and the component quality checklist
live in [`.claude/CLAUDE.md`](./.claude/CLAUDE.md). Please read it before adding
or modifying components.

## License

[MIT](./LICENSE) © Iuga Ciprian
