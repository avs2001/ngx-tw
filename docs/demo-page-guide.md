# Demo Documentation Page — Authoring Guide

This guide is the single source of truth for **how every component's documentation page** under `projects/demo/src/app/routes/` is structured. Follow it when **creating a new page** or **refactoring an existing one** so the demo app stays consistent.

The goal: every route looks, scrolls, and reads the same. The only thing that changes is the component being documented.

---

## 1. File Layout

Every route is a folder named after the component's kebab-case token, containing exactly five files across four locations:

```
projects/demo/src/app/routes/{name}/
├── {name}.routes.ts                # lazy-loaded child routes
├── {name}-page.component.ts        # shell: header + tab nav + <router-outlet/>
├── overview/
│   └── {name}-overview.component.ts
├── examples/
│   └── {name}-examples.component.ts
└── api/
    └── {name}-api.component.ts
```

Rules:
- Folder name and file prefix use the same kebab-case token.
- Class names are PascalCase without suffix: `ButtonPage`, `ButtonOverview`, `ButtonExamples`, `ButtonApi`.
- Selector uses `app-` prefix: `app-button-page`, `app-button-overview`, `app-button-examples`, `app-button-api`.
- Every component is standalone, `ChangeDetection.OnPush`, inline `template:`.

---

## 2. Routes File — `{name}.routes.ts`

Copy-paste shape. Only the three tokens (`Button`, `button`, `BUTTON`) change.

```ts
import type { Routes } from '@angular/router';
import { ButtonPage } from './button-page.component';

export const BUTTON_ROUTES: Routes = [
  {
    path: '',
    component: ButtonPage,
    children: [
      { path: '', redirectTo: 'overview', pathMatch: 'full' },
      {
        path: 'overview',
        loadComponent: () => import('./overview/button-overview.component').then(m => m.ButtonOverview),
      },
      {
        path: 'examples',
        loadComponent: () => import('./examples/button-examples.component').then(m => m.ButtonExamples),
      },
      {
        path: 'api',
        loadComponent: () => import('./api/button-api.component').then(m => m.ButtonApi),
      },
    ],
  },
];
```

Do not rename the three children, re-order them, remove the `redirectTo`, or eagerly import subpages.

---

## 3. Page Shell — `{name}-page.component.ts`

The page shell is a **container + header + tab nav + outlet**. There are two flavors of the shell currently in the codebase — use the **canonical (dogfooded) version** below. Migrate legacy pages to it when touching them.

### Canonical shell (dogfood: `tw-item` + `twTabNav`)

```ts
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { TabNavComponent, TabLinkDirective } from 'ngx-tw/tab-nav';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
} from 'ngx-tw/item';

@Component({
  selector: 'app-button-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet, RouterLink, RouterLinkActive,
    TabNavComponent, TabLinkDirective,
    ItemComponent, ItemLeadingDirective, ItemTitleDirective, ItemDescriptionDirective,
  ],
  template: `
    <div class="mx-auto max-w-4xl px-6 py-12">
      <tw-item size="lg" class="mb-8">
        <div
          twItemLeading
          class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600"
        >
          <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <!-- 20×20 heroicons-style mini SVG; single <path> preferred -->
          </svg>
        </div>
        <h1 twItemTitle>Button</h1>
        <p twItemDescription>One-sentence summary of what the component does.</p>
      </tw-item>

      <nav twTabNav aria-label="Button documentation tabs" class="mb-8">
        <a twTabLink routerLink="overview" routerLinkActive #o="routerLinkActive" [active]="o.isActive">Overview</a>
        <a twTabLink routerLink="examples" routerLinkActive #e="routerLinkActive" [active]="e.isActive">Examples</a>
        <a twTabLink routerLink="api"      routerLinkActive #a="routerLinkActive" [active]="a.isActive">API</a>
      </nav>

      <router-outlet />
    </div>
  `,
})
export class ButtonPage {}
```

### Rules for the shell

