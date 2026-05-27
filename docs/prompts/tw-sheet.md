# Prompt: Build `tw-sheet` for ngx-tw

## Context — read these first

- `.claude/CLAUDE.md` — conventions (Angular v21 standalone, signal APIs, Tailwind v4, tailwind-variants, OnPush, semantic + surface tokens, focus-ring policy, animation policy, input cap exceptions).
- `projects/ngx-tw/dialog/` — the direct ancestor. Sheet is *dialog with edge anchoring + slide-axis animation*. Mirror file layout, lifecycle, ref API, content-directive split, animation-state machine. Read `dialog.ts`, `dialog-container.ts`, `dialog-config.ts`, `dialog-ref.ts`, `dialog-content.ts`, `dialog.spec.ts`, `index.ts`, `ng-package.json`.
- `projects/ngx-tw/toast/toast.ts` lines ~285-345 — reference for `createGlobalPositionStrategy` usage when pinning an overlay to an edge.
- `projects/ngx-tw/theme/_base.css` lines ~115-330 — the canonical place to add backdrop + animation rules. Sheet adds its own backdrop class (`tw-sheet-backdrop`) and per-side animation classes alongside the existing dialog/toast ones.
- `projects/demo/src/app/routes/dialog/` — closest demo template.

## What to build

A **sheet** — an edge-anchored overlay panel (also known as "drawer"). Distinct from `dialog`: dialog is centered, sheet pins to a viewport edge and slides in along that axis. Same modal semantics, same focus management, same lifecycle, but a different visual idiom for tasks that benefit from a docked surface — navigation drawers, filter panels, detail editors, mobile-friendly menus.

User-story framing:

- "As a user, I tap a hamburger and a navigation panel slides in from the left over the page; tapping the backdrop or pressing Escape dismisses it and focus returns to the hamburger."
- "As a developer, I call `sheet.open(MyFilters, { side: 'right', size: 'md' })` and receive a `SheetRef` whose `afterClosed()` resolves with whatever the inner component passed."
- "As an a11y consumer, the surface announces itself with `role=dialog`, `aria-modal=true`, title in `aria-labelledby`, focus is trapped while open, restored to the trigger on close, scroll is locked under it."

Scope locked (do not revisit):

- Built on `@angular/cdk/dialog` (same as `TwDialog`) — the CDK already gives focus trap, restore-focus, backdrop, scrim, keyboard, portal, container.
- Sheet differs from dialog in **two** axes: the **position strategy** (a `GlobalPositionStrategy` pinned to one edge with full-cross-axis sizing) and the **animation** (slide along the docking axis instead of dialog's center-scale).
- Keep `role` configurable (`'dialog' | 'alertdialog'`) — do not introduce `'complementary'`. Real-world sheet libraries (Radix, vaul, Material BottomSheet) all stay on `role=dialog`. Non-modal usage opts out via `ariaModal=false`.
- Animation uses dialog's `data-[state]` driven CSS transition pattern (not `animate.enter`/`animate.leave`). Rationale, copied from `dialog-container.ts:27-35`: the ref owns enter/exit durations per-`open()` call and `animate.enter` only accepts a static class name. Document this divergence in a header comment on `sheet-container.ts`. The backdrop is the only thing with a named CSS class (`tw-sheet-backdrop`).
- `closeOnEscape` and `closeOnBackdropClick` are **split** (both default `true`). Dialog collapses them into `disableClose`; sheet does not, because consumers commonly need one without the other (e.g., a wizard sheet that swallows Escape but lets backdrop dismiss).

## File layout

Create `projects/ngx-tw/sheet/`:

| File | Role |
|---|---|
| `sheet.ts` | `Sheet` service + `provideSheet()`, mirroring `TwDialog` + `provideTwDialog()`. |
| `sheet-config.ts` | `SheetConfig` (extends CDK `DialogConfig`), `SHEET_DATA`, `SHEET_DEFAULT_OPTIONS`, types (`SheetSide`, `SheetSize`, `SheetScrollStrategy`, `SheetRole`, `SheetAutoFocus`, `SheetRestoreFocus`). |
| `sheet-container.ts` | `SheetContainer` extends `CdkDialogContainer<SheetConfig>`. Owns animation state + `tv()` config + `aria-labelledby/describedby` queues. |
| `sheet-ref.ts` | `SheetRef` — exact analogue of `TwDialogRef` with `closeOnEscape` / `closeOnBackdropClick` split. |
| `sheet-content.ts` | Slot directives: header, title, subtitle, description, content, actions, icon, close. |
| `sheet.spec.ts` | Vitest suite — see Test plan. |
| `index.ts` | Re-exports public API. |
| `ng-package.json` | `{ "lib": { "entryFile": "index.ts" } }`. |

Append `export * from 'ngx-tw/sheet';` to `projects/ngx-tw/src/public-api.ts` (single line at end of the components block — do not reorder).

## Public API

### Service: `Sheet` (class) + `provideSheet()` (helper)

Mirror `TwDialog` exactly (parent-child registry, `openSheets`, `afterOpened`, `afterAllClosed`, `closeAll`, `getSheetById`, `ngOnDestroy`).

```ts
@Injectable()
export class Sheet implements OnDestroy {
  open<R, D, C>(content: ComponentType<C> | TemplateRef<C>, config?: SheetConfig<D, R>): SheetRef<R, C>;
  closeAll(): void;
  getSheetById<R, C>(id: string): SheetRef<R, C> | undefined;
  // observables/signals: openSheets, afterOpened, afterAllClosed
}

export function provideSheet(defaultOptions?: Partial<SheetConfig>): EnvironmentProviders;
```

**Critical difference vs dialog:** `Sheet.open()` builds a `GlobalPositionStrategy` from the `side` value and passes it via `CdkDialog`'s `positionStrategy` config option (CDK Dialog accepts it — see `@angular/cdk/dialog`'s `DialogConfig.positionStrategy` field, used at `createGlobalPositionStrategy()` for the default).

