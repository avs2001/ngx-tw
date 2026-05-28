---
"ngx-tw": minor
---

**BREAKING (pre-1.0):** Drop the `Tw*` prefix from dialog and table directive/component class identifiers, restoring parity with sibling `sheet` directives and the library-wide class-naming rule in `.claude/CLAUDE.md`. Element and attribute selectors are unchanged — only TypeScript class identifiers move.

**Dialog (`ngx-tw/dialog`):**

| Before | After |
| --- | --- |
| `TwDialogContainer` | `DialogContainer` |
| `TwDialogHeaderDirective` | `DialogHeaderDirective` |
| `TwDialogIconDirective` | `DialogIconDirective` |
| `TwDialogTitleDirective` | `DialogTitleDirective` |
| `TwDialogSubtitleDirective` | `DialogSubtitleDirective` |
| `TwDialogDescriptionDirective` | `DialogDescriptionDirective` |
| `TwDialogContentDirective` | `DialogContentDirective` |
| `TwDialogActionsDirective` | `DialogActionsDirective` |
| `TwDialogCloseDirective` | `DialogCloseDirective` |
| `TwDialogState` (type) | `DialogState` |
| `TwDialogAnimationEvent` (interface) | `DialogAnimationEvent` |
| `TwDialogActionsAlign` (type) | `DialogActionsAlign` |

**Table (`ngx-tw/table`):**

| Before | After |
| --- | --- |
| `TwCellDefDirective` | `CellDefDirective` |
| `TwHeaderCellDefDirective` | `HeaderCellDefDirective` |
| `TwFooterCellDefDirective` | `FooterCellDefDirective` |
| `TwNoDataRowDirective` | `NoDataRowDirective` |
| `TwRowExpansionDirective` | `RowExpansionDirective` |

**Migration:** find-and-replace each renamed import in your consuming code. Selectors (`[twDialogTitle]`, `<tw-dialog-container>`, `[twCellDef]`, etc.) are unaffected, so templates do not need to change.

**Not changed (intentionally):** the `TwDialog` service, `TwDialogRef`, `TwDialogConfig`, and all `TwDialog{Size,Role,…}` config types in `dialog-config.ts`, plus the broader `TwTable*` / `TwColumn*` / `Tw…Context` type exports in `ngx-tw/table`. These are out of scope for this rename — they're not component/directive class identifiers (the CLAUDE.md rule's target).