- **Container:** always `mx-auto max-w-4xl px-6 py-12`. Do not change the max width or padding.
- **Header icon:** 20×20 viewBox, single-color `fill="currentColor"`, `aria-hidden="true"`. Container is `size-10 rounded-lg bg-primary-50 text-primary-600` — **always primary tint**, regardless of what color the component itself uses.
- **Title:** plain component name in title case (`Button`, `Form Field`, `Date Picker`). No library prefix.
- **Description:** **one sentence**, present tense, ends in a period. Says what the component is/does, not how. Mirror the one-line JSDoc summary from the library.
- **Tab nav:** exactly three tabs in this order: Overview, Examples, API. `aria-label` follows the pattern `"{Name} documentation tabs"`.
- **Outlet:** `<router-outlet />` (self-closing, Angular v18+ syntax).

### Legacy shell (inline `<div>` header + inline `<nav>`)

About 33 existing pages use a hand-rolled header and nav. **Do not write new pages this way.** When touching one of these files, port it to the canonical version above. The legacy shell looks like this (for identification only):

```html
<div class="flex items-start gap-3 mb-8">
  <div class="flex items-center justify-center size-10 rounded-lg bg-primary-50 text-primary-600 shrink-0 mt-0.5">
    <svg class="size-5" ... />
  </div>
  <div>
    <h1 class="text-xl font-bold text-fg">Name</h1>
    <p class="text-sm text-fg-muted mt-0.5">Description.</p>
  </div>
</div>

<nav class="flex border-b border-border-muted mb-8" aria-label="Name documentation tabs">
  <a routerLink="overview" routerLinkActive="!border-primary-500 !text-primary-600"
     class="px-4 py-2 text-sm font-medium -mb-px border-b-2 border-transparent text-fg-muted hover:text-fg transition-colors duration-200">
    Overview
  </a>
  <!-- repeat for examples, api -->
</nav>
```

---

## 4. Overview Page — `{name}-overview.component.ts`

The overview has **exactly four sections** in this order: **Description, Basic Usage, Import, Key Features**. Do not add, remove, rename, or reorder them.

### 4.1 Shared structure

- Each section is a top-level `<section class="mb-10">` **except the last** (Key Features), which omits `mb-10`.
- Section titles: `<h2 class="text-sm font-semibold mb-3">{Title}</h2>`.
- No wrapping outer container — the shell's container already provides width/padding.

### 4.2 Description

A single paragraph, 2–4 sentences. Explains what the component is, where it fits, and the ARIA pattern it implements (if relevant). Inline any referenced component/directive names as inline code.

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Description</h2>
  <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
    The Button directive turns any element into a styled, accessible button with support
    for multiple variants, semantic colors, sizes, loading states, and icon placement.
    Apply it to native <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
    or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;a&gt;</code> elements.
  </p>
</section>
```

### 4.3 Basic Usage

A **live demo** followed by the **code that produces it**. Always exactly one demo box and one code box — not a matrix, not multiple examples. Keep the demo minimal (the smallest working configuration).

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>

  <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
    <!-- minimal live demo -->
  </div>

  <div class="bg-surface-sunken border border-border rounded-lg p-4">
    <pre class="text-sm font-mono whitespace-pre text-fg"><code>&lt;!-- snippet --&gt;</code></pre>
  </div>
</section>
```

### 4.4 Import

A single code box showing how consumers import the main entry from the secondary entry point. No surrounding prose. The curly braces must be escaped with interpolation (`{{ '{' }}`, `{{ '}' }}`) because Angular's parser treats `{{` as interpolation.

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Import</h2>
  <div class="bg-surface-sunken border border-border rounded-lg p-4">
    <pre class="text-sm font-mono whitespace-pre text-fg"><code>import {{ '{' }} ButtonDirective {{ '}' }} from 'ngx-tw/button';</code></pre>
  </div>