Position strategy mapping:

| side | strategy chain |
|---|---|
| `'right'` (default) | `.top('0').right('0').bottom('0')` |
| `'left'` | `.top('0').left('0').bottom('0')` |
| `'top'` | `.top('0').left('0').right('0')` |
| `'bottom'` | `.bottom('0').left('0').right('0')` |

The container DOM handles the orthogonal-axis sizing via tv() (`h-screen` for left/right, `w-screen` for top/bottom).

### `SheetConfig<D, R>` (extends `CdkDialogConfig<D, R>`)

Overlay-bearing exception applies — input/config-field count is unconstrained.

| Field | Type | Default | Notes |
|---|---|---|---|
| `side` | `SheetSide = 'top' \| 'right' \| 'bottom' \| 'left'` | `'right'` | Edge to anchor against. |
| `size` | `SheetSize = 'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| 'full'` | `'md'` | See size table below. Axis-dependent. |
| `enterAnimationDuration` | `number` | `200` | ms; `0` disables. Slightly longer than dialog (150ms) because a slide reads better with more dwell. |
| `exitAnimationDuration` | `number` | `160` | ms; asymmetric (faster) for the same reason dialog does it. |
| `scrollBehavior` | `'block' \| 'close' \| 'reposition' \| 'noop'` | `'block'` | Maps to a `ScrollStrategy`. |
| `ariaModal` | `boolean` | `true` | Override from CDK. |
| `hasBackdrop` | `boolean` | `true` | Override. |
| `closeOnEscape` | `boolean` | `true` | **New (not in dialog).** Inline JSDoc must justify the `true` default: "Escape is the universal dismiss key for modal surfaces". |
| `closeOnBackdropClick` | `boolean` | `true` | **New.** Inline JSDoc: "Clicking outside a modal sheet is the expected dismiss gesture". |
| `closeOnNavigation` | `boolean` | `true` | Override. |
| `autoFocus` | `AutoFocusTarget \| string \| boolean` | `'first-tabbable'` | Override. |
| `restoreFocus` | `RestoreFocusValue` | `true` | Override. |
| `disableClose` | `boolean` | `false` | Kept for parity with CDK; semantically equivalent to `closeOnEscape=false && closeOnBackdropClick=false`. When `true` it overrides both. |
| `panelClass`, `backdropClass`, `data`, `id`, `role`, `viewContainerRef`, `injector`, `providers`, `direction`, `ariaLabel`, `ariaLabelledBy`, `ariaDescribedBy`, `closePredicate` | inherited from CDK / dialog parity | — | Same semantics as dialog. |

Do **not** ship `width`/`height`/`minWidth`/`maxWidth`/`minHeight`/`maxHeight` overrides — sheet sizing is driven by `side + size` and applied to the container element, not the overlay pane. Consumers can still pass them as a CDK escape hatch.

