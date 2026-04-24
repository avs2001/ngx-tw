# Prompt: Build `twButton` for ngx-tw

## Context

Read before starting:
- `.claude/CLAUDE.md` — all conventions, design system tokens, testing rules
- `projects/ngx-tw/theme/_semantic.css` and `_dark.css` — current theme tokens (note: token names may need alignment with CLAUDE.md; see constraints)
- `projects/ngx-tw/theme/_palette.css` — typography and animation duration tokens
- `projects/ngx-tw/src/public-api.ts` — root barrel file to update
- No existing components exist in the library. This is the first component — establish clean patterns.

CDK reference: read `node_modules/@angular/material/button/` to see how Material handles the button-as-directive pattern with `FocusMonitor`.

## Prerequisites — create before the button

### 1. Install `tailwind-variants`

Add `tailwind-variants` to:
- `projects/ngx-tw/package.json` → `peerDependencies`: `"tailwind-variants": "^0.3.0"`
- Root `package.json` → `devDependencies`: `"tailwind-variants": "^0.3.0"`

Run `npm install`.

### 2. Create `core/` secondary entry point

Create `projects/ngx-tw/src/lib/core/` with:

- **`types.ts`** — export `TwColor` (union: `'primary' | 'secondary' | 'accent' | 'neutral' | 'info' | 'success' | 'warning' | 'error'`) and `TwSize` (union: `'xs' | 'sm' | 'md' | 'lg' | 'xl'`).
- **`index.ts`** — re-export everything from `types.ts`.
- **`ng-package.json`** — `{ "lib": { "entryFile": "index.ts" } }`

### 3. Align theme tokens with CLAUDE.md

The current theme CSS uses non-standard token names (`brand-*`, `danger-*`, `surface-base`, `text-primary`, `border-default`). CLAUDE.md specifies `primary-*`, `error-*`, `surface`, `fg`, `border`. Before implementing the button, align the theme CSS to CLAUDE.md conventions:

- `brand-*` → add `primary-50` through `primary-950` tokens (full Tailwind shade scale)
- `danger-*` → add `error-50` through `error-950` tokens
- Add `secondary-*`, `accent-*`, `info-*`, `neutral-*` shade scales
- `surface-base` → `surface`, and add `surface-raised`, `surface-overlay`, `surface-sunken`, `surface-muted`
- `text-primary` → `fg`, `text-secondary` → `fg-muted`, `text-tertiary` → `fg-subtle`
- `border-default` → `border`, `border-muted` → `border-muted`, `border-emphasis` → `border-strong`

Keep the existing tokens as aliases if needed for backward compatibility, but the button must use only the CLAUDE.md token names.

## What to build

An **attribute directive** called `twButton` (selector: `[twButton]`) that styles native `<button>` and `<a>` elements. It is an attribute directive — not a component — because it must preserve native element semantics. A `<button twButton>` is a real button; an `<a twButton href="...">` is a real anchor. This avoids wrapping elements, preserves `routerLink` compatibility, and follows the same pattern as Angular Material's button.

The directive supports five visual variants (solid, outline, ghost, soft, link), all eight semantic colors, five sizes, and disabled/loading states. Icons are supported via a companion `ButtonIconDirective`.

Also create a **`ButtonIconDirective`** (`[twButtonIcon]`) that consumers place on icon elements inside the button. It applies size-appropriate classes and allows specifying `leading` (default) or `trailing` position.

## API design

### `ButtonDirective` — selector: `[twButton]`, exportAs: `twButton`

#### Inputs
- `/** Controls the visual style. Defaults to `'solid'`. */` — `variant: input<'solid' | 'outline' | 'ghost' | 'soft' | 'link'>('solid')`
- `/** Sets the semantic color palette. Defaults to `'primary'`. */` — `color: input<TwColor>('primary')`
- `/** Controls the size (padding, font size, icon size). Defaults to `'md'`. */` — `size: input<TwSize>('md')`
- `/** When true, prevents interaction and applies muted styling. Defaults to `false`. */` — `disabled: input<boolean>(false)`
- `/** When true, shows a loading spinner and prevents interaction. Defaults to `false`. */` — `loading: input<boolean>(false)`

#### Outputs
None. The directive styles a native element — consumers bind `(click)` directly on the host.

### `ButtonIconDirective` — selector: `[twButtonIcon]`