</section>
```

### 4.5 Key Features

A bulleted list of 6–12 short items. Each line starts with a capital letter; no trailing period unless the line contains a full sentence. Use inline code for identifiers.

```html
<section>
  <h2 class="text-sm font-semibold mb-3">Key Features</h2>
  <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
    <li>5 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>, ...</li>
    <li>8 semantic colors across all variants</li>
    <li>Accessible: ARIA attributes, focus management via CDK FocusMonitor</li>
  </ul>
</section>
```

---

## 5. Examples Page — `{name}-examples.component.ts`

The examples page demonstrates **every meaningful axis** of the component. It is a sequence of `<section class="mb-10">` blocks, one per axis. The page ends with a **Playground** section.

### 5.1 Section canon

Include these sections when they apply to the component. Omit ones that don't apply; don't invent new names for the same axis.

| Order | Section title        | When to include                                                              |
|-------|----------------------|------------------------------------------------------------------------------|
| 1     | `Variants`           | Component exposes a `variant` input                                          |
| 2     | `Colors`             | Component exposes a `color` input (`TwColor`)                                |
| 3     | `Sizes`              | Component exposes a `size` input (`TwSize`)                                  |
| 4     | `With Icons`         | Component supports leading/trailing icon slots                               |
| 5     | `Anchor Elements`    | Directive-based component that can attach to `<a>` as well as `<button>`    |
| 6     | `States`             | Multi-state: `disabled`, `loading`, `readonly`, `invalid`, etc.              |
| 7     | `Template-Driven Forms` | Form control — include one demo with `[(ngModel)]`                         |
| 8     | `Reactive Forms`     | Form control — include one demo with `[formControl]`                         |
| 9     | `Signal Forms`       | Form control — include one demo with `[formField]` (`form()` from v21)       |
| 10    | Custom slots…        | One section per structural-directive slot (`Custom option template`, etc.)   |
| 11    | `Playground`         | **Always last**                                                              |

Form-control components (`Input`, `Select`, `Checkbox`, `Radio`, `Switch`, `Slider`, etc.) **must include all three form sections** (7/8/9) to prove CVA compatibility — this is a hard library requirement (see CLAUDE.md § Form Compatibility).

### 5.2 Section skeleton

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Variants</h2>
  <div class="rounded-lg border border-border p-6 bg-surface-raised">
    <div class="flex flex-wrap items-center gap-3">
      @for (v of variants; track v) {
        <button twButton [variant]="v">{{ v }}</button>
      }
    </div>
  </div>
</section>
```

### 5.3 Demo container rules

- **Demo surface:** `rounded-lg border border-border p-6 bg-surface-raised`.
- **Inner layout primitives:**
  - Horizontal row of samples: `flex flex-wrap items-center gap-3`.
  - Grouped samples with sub-labels: outer `space-y-4`, each group has `<p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{label}</p>` above its row.
  - Grid: `grid grid-cols-2 md:grid-cols-4 gap-4`.
- **Metadata line** (current value / state readout under a demo): `<p class="text-xs text-fg-muted mt-4 font-mono">`.
- **No code blocks** in the examples page. The *Overview* page shows code; the *Examples* page shows live behavior. If a demo is non-obvious, add a short `<p class="text-xs text-fg-muted mb-3">` caption **inside** the demo surface before the component — do not add a `<pre>` block.

### 5.4 Shared constants

Hoist `VARIANTS`, `COLORS`, `SIZES` arrays to module scope as `readonly` constants using the library types. Reference them via `protected readonly` fields on the component so they stay reachable from the template.

```ts
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { ButtonVariant } from 'ngx-tw/button';

const VARIANTS: ButtonVariant[] = ['solid', 'outline', 'ghost', 'soft', 'link'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

export class ButtonExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
}
```

Always iterate with `@for (x of xs; track x)`. Never hard-code `['solid', 'outline', ...]` in the template.

### 5.5 Playground section

Every examples page ends with a Playground. The Playground must:

- Live inside the standard demo surface (`rounded-lg border border-border p-6 bg-surface-raised`).
- Expose one control group per meaningful input: Variant, Color, Size, plus boolean feature toggles as relevant.
- Render the live component inside a **sunken inner box**: `p-8 rounded-lg bg-surface-sunken` (or `p-6` for wider components).
- Drive all controls from component signals named `playVariant`, `playColor`, `playSize`, `playMultiple`, etc.

Playground control buttons use this exact shape:

```html
<div>
  <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
  <div class="flex gap-1">
    @for (v of variants; track v) {
      <button
        twButton variant="ghost" color="neutral" size="xs"
        [class.!bg-primary-100]="playVariant() === v"
        [class.!text-primary-700]="playVariant() === v"
        (click)="playVariant.set(v)"
      >{{ v }}</button>
    }
  </div>
</div>
```

The control group row uses `flex flex-wrap gap-4 mb-6`. The `!bg-primary-100` / `!text-primary-700` pair on the active state is the canonical "selected toggle" styling — do not invent a new one.

---

## 6. API Page — `{name}-api.component.ts`

The API page is **pure reference**. No live demos, no prose paragraphs. It is a series of tables, one per public class, plus a final `Types` section.

### 6.1 Section per public class

Every exported component, directive, and service gets its own `<section class="mb-10">`:

- `<h2 class="text-sm font-semibold mb-3">{ClassName}</h2>` — the exact exported symbol (`ButtonDirective`, `SelectComponent`, `ButtonIconDirective`, `CardHeaderDirective`).
- Selector line immediately below: `<p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twButton]</p>` (use `tw-something` for element selectors, `[twSomething]` for attribute selectors).
- One subtable per member group present on the class, in this order:
  1. **Inputs** — columns: `Name | Type | Default | Description`
  2. **Outputs** — columns: `Name | Type | Description` (no default)
  3. **Methods** — columns: `Name | Signature | Description` (only for public service/directive methods)

Omit subtables that don't apply (e.g., a directive with no outputs).

### 6.2 Table skeleton

```html
<h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
<div class="overflow-x-auto border border-border rounded-lg mb-6">
  <table class="w-full text-sm">
    <thead>
      <tr class="bg-surface-muted text-left">
        <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
        <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
        <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
        <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
      </tr>
    </thead>
    <tbody class="divide-y divide-border-muted">
      <tr>
        <td class="px-4 py-2 font-mono text-xs">variant</td>
        <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid' | 'outline' | 'ghost' | 'soft' | 'link'</td>
        <td class="px-4 py-2 font-mono text-xs text-fg-muted">'solid'</td>
        <td class="px-4 py-2 text-fg-muted">Controls the visual style of the button.</td>
      </tr>
    </tbody>
  </table>
</div>
```

Rules:
- Name, Type, and Default cells are `font-mono text-xs`. Description cell is not monospace.
- Type cell gets `text-fg-muted`; Name cell is high-contrast (`text-fg`, inherited).
- String literals in Type/Default are single-quoted.
- Description: **one sentence, ending in a period**. Mirror the JSDoc line. Do not repeat the type in the description.

### 6.3 Child-directive / slot tables