`SHEET_DATA = new InjectionToken<unknown>('SHEET_DATA')`. `SHEET_DEFAULT_OPTIONS = new InjectionToken<Partial<SheetConfig>>('SHEET_DEFAULT_OPTIONS')`.

### `SheetRef<R, C>`

Same shape as `TwDialogRef`. Public surface:

- `id: string`
- `componentInstance: C | null`
- `componentRef: ComponentRef<C> | null`
- `state: Signal<SheetState>` — `'opening' | 'open' | 'closing' | 'closed'`
- `config: SheetConfig<unknown, R>`
- `containerInstance: SheetContainer`
- `disableClose: boolean | undefined`
- **New:** `closeOnEscape: boolean | undefined` and `closeOnBackdropClick: boolean | undefined`
- `close(result?: R): void`
- `afterOpened(): Observable<void>`
- `beforeClosed(): Observable<R | undefined>`
- `afterClosed(): Observable<R | undefined>`
- `backdropClick(): Observable<MouseEvent>`
- `keydownEvents(): Observable<KeyboardEvent>`
- `addPanelClass(c)` / `removePanelClass(c)`

The internal escape/backdrop subscription must check the split flags:

```ts
merge(
  cdkRef.backdropClick.pipe(filter(() => !this.disableClose && this.closeOnBackdropClick !== false)),
  cdkRef.keydownEvents.pipe(filter((event) =>
    event.keyCode === ESCAPE &&
    !this.disableClose &&
    this.closeOnEscape !== false &&
    !hasModifierKey(event),
  )),
).subscribe((event) => { event.preventDefault(); this.closeWithOrigin(event.type === 'keydown' ? 'keyboard' : 'mouse'); });
```

### `SheetContainer`

Extends `CdkDialogContainer<SheetConfig>`. Same `state` / `animationStateChanged` plumbing as `TwDialogContainer`, but the variant block is different.

**Animation pattern (locked):** data-state driven CSS transitions on the container element, not keyframe classes. The container exposes `[attr.data-state]` and `[attr.data-side]`, and the `tv()` config produces the initial-offset + open-rest classes per `side`. A single `transition-[transform,opacity]` rule with `[style.transition-duration.ms]` covers both directions.

`tv()` slot shape:

```ts
const sheetContainerVariants = tv({
  slots: {
    host: 'fixed flex flex-col outline-none bg-surface-raised text-fg border-border shadow-md overflow-hidden transition-[transform,opacity] ease-out motion-reduce:transition-none opacity-0 data-[state=open]:opacity-100',
  },
  variants: {
    side: {
      right:  { host: 'h-screen border-l data-[state=opening]:translate-x-full data-[state=closing]:translate-x-full data-[state=open]:translate-x-0 right-0 top-0' },
      left:   { host: 'h-screen border-r data-[state=opening]:-translate-x-full data-[state=closing]:-translate-x-full data-[state=open]:translate-x-0 left-0 top-0' },
      top:    { host: 'w-screen border-b data-[state=opening]:-translate-y-full data-[state=closing]:-translate-y-full data-[state=open]:translate-y-0 left-0 top-0' },
      bottom: { host: 'w-screen border-t data-[state=opening]:translate-y-full data-[state=closing]:translate-y-full data-[state=open]:translate-y-0 left-0 bottom-0' },
    },
    size: {
      xs: { host: '' }, sm: { host: '' }, md: { host: '' }, lg: { host: '' }, xl: { host: '' }, full: { host: '' },
    },
  },
  compoundVariants: [
    // Horizontal sheets — size controls width
    { side: 'right', size: 'xs',   class: { host: 'w-full max-w-xs' } },
    { side: 'right', size: 'sm',   class: { host: 'w-full max-w-sm' } },
    { side: 'right', size: 'md',   class: { host: 'w-full max-w-md' } },
    { side: 'right', size: 'lg',   class: { host: 'w-full max-w-xl' } },
    { side: 'right', size: 'xl',   class: { host: 'w-full max-w-2xl' } },
    { side: 'right', size: 'full', class: { host: 'w-screen max-w-none' } },
    // …same for `left`
    // Vertical sheets — size controls height
    { side: 'top', size: 'xs',   class: { host: 'h-1/4 max-h-[20vh]' } },
    { side: 'top', size: 'sm',   class: { host: 'h-1/3 max-h-[33vh]' } },
    { side: 'top', size: 'md',   class: { host: 'h-1/2 max-h-[50vh]' } },
    { side: 'top', size: 'lg',   class: { host: 'h-2/3 max-h-[66vh]' } },
    { side: 'top', size: 'xl',   class: { host: 'h-3/4 max-h-[80vh]' } },
    { side: 'top', size: 'full', class: { host: 'h-screen max-h-none' } },
    // …same for `bottom`
  ],
  defaultVariants: { side: 'right', size: 'md' },
}, { twMerge: true });
```

