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
| `projects/ngx-tw/theme/`       | Both halves of theming: the default semantic-token CSS, copied into the package as an asset (`@cdevhub/ngx-tw/theme/index.css`), **and** the `@cdevhub/ngx-tw/theme` entry point exporting the runtime API (`provideTheme`, `ThemeService`, `ThemeDirective`, `THEME_CONFIG`). |
| `projects/ngx-tw/core/`        | Shared types (`TwColor`, `TwSize`) and utilities.                     |
| `projects/demo/`               | Demo application with an overview / examples / API page per component.|
| `projects/ngx-tw-mcp/`         | MCP server package (`@cdevhub/ngx-tw-mcp`) serving the library API to AI coding agents. |
| `e2e/`                         | Playwright end-to-end harness — smoke, per-component, cross-cutting (axe, theme matrix) and visual suites. |
| `docs/`                        | Long-form notes and component specs.                                  |

## MCP server

`@cdevhub/ngx-tw-mcp` gives an AI coding agent the library's real API — selectors,
inputs with their defaults, usage examples, theme tokens, and guidance on which
component fits a problem. Consumers add it to their MCP config:

```json
{
  "mcpServers": {
    "ngx-tw": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@cdevhub/ngx-tw-mcp"]
    }
  }
}
```

It serves a static `index.json` built inside this monorepo, where component
source and the demo app both exist — a consumer's `node_modules` has neither.

| Command | Does |
|---|---|
| `npm run build:lib` | Builds the library **and** generates `dist/ngx-tw/index.json` |
| `npm run verify:mcp-index` | Validates the index — runs in the release pre-flight and in CI |
| `npm run build:mcp` | Assembles `dist/ngx-tw-mcp/` from the library's dist index |

The index is generated into `dist/` and **never committed**: a derived artifact
under version control manufactures the drift class it would then have to police.

Three content layers with three different authorities:

| Layer | Source of truth |
|---|---|
| API — selectors, inputs/outputs/models, types, defaults, JSDoc | component **source** (not `.d.ts` — it erases defaults) |
| Usage examples | the demo app's `*Snippet` literals |
| Guidance — summary, whenToUse, whenNotToUse, related, aliases | hand-authored `projects/ngx-tw/<name>/<name>.meta.ts` |

`*.meta.ts` is build-time only and never exported from an entry point's
`index.ts`, so it stays out of the published tarball. It is co-located with the
component precisely so it shows up in the same diff — the guidance prose is the
one layer no mechanism can verify, and review is what keeps it honest.

`verify:mcp-index` fails on a missing or orphaned `*.meta.ts`, a cross-reference
to a component that no longer exists, a demo snippet binding an input that was
renamed or removed, or an import path that would not resolve. See
[`docs/mcp-server-architecture.md`](./docs/mcp-server-architecture.md).

### Adding a component

A new entry point needs a `*.meta.ts` alongside the four existing registration
edits (`public-api.ts`, `tsconfig.lib.json`, `tsconfig.spec.json`,
`angular.json`). `verify:mcp-index` fails the release if it is missing, so this
is caught rather than silently skipped.

## Tech stack

- **Angular `^22.0.0`** — standalone, signal-based APIs, `OnPush` everywhere.
- **`@angular/cdk ^22.0.0`** — focus management, overlays, a11y, collections.
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

Releases are **tag-driven** and run from a single local command. The release
script bumps the version, regenerates `CHANGELOG.md` from
[conventional commits](https://www.conventionalcommits.org/) since the last
tag, commits, tags `@cdevhub/ngx-tw@<version>`, and pushes. The pushed tag
triggers `release.yml` which publishes to npm (with provenance) and creates
the matching GitHub Release.

```bash
# from a clean develop, in sync with origin, with CI green:
npm run release:patch     # 0.2.0 → 0.2.1
npm run release:minor     # 0.2.0 → 0.3.0
npm run release:major     # 0.2.0 → 1.0.0

# preview what the script would do without committing or pushing:
npm run release:dry
```

The script will refuse to release if:

- you are not on `develop`
- the working tree is dirty
- local `develop` is not in sync with `origin/develop`
- the latest `ci.yml` run on develop for the current HEAD is not green
  (pass `--skip-ci-check` to override, e.g. `node scripts/release.mjs patch --skip-ci-check`)
- local pre-flight (`lint`, `build:lib`, `verify:mcp-index`, `build:mcp`, `test:ci`,
  `pack:check`, `verify:package`) fails
- no `feat:` / `fix:` / `perf:` / breaking commits exist since the last tag

### Commit message format

The changelog is generated from commits, so commit messages matter. Use
[conventional commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

# Examples:
feat(button): add color="accent" variant
fix(badge): correct focus ring offset on sm size
perf(table): memoise row keying
feat(menu)!: rename close output to closed (BREAKING)
chore(deps): bump @angular/cdk to 21.3.0
```

Types `feat`, `fix`, and `perf` produce a changelog entry. A `!` after the
type — or a `BREAKING CHANGE:` footer — marks a breaking change and lifts
the entry into the **⚠ BREAKING CHANGES** section. Other types
(`chore`, `docs`, `ci`, `build`, `refactor`, `test`, `style`, `revert`) are
skipped from the changelog but still count for git history.

See [`CHANGELOG.md`](./CHANGELOG.md) for version history.

## Contributing

Architectural conventions, styling tokens, and the component quality checklist
live in [`.claude/CLAUDE.md`](./.claude/CLAUDE.md). Please read it before adding
or modifying components.

## License

[MIT](./LICENSE) © Iuga Ciprian