For multi-part components with projected directives (Card's `CardHeaderDirective`, Select's template directives, Form Field's `LabelDirective`), add a dedicated `<section>` per directive, **or** a single table with columns `Directive | Selector | Description` if there are 4+ sibling slots to list compactly. Pick one style per page.

### 6.4 Types section (always last)

The final section is named `Types`, no `mb-10`, rendered as a single sunken code block:

```html
<section>
  <h2 class="text-sm font-semibold mb-3">Types</h2>
  <div class="bg-surface-sunken border border-border rounded-lg p-4">
    <pre class="text-sm font-mono whitespace-pre text-fg"><code>type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';

type TwColor = 'primary' | 'secondary' | 'accent' | 'neutral'
             | 'info' | 'success' | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';</code></pre>
  </div>
</section>
```

Include every type exported from the component's entry point that appears in any table above. Do not include `TwColor` / `TwSize` definitions verbatim on every page once the reader has seen them — reference them by name in tables, and define them here only if the component adds new constraints.

---

## 7. Tokens & Class Cheatsheet

These class strings must match **exactly** when you use them. Copy from here, don't retype.

| Use | Class string |
|---|---|
| Page container | `mx-auto max-w-4xl px-6 py-12` |
| Section block | `mb-10` (omit on last section of a page) |
| Section H2 | `text-sm font-semibold mb-3` |
| Subsection H3 (API tables) | `text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2` |
| Sub-group label (grouped demos) | `text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide` |
| Playground control label | `block text-xs font-medium text-fg-muted mb-1` |
| Demo surface | `rounded-lg border border-border p-6 bg-surface-raised` |
| Demo inner preview (playground) | `p-8 rounded-lg bg-surface-sunken` |
| Code block (outer) | `bg-surface-sunken border border-border rounded-lg p-4` |
| Code block (inner `<pre>`) | `text-sm font-mono whitespace-pre text-fg` |
| Inline code | `font-mono text-xs bg-surface-muted px-1 py-0.5 rounded` |
| Body text / paragraphs | `text-sm text-fg-muted leading-relaxed max-w-2xl` |
| Metadata / value readout | `text-xs text-fg-muted mt-4 font-mono` |
| Horizontal demo row | `flex flex-wrap items-center gap-3` |
| Small action row | `flex gap-2` |
| Vertical demo stack | `space-y-4` |
| Grid demo | `grid grid-cols-2 md:grid-cols-4 gap-4` |
| Active toggle-button overrides | `!bg-primary-100 !text-primary-700` |

All structural colors must come from semantic tokens (`surface`, `surface-raised`, `surface-sunken`, `surface-muted`, `border`, `border-muted`, `fg`, `fg-muted`, `fg-subtle`). The only raw-color exception is the header icon chip, which is always `bg-primary-50 text-primary-600`.

---

## 8. Authoring Checklist

When **creating** a new page:

- [ ] Folder and 5 files match § 1 naming
- [ ] `{name}.routes.ts` is a copy of § 2 with only the tokens changed
- [ ] Page shell uses the **canonical** `tw-item` + `twTabNav` form (§ 3)
- [ ] Header icon uses the 20×20 viewBox, `currentColor`, `aria-hidden="true"`
- [ ] Overview has the four sections in the right order: Description, Basic Usage, Import, Key Features (§ 4)
- [ ] Overview escapes `{{` / `}}` inside code blocks
- [ ] Examples covers every applicable axis in § 5.1 order and ends with a Playground
- [ ] Form controls include all three form sections (template / reactive / signal)
- [ ] No `<pre>` code blocks on the examples page — demos only
- [ ] API page has one section per exported class, tables in the right order, and a `Types` section at the end
- [ ] Every cell in an API description column is **one sentence, ending in a period**
- [ ] No raw Tailwind palette colors (`blue-*`, `red-*`, `neutral-*`) outside the header chip
- [ ] Iteration arrays (`VARIANTS`, `COLORS`, `SIZES`) are hoisted to module scope and typed from `ngx-tw/core`
- [ ] Every `class`, `changeDetection`, and `imports` follows the component rules in CLAUDE.md

When **refactoring** a legacy page:

- [ ] Migrate the shell to the canonical `tw-item` + `twTabNav` form
- [ ] Keep the same header icon — only rewire it through `twItemLeading`
- [ ] Verify the Overview section order and rename any section that drifted
- [ ] Move any stray `<pre>` blocks out of the Examples page (either delete or move to Overview's Basic Usage)
- [ ] Tighten API description cells to one-sentence-with-period form
- [ ] Replace any `text-neutral-*` / `bg-neutral-*` / hard-coded palette colors with semantic tokens
- [ ] Hoist any inline iteration arrays to module-scope `const`s typed from `ngx-tw/core`