#### Inputs
- `/** Position of the icon relative to the button label. Defaults to `'leading'`. */` — `twButtonIcon: input<'leading' | 'trailing'>('leading')`

This directive applies icon sizing classes (`size-4` for xs/sm, `size-5` for md/lg/xl) and `shrink-0`. It reads the parent `ButtonDirective`'s `size` signal via `inject()` to determine the correct icon size.

### Content projection

No `ng-content` (this is a directive, not a component). The native element's children are the button's content. Icons are marked with `[twButtonIcon]`:

```html
<button twButton>
  <svg twButtonIcon>...</svg>
  Save
</button>
```

For trailing icons:

```html
<button twButton>
  Next
  <svg twButtonIcon="trailing">...</svg>
</button>
```

## Usage examples

```html
<!-- Simplest case: primary solid button -->
<button twButton>Save</button>

<!-- With color and variant -->
<button twButton variant="outline" color="error">Delete</button>

<!-- Soft variant, small size -->
<button twButton variant="soft" color="success" size="sm">Approved</button>

<!-- Ghost button with leading icon -->
<button twButton variant="ghost" color="neutral">
  <svg twButtonIcon><!-- icon svg --></svg>
  Settings
</button>

<!-- Link variant -->
<a twButton variant="link" href="/docs">Read more</a>

<!-- Anchor with routerLink -->
<a twButton variant="outline" color="secondary" routerLink="/profile">Profile</a>

<!-- Disabled state -->
<button twButton [disabled]="true">Cannot click</button>

<!-- Loading state -->
<button twButton [loading]="isSaving()">
  <svg twButtonIcon><!-- icon svg --></svg>
  Saving...
</button>
```

## Styling

### `tv()` config

Single-element directive — no slots needed. Define a `tv()` config with these variant axes:

- **`variant`**: `solid`, `outline`, `ghost`, `soft`, `link`
- **`color`**: all 8 `TwColor` values
- **`size`**: all 5 `TwSize` values
- **`disabled`**: `true` / `false`
- **`loading`**: `true` / `false`

**Base classes** (always applied):
`inline-flex items-center justify-center gap-1.5 rounded-md font-medium transition-colors duration-200 motion-reduce:transition-none cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500`

**Size variant** (maps to inline element padding scale from CLAUDE.md):
- `xs`: `px-2 py-1 text-xs`
- `sm`: `px-3 py-1.5 text-sm`
- `md`: `px-4 py-2 text-sm`
- `lg`: `px-5 py-2.5 text-base`
- `xl`: `px-6 py-3 text-base`

**Color + Variant combinations** via `compoundVariants`. Pattern for each color:

- **solid**: `bg-{color}-600 text-white hover:bg-{color}-700` (use `dark:` overrides as needed)
- **outline**: `border border-{color}-300 text-{color}-700 hover:bg-{color}-50`
- **ghost**: `text-{color}-700 hover:bg-{color}-50`
- **soft**: `bg-{color}-50 text-{color}-800 hover:bg-{color}-100`
- **link**: `text-{color}-700 underline-offset-4 hover:underline` — no padding, no background

For the `neutral` color, use surface/fg/border tokens for structural styling:
- **solid**: `bg-surface-muted text-fg hover:bg-surface-sunken` (or appropriate neutral shades)
- **outline**: `border border-border text-fg hover:bg-surface-muted`
- **ghost**: `text-fg-muted hover:bg-surface-muted`
- **soft**: `bg-surface-muted text-fg hover:bg-surface-sunken`
- **link**: `text-fg-muted hover:underline`

**Disabled** (applies on top): `opacity-50 pointer-events-none`

**Loading** (applies on top): `pointer-events-none` — the directive also sets `aria-busy="true"`.

**`defaultVariants`**: `{ variant: 'solid', color: 'primary', size: 'md', disabled: false, loading: false }`

Enable `twMerge: true`.

Wire the `tv()` result to a `computed()` signal. Apply via `host: { '[class]': 'classes()' }`.

### Loading spinner

The directive injects a small inline SVG spinner before the content when `loading()` is true. Since this is a directive (not a component with a template), use `Renderer2` to prepend a spinner element to the host, or use an embedded template approach. Alternatively, consider making the loading spinner the consumer's responsibility via projected content, with the directive only handling `aria-busy` and `pointer-events-none`. Choose the approach that keeps the directive simple. If injecting DOM, ensure cleanup in `DestroyRef`.

## Accessibility