Host bindings on the container:

```
'[attr.id]': '_config.id || null',
'[attr.role]': '_config.role',
'[attr.aria-modal]': '_config.ariaModal',
'[attr.aria-labelledby]': '_config.ariaLabel ? null : _ariaLabelledByQueue[0]',
'[attr.aria-label]': '_config.ariaLabel',
'[attr.aria-describedby]': 'ariaDescribedByAttr()',
'[attr.data-state]': 'state()',
'[attr.data-side]': '_config.side ?? "right"',
'[class]': 'hostClasses()',
'[style.transition-duration.ms]': 'transitionDuration()',
tabindex: '-1',
```

Animation state machine — copy `TwDialogContainer` verbatim, only the visual transform changes (which is handled entirely in CSS via `data-[state]`).

### Slot directives (`sheet-content.ts`)

One-for-one with `dialog-content.ts`:

| Directive | Selector | Class binding |
|---|---|---|
| `SheetHeaderDirective` | `[twSheetHeader], tw-sheet-header` | `flex items-start gap-3 px-6 pt-6 pb-4` |
| `SheetIconDirective` | `[twSheetIcon]` | semantic color rounded-full container, same lookup table as dialog |
| `SheetTitleDirective` | `[twSheetTitle], tw-sheet-title` | `text-base font-semibold text-fg` + auto-registers id with `_addAriaLabelledBy` |
| `SheetSubtitleDirective` | `[twSheetSubtitle], tw-sheet-subtitle` | `text-sm text-fg-muted` |
| `SheetDescriptionDirective` | `[twSheetDescription], tw-sheet-description` | registers id with `_addAriaDescribedBy` |
| `SheetContentDirective` | `[twSheetContent], tw-sheet-content` | `flex-1 overflow-y-auto px-6 py-4 text-sm text-fg`, applies `CdkScrollable` via hostDirective |
| `SheetActionsDirective` | `[twSheetActions], tw-sheet-actions` | `flex flex-wrap items-center gap-2 px-6 py-4 border-t border-border-muted` + `align` input |
| `SheetCloseDirective` | `[twSheetClose]` | closes the enclosing sheet on click, optional payload |

Use the same `findEnclosingSheet(elementRef, sheet)` helper as dialog (walks up to find `tw-sheet-container`, then looks up by id). JSDoc on every public input/method.

### `index.ts` exports

```ts
export { Sheet, provideSheet } from './sheet';
export { SheetRef } from './sheet-ref';
export { SheetContainer, type SheetAnimationEvent, type SheetState } from './sheet-container';
export {
  SheetConfig, SHEET_DATA, SHEET_DEFAULT_OPTIONS,
  type SheetSide, type SheetSize, type SheetRole,
  type SheetAutoFocus, type SheetRestoreFocus, type SheetScrollStrategy,
} from './sheet-config';
export {
  SheetTitleDirective, SheetSubtitleDirective, SheetDescriptionDirective,
  SheetContentDirective, SheetActionsDirective, SheetCloseDirective,
  SheetIconDirective, SheetHeaderDirective,
  type SheetActionsAlign,
} from './sheet-content';
```

(Class names follow CLAUDE.md: no `Tw*` prefix on classes — package scope provides namespace.)

## Theme additions (`projects/ngx-tw/theme/_base.css`)

Append one new block:

```css
/* Sheet backdrop fades in/out with CDK's backdrop-showing class. */
.tw-sheet-backdrop {
  background-color: rgb(0 0 0 / 0.5);
  opacity: 0;
  transition: opacity 200ms ease-out;
}
.tw-sheet-backdrop.cdk-overlay-backdrop-showing {
  opacity: 1;
}
```

And add `.tw-sheet-backdrop { transition-duration: 0ms; }` to the existing reduced-motion `@media` block (the one that already lists `.tw-dialog-backdrop`).

No keyframes are needed — all sheet motion is `data-[state]` driven CSS transitions on the container, already covered by the universal reduced-motion guard at `_base.css:341-349`.

## Test plan (`sheet.spec.ts`)

