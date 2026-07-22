# @cdevhub/ngx-tw-mcp

MCP server that gives an AI coding agent the real API of
[`@cdevhub/ngx-tw`](https://www.npmjs.com/package/@cdevhub/ngx-tw) — selectors,
inputs and their defaults, usage examples, theme tokens, and guidance on which
component fits a given problem.

Without it, a model writing ngx-tw code is guessing: the published tarball ships
compiled bundles and `.d.ts`, so component source and the documentation site are
both absent from a consumer's `node_modules`, and `.d.ts` erases the defaults
(`input<BadgeVariant>('soft')` becomes `InputSignal<BadgeVariant>`).

## Setup

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

Install the version matching your library:

```bash
npm install -D @cdevhub/ngx-tw-mcp@$(npm pkg get dependencies.@cdevhub/ngx-tw --workspaces=false | tr -d '"^~')
```

The package is lockstep-versioned with `@cdevhub/ngx-tw`, and every response
carries the library version it describes — so a mismatch against your installed
library is visible rather than silent.

## Tools

| Tool | Returns |
|---|---|
| `search_components` | Ranked entry points for a free-text description of what you are building |
| `get_component` | One entry point in full: symbols, selectors, inputs/outputs/models, examples, guidance |
| `list_components` | Every entry point with a one-line summary |
| `get_conventions` | Styling and code conventions — tokens, scales, focus rings, Angular idioms |
| `get_started` | Install, Tailwind v4 wiring, providers, icon registration |
| `list_theme_tokens` | The design tokens the theme defines and the utilities they generate |

Search is lexical and weighted over names, aliases, summaries, and use cases, so
vocabulary from other design systems resolves — "dropdown" reaches `menu`,
`select`, and `combobox`; "snackbar" reaches `toast`; "datagrid" reaches `table`.

## How the data stays true

Everything is baked into a static `index.json` at library build time, inside the
monorepo where component source and the demo app both exist. The server does no
parsing at run time.

- **The index is generated into `dist/` and never committed**, so there is no
  stored copy that can drift from source.
- **The API layer is extracted from component source**, not from `.d.ts` and not
  from the documentation site's hand-written tables.
- **Usage examples are extracted from the documentation site's own snippets.**
- **Guidance** (`summary`, `whenToUse`, `whenNotToUse`, `aliases`) is
  hand-authored in a `*.meta.ts` co-located with each component.
- **`verify-mcp-index`** runs in the release pre-flight and fails the release on
  a missing or orphaned guidance file, a cross-reference to a component that no
  longer exists, a documentation snippet binding an input that was removed or
  renamed, or an import path that would not resolve.

## Note on icons

`<tw-icon>` has no built-in icon set. Valid `name` values are only those the
consuming application registered through `provideTwIcons()` /
`provideTwLucideIcons()`, so the server documents the registration model rather
than shipping a name list that would be wrong for every consumer.

## License

MIT