- **ARIA:** When `disabled()` is true, set `aria-disabled="true"` on the host. Do NOT set the native `disabled` attribute on anchor elements (anchors cannot be disabled natively). For `<button>` elements, set both `aria-disabled` and native `disabled`.
- **Loading:** When `loading()` is true, set `aria-busy="true"` on the host.
- **Focus ring:** `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500` — included in base classes.
- **Keyboard:** Native `<button>` and `<a>` handle Enter/Space natively. The directive must prevent click events when disabled on anchors (since anchors cannot be natively disabled). Add a host listener equivalent via the `host` object: `'(click)': 'handleClick($event)'` — if disabled or loading, call `event.preventDefault()` and `event.stopImmediatePropagation()`.
- **FocusMonitor:** Inject `FocusMonitor` from `@angular/cdk/a11y`. Monitor the host element for focus origin. Destroy the monitor on directive destroy via `DestroyRef`.
- **Role:** Do not set `role` — native elements already have the correct role.

## Implementation notes

- The directive uses `ChangeDetection.OnPush` is not applicable (directives don't have change detection strategy). Use the `host` object for all host bindings.
- Use `inject(ElementRef)` and `inject(FocusMonitor)` from CDK.
- Use `inject(DestroyRef)` to clean up the `FocusMonitor` subscription.
- `ButtonIconDirective` injects the parent `ButtonDirective` via `inject(ButtonDirective)` to read the `size` signal and apply appropriate icon sizing classes via a `computed()` on its own host.
- The `tv()` config object will be large due to `compoundVariants` for 8 colors x 5 variants. This is expected — keep it in the same file, above the directive class.
- For the disabled anchor case: in the `host` object, conditionally bind `[attr.tabindex]` to `-1` when disabled to remove it from tab order.

## File structure

```
projects/ngx-tw/src/lib/core/
  types.ts          — TwColor, TwSize type definitions
  index.ts          — re-exports from types.ts
  ng-package.json   — { "lib": { "entryFile": "index.ts" } }

projects/ngx-tw/src/lib/button/
  button.ts         — ButtonDirective, ButtonIconDirective, tv() config, ButtonVariant type
  button.spec.ts    — Vitest tests (see test guidance below)
  index.ts          — exports ButtonDirective, ButtonIconDirective, ButtonVariant
  ng-package.json   — { "lib": { "entryFile": "index.ts" } }
```

### Test guidance for `button.spec.ts`

Cover:
- Default render: directive applied to `<button>` and `<a>` without errors
- All variant values render without errors
- All color values render without errors
- All size values render without errors
- Disabled state: `aria-disabled="true"` is present; click events are blocked on anchors; native `disabled` is set on buttons
- Loading state: `aria-busy="true"` is present; pointer events are blocked
- `ButtonIconDirective` applies correct sizing based on parent button size
- Content projection: icon in leading/trailing position renders in correct order
- Focus management: `FocusMonitor` is monitoring the element (spy on `monitor`/`stopMonitoring`)
- No `fakeAsync` — use `async/await` with `fixture.whenStable()`
- Use `vi.spyOn()` for spies

## Public API exports

From `projects/ngx-tw/src/lib/button/index.ts`:
- `ButtonDirective`
- `ButtonIconDirective`
- `ButtonVariant` (type)

From `projects/ngx-tw/src/lib/core/index.ts`:
- `TwColor`
- `TwSize`

Add re-exports to `projects/ngx-tw/src/public-api.ts`:
```typescript
export * from 'ngx-tw/core';
export * from 'ngx-tw/button';
```

## Constraints

- Attribute directive, not a component — preserves native element semantics
- All styling via Tailwind utility classes in `host` bindings — no CSS files
- Semantic color tokens only — never raw palette colors
- Neutral structural styling uses surface/fg/border tokens
- `tv()` with `twMerge: true` and `defaultVariants`
- `host` object for all host bindings — no `@HostBinding`/`@HostListener`
- Signal-based: `input()` for all inputs, `computed()` for derived state
- `inject()` for DI — no constructor injection
- `FocusMonitor` from `@angular/cdk/a11y` with cleanup via `DestroyRef`
- JSDoc on every `input()`
- Vitest only — no `fakeAsync`/`tick`
- Angular v21 standalone by default — do not set `standalone: true`
- Visual tokens (radius, spacing, typography, focus rings, transitions) must match CLAUDE.md design system exactly