Mirror `dialog.spec.ts` structure. Required cases (every one must be in the suite):

**Rendering**
- nothing renders before `open()`
- container renders with both Component and TemplateRef content
- each `side` value (`top`, `right`, `bottom`, `left`) renders without error and applies the correct `data-side` attribute
- each `size` value (`xs` → `full`) renders without error
- compoundVariants apply: assert `max-w-md` shows up for `{ side: 'right', size: 'md' }`, `max-h-[50vh]` for `{ side: 'top', size: 'md' }`

**Backdrop**
- backdrop renders by default
- `hasBackdrop: false` omits it
- `closeOnBackdropClick: true` (default) — backdrop click closes
- `closeOnBackdropClick: false` — backdrop click does **not** close (sheet remains open)
- `disableClose: true` — overrides both, backdrop click does not close

**Keyboard**
- `closeOnEscape: true` (default) — Escape closes
- `closeOnEscape: false` — Escape does **not** close
- `disableClose: true` — overrides both, Escape does not close
- Escape with modifier keys (ctrl/meta) is ignored regardless of flag

**close()**
- `close(result)` closes and forwards the result to `afterClosed()` subscribers
- `closePredicate` returning `false` blocks the close

**Lifecycle observables**
- `afterOpened()` emits once after enter animation finishes
- `beforeClosed()` emits before `afterClosed()`
- state transitions `opening → open → closing → closed`

**Service registry**
- `openSheets` signal tracks open sheets
- `getSheetById` resolves
- opening duplicate IDs throws
- `closeAll()` closes all (verify with two open at once — stacking)

**Accessibility**
- default `role="dialog"`, supports `role="alertdialog"`
- `aria-modal` defaults to `true`, opt-out via `ariaModal: false`
- `aria-labelledby` resolves to the title id via `twSheetTitle`
- `aria-describedby` resolves to the description id via `twSheetDescription`
- explicit `ariaLabel` suppresses `aria-labelledby`
- explicit `ariaDescribedBy` overrides directive-supplied ids
- `data-side` attribute reflects the configured side

**Stacking**
- opening two sheets simultaneously produces two `tw-sheet-container` elements in DOM, the second one is on top (compare `cdk-overlay-pane` z-index order — CDK handles this; just assert both exist and closing one doesn't disturb the other)

**Close directive**
- `[twSheetClose]="value"` closes with that value
- default button `type` is `"button"`

**Content directives (offline)**
- `SheetIconDirective` neutral default classes
- `SheetIconDirective` applies semantic color classes
- `SheetSubtitleDirective` applies `text-fg-muted`
- `SheetDescriptionDirective` generates a unique id prefixed with `tw-sheet-description-`

**Default options**
- `provideSheet({ side: 'left', size: 'lg' })` defaults bleed into `open()`

Vitest patterns:

- `vi.useFakeTimers()` in `beforeEach`, `vi.useRealTimers()` in `afterEach`
- Helpers: `getContainerEl()`, `getBackdropEl()`, `flushEnter()` (advance 200ms + padding), `flushExit()` (160ms + padding), `pressEscape(el)`
- After every fixture mutation: `fixture.detectChanges()`; for sheets opened in TestBed harness components also call `TestBed.inject(ApplicationRef).tick()` before asserting on host attributes (mirrors dialog spec, lines 392-398)
- Tear down via `dialog.closeAll(); flushExit();` plus emptying `.cdk-overlay-container` innerHTML

Aim for 30+ `it()` cases.

## Demo plan (`projects/demo/src/app/routes/sheet/`)

Mirror `routes/dialog/`. Files:

- `sheet.routes.ts` — same shape (overview / examples / api children).
- `sheet-page.component.ts` — same `tw-item` + `twTabNav` shell. Page header copy: "Edge-anchored overlay panel — drawer-style modal anchored to the top, right, bottom, or left edge."
- `overview/sheet-overview.component.ts` — describe accessibility, keyboard table (Escape, Tab, Shift+Tab), single quick demo button per side.
- `examples/sheet-examples.component.ts` — one button per example, each opening a small inline component or template:
  1. Sides — four buttons (top/right/bottom/left).
  2. Sizes — buttons covering `xs`, `sm`, `md`, `lg`, `xl`, `full` on the right side.
  3. With form content — a contact-form example, asserting focus enters the first input on open. Right side, `md`.
  4. Footer actions — Cancel + Save in a `[twSheetActions]` bar; right side, `md`.
  5. Non-modal — `ariaModal: false`, `hasBackdrop: false`. Visual cue: page remains interactive. Right side, `sm`.
  6. Long content — a long scrollable list inside `[twSheetContent]` to demonstrate scroll. Right side, `lg`.
  7. Suppress close — `closeOnBackdropClick: false`, `closeOnEscape: false` example with an explicit close button.
- `api/sheet-api.component.ts` — same Compodoc-driven API tables as dialog (`<app-api-table>` etc., look at dialog's API page for the structure).

Route wiring:
- Append `{ path: 'components/sheet', loadChildren: …'./routes/sheet/sheet.routes'.then(m => m.SHEET_ROUTES) }` to `projects/demo/src/app/app.routes.ts` at the **end of the components block** (single line — do not reorder).
- Sidebar nav (`projects/demo/src/app/layout/shell.ts`): insert `{ label: 'Sheet', children: [...] }` between `Separator` and `Skeleton` (alphabetical). Single block insertion.

Bootstrap: `app.config.ts` already calls `provideTwDialog()`. Add `provideSheet()` alongside it.

## Implementation checklist (in order)

1. Create the entry point files (`ng-package.json`, `index.ts` stubs).
2. Write `sheet-config.ts` (types + class + tokens).
3. Write `sheet-container.ts` (tv() config + animation state machine, copying dialog's).
4. Write `sheet-ref.ts` (with split `closeOnEscape` / `closeOnBackdropClick`).
5. Write `sheet.ts` (service + position-strategy builder + `provideSheet()`).
6. Write `sheet-content.ts` (slot directives).
7. Wire `sheet/index.ts` exports + append to root `public-api.ts`.
8. Add backdrop CSS + reduced-motion line to `theme/_base.css`.
9. Write `sheet.spec.ts`. Run: `npx ng test ngx-tw --include "**/sheet.spec.ts"` until green.
10. Build the library: `npx ng build ngx-tw` (demo resolves `ngx-tw/sheet` via `dist/`).
11. Scaffold demo routes / pages.
12. Wire route + sidebar (single-line edits).
13. Add `provideSheet()` to `app.config.ts`.
14. Start dev server on port 4600. Visit `http://localhost:4600/components/sheet/examples`. Manually:
    - open each side, watch the slide direction
    - tab into focus trap, confirm trap and restore
    - Escape closes; suppress example does not close on Escape
    - backdrop click closes; suppress example does not
    - check no console errors
    - check `body` does not retain `cdk-global-scrollblock` after close
    - toggle `prefers-reduced-motion` in DevTools — animations should be instant.
15. Re-run sheet specs + lint changed files + library build.

## Self-critique to apply before declaring done

- **Position strategy:** confirm `Sheet.open()` passes a freshly built `GlobalPositionStrategy` to `CdkDialog.open` via the `positionStrategy` config field. Default-built dialogs receive a centered strategy if not passed; sheet must always pass its own.
- **Scroll lock:** when `scrollBehavior` is `'block'`, opening should add `cdk-global-scrollblock` to the host element; closing must remove it (this is automatic via CDK — verify in-browser that nothing leaks).
- **Stacking:** opening sheet B while sheet A is open must not detach A. CDK overlay z-indexes increment per overlay; assert both `tw-sheet-container` elements exist after the second `open()`.
- **Reduced motion:** with `prefers-reduced-motion: reduce` the universal guard already collapses transition durations on `*`. No extra rule needed beyond the explicit backdrop one.
- **Class naming:** no `Tw*` prefix on classes — package scope namespaces them. Selectors retain `tw-` (`tw-sheet-container`) and `tw` camelCase (`twSheetTitle`) prefixes per CLAUDE.md.
- **JSDoc on every input/output/public method.** Compodoc parses these for the demo's API page.
- **Strict TS / no `any`** — use `unknown` for `data` payloads.
- **No NgModules. Standalone only. `providedIn: 'root'` forbidden on the service** — register via `provideSheet()`.
- **Don't touch sibling agents' files.** Append single lines to `public-api.ts`, `app.routes.ts`, `shell.ts`. No reordering.

## Input-cap exception

`SheetConfig` extends CDK's `DialogConfig` and gains a handful of sheet-specific axes (`side`, `size`, animation durations, scroll behavior, split close flags). The overlay-bearing exception (already codified in CLAUDE.md, "Input count cap" table) covers this. No new exception needs to be added to CLAUDE.md.
