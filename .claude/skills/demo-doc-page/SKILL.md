---
name: demo-doc-page
description: Use when creating, editing, or refactoring any documentation page under projects/demo/src/app/routes/ — including scaffolding a new component's docs folder (routes/overview/examples/api), modifying an existing overview/examples/api page, porting a legacy page shell to the canonical tw-item + twTabNav form, or wiring a new route into the demo app. Trigger this whenever the user says "doc page", "demo page", "document the X component", "add a page for X", "refactor the Y page", mentions ngx-tw, or edits any file under projects/demo/src/app/routes/. Prefer this skill over ad-hoc formatting even if the user doesn't explicitly ask for the "convention" — the rules here are how the demo app stays consistent.
---

# Demo Documentation Page

How every component's documentation page under `projects/demo/src/app/routes/` is structured. The goal: every route looks, scrolls, and reads the same; only the component being documented changes.

## First: two passes before writing anything

### Pass 1 — Scan the library inventory

Find the library source root. It's typically `projects/ngx-tw/` — confirm by running `ls projects/` and looking for the package that isn't `demo`. Inside, list the public entry points (each is a folder with its own `public-api.ts` or `index.ts`).

The inventory you collect here feeds three things:

- **Components available for use inside demos.** A `Select` example can legitimately use a `Button` trigger; a `FormField` example composes `Label`, `Input`, and error directives. Rich examples are more informative than isolated ones.
- **Related-components cross-references** in the Overview.
- **Library utilities this skill depends on** — confirm that `tw-item`, `tw-tab-nav`, and `tw-code-block` exist at the expected entry points. If any is missing or renamed, stop and flag it before using this skill's templates.

Keep the inventory visible (a short note in your working memory or scratch file) for the rest of the task.

**While you're here, also check `<available_skills>` for `frontend-design`.** Note whether it's present — it will be consulted conditionally later when composing demo interiors for components that need realistic context. See the "Design sensibility" section below for scope and rules.

### Pass 2 — Read the canonical reference

Read `projects/demo/src/app/routes/select/` end-to-end. It is the source of truth for structure, class strings, and tone. If this skill and the canonical reference disagree, the reference wins — flag the disagreement so the skill can be updated.

If `routes/select/` is no longer the canonical reference, ask the user which component plays that role, then read it.

> **Note on code snippets in this skill.** Throughout the skill, inline templates use `Button` / `button` / `ButtonPage` as an illustrative placeholder because it's a simple component with a clean variants/colors/sizes axis — easier to read at a glance than the canonical `Select` snippets would be. The snippets teach the pattern, not the canonical component. Always prefer the real `routes/select/` over the snippets in this skill when they disagree.

## Normative language

- **MUST** / **MUST NOT** — hard rule, no exceptions.
- **SHOULD** / **SHOULD NOT** — strong default, deviate only with a reason worth writing down.
- **MAY** — permitted variant.

---

## Code blocks: use `tw-code-block`

All code samples on every doc page — Overview's Basic Usage and Import, Examples' paired snippets, API's Types section — render through the library's `tw-code-block` component. **Do not** use raw `<pre>` + sunken-div wrappers.

### Before first use, verify the API

Read `tw-code-block`'s source (locate the folder via the inventory pass, e.g., `projects/ngx-tw/code-block/`) to confirm:

- Is code passed via **content projection** (`<tw-code-block>…</tw-code-block>`) or via **input binding** (`[code]="..."`)?
- What input controls the language hint (`language`, `lang`, or something else)?
- Are there other inputs (line numbers, copy button, filename label)?

What follows are the two patterns you're most likely to see. Pick the one that matches the real component and update any template you copy from later in this skill.

### Pattern A — Content projection

```html
<tw-code-block language="html">
  &lt;button twButton variant="solid"&gt;Click&lt;/button&gt;
</tw-code-block>
```

Content inside the tags **is parsed by Angular**. That means:

- Literal `{` / `}` **MUST** be escaped with `{{ '{' }}` / `{{ '}' }}`.
- `<` / `>` become `&lt;` / `&gt;`.
- `@for`, `@if`, and other control-flow blocks inside the code need their braces escaped the same way.

Use content projection for short snippets (≤ 5 lines, few braces).

### Pattern B — Input binding

```ts
// in the component class
protected readonly variantSnippet = `
@for (v of variants; track v) {
  <button twButton [variant]="v">{{ v }}</button>
}`.trim();
```

```html
<tw-code-block [code]="variantSnippet" language="html" />
```

The string lives on the component class as a plain template literal. **No Angular parsing** of its contents — braces and angles stay literal. Name snippet fields with the pattern `{section}Snippet` (`variantSnippet`, `basicUsageSnippet`, `importSnippet`).

**Prefer Pattern B** when any of these are true:

- The snippet is more than 5 lines.
- The snippet contains `@for`, `@if`, `@switch`, or interpolation syntax.
- The snippet contains multiple `{` / `}` characters.

Pattern A is fine for the rare case where a one-liner is clearer inline.

### Language values

Use `html` for templates, `ts` for TypeScript, `css` for stylesheets, `bash` for shell. Match whatever the real component accepts — verify via the source pass above.

---

## Design sensibility: the `frontend-design` skill (optional supplement)

If the `frontend-design` skill is listed in `<available_skills>`, it **MAY** be consulted as a supplement when composing **demo interiors** — the content inside `rounded-lg border border-border p-6 bg-surface-raised` surfaces. This is narrowly scoped. `frontend-design` is **NOT** for the outer page, the page shell, code blocks, API tables, explanatory prose, or any class strings. Those stay under demo-doc-page's rules unconditionally.

### When to consult it

Read `frontend-design` before composing demo content for components whose value depends on realistic context:

- **Layout/container:** `Card`, `Modal`, `Dialog`, `Drawer`, `Sheet`, `Accordion`, `Popover` (with rich content), `Collapsible`.
- **Data-dense:** `Table`, `DataGrid`, `Stats`, `List` (with realistic rows), `Timeline`.
- **Notification:** `Toast`, `Alert`, `Notification`, `Banner`.
- **Composite form examples:** whenever a Form Field, Input, or Select demo shows a full form rather than a single control in isolation.
- **Complex Playgrounds:** any Playground with 5 or more control groups, where the control layout itself benefits from visual grouping.

Do **NOT** consult it for components that show themselves: `Button`, `Input`, `Checkbox`, `Radio`, `Switch`, `Slider`, `Divider`, `Spinner`, `Badge`, `Avatar`, `Tooltip`, `Progress`, `Skeleton`, and similar primitives. There's no narrative to design.

### Overrides

When you do consult `frontend-design`, take **only** its guidance on composition, hierarchy, realism, and content quality. Explicitly override these parts of its advice:

- **Typography.** Ignore its fonts-to-use / fonts-to-avoid guidance. Demo interiors use the library's default font family via its tokens. Do **NOT** introduce custom fonts, Google Fonts imports, `@font-face` declarations, or `font-family` overrides.
- **Color.** Ignore its "dominant colors with sharp accents" framing. Demo interiors use the library's semantic tokens (`text-fg`, `text-fg-muted`, `bg-surface-*`, `border-*`, plus library component colors like `color="primary"`). Do **NOT** introduce raw Tailwind palette colors (`blue-500`, `purple-*`, etc.) anywhere.
- **Bold aesthetic direction.** Ignore "brutalist / maximalist / retro-futuristic / editorial" framing. Demo interiors should look at home inside the library's design system, not pick a fighting aesthetic. The docs app's identity is uniform; the demo's job is to represent the component, not to be memorable on its own terms.
- **Motion.** Use only the component's own animations and library-provided motion. Do **NOT** add bespoke CSS animations, scroll triggers, or hover effects that aren't part of the component being demonstrated.

What you keep from `frontend-design`: realistic content over placeholder text; thoughtful visual hierarchy inside the demo; sensible spacing rhythm; meaningful imagery when it belongs (with concrete suggestions — avatars, product shots, chart data); the general principle of "design for the use case, not a generic shell."

### If the skill is not available

Proceed without it. The demo still needs realistic content — use your own judgment for composition. The trigger list above is still useful as a reminder that these components deserve richer demos than primitives.

---

## 1. File layout

Every route is a folder named after the component's kebab-case token, with five files:

```
projects/demo/src/app/routes/{name}/
├── {name}.routes.ts
├── {name}-page.component.ts
├── overview/{name}-overview.component.ts
├── examples/{name}-examples.component.ts
└── api/{name}-api.component.ts
```

Rules:

- Folder name and file prefix **MUST** use the same kebab-case token.
- Page-class names **MUST** be PascalCase with no suffix: `ButtonPage`, `ButtonOverview`, `ButtonExamples`, `ButtonApi`. (This is for *page* classes only — library classes keep their suffixes like `ButtonDirective`.)
- Selectors **MUST** use the `app-` prefix: `app-button-page`, `app-button-overview`, etc.
- Every component **MUST** be standalone, `ChangeDetectionStrategy.OnPush`, and use an inline `template:`.

---

## 2. Routes file — `{name}.routes.ts`

Copy the shape below. Only the three tokens (`Button`, `button`, `BUTTON`) change.

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

**MUST NOT** rename the three children, reorder them, drop the `redirectTo`, or eagerly import subpages.

After creating `{NAME}_ROUTES`, wire it into the parent demo router with a `loadChildren` entry. Verify this by grepping the existing router for how another component is wired, then matching that shape.

---

## 3. Page shell — `{name}-page.component.ts`

Container + header + tab nav + outlet. Use the canonical dogfooded form below. If you encounter the legacy hand-rolled form (inline `<div>` header + inline `<nav>`), migrate it to this form while you're in the file.

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
        <div twItemLeading class="flex size-10 items-center justify-center rounded-lg bg-primary-50 text-primary-600">
          <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <!-- 20×20 heroicons-mini single <path> — replace with real icon -->
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

### Shell rules

- **Container:** exactly `mx-auto max-w-4xl px-6 py-12`. Do not change max width or padding.
- **`tw-item` alignment:** leading-aligned only. **MUST NOT** set `align="center"`, `[align]="'center'"`, or any centering class (`text-center`, `items-center` on the `tw-item` element itself, `justify-center`, etc.) on `<tw-item>`. The library default places the icon on the leading side with left-aligned title and description — that is the intended header layout for every doc page. If the rendered header looks off and the instinct is to center it, the fix is almost certainly elsewhere (icon size, spacing, or description length), not alignment.
- **Header icon:** 20×20 viewBox, `fill="currentColor"`, `aria-hidden="true"`. Container is `size-10 rounded-lg bg-primary-50 text-primary-600`. **Always primary tint**, regardless of the component's own color.
- **Title:** plain component name in title case (`Button`, `Form Field`, `Date Picker`). No library prefix.
- **Description:** **one sentence**, present tense, ends in a period. Says what the component is/does, not how. Mirror the one-line JSDoc summary from the library.
- **Tab nav:** exactly three tabs in order: Overview, Examples, API. `aria-label` follows `"{Name} documentation tabs"`.
- **Outlet:** `<router-outlet />` (self-closing, Angular v18+ syntax).
- The `#o="routerLinkActive"` pattern exposes the `RouterLinkActive` directive as a template ref so `[active]` on `twTabLink` can read `.isActive`. Keep it.

---

## 4. Overview page — `{name}-overview.component.ts`

The Overview has **four required sections** in this exact order:

1. Description
2. Basic Usage
3. Import
4. Key Features

It **MAY** also include these optional sections, inserted in this order between the required ones as marked:

- **Accessibility** — after Description. Required when the component implements an ARIA pattern (combobox, listbox, dialog, menu, tabs, etc.). Covers keyboard shortcuts, roles, focus behavior. Use a small table: `Key | Action`.
- **When to use / When not to use** — after Description (or after Accessibility). Two short bulleted lists. Include for components with frequent misuse patterns (e.g., Modal vs. Popover vs. Tooltip).
- **Related components** — after Key Features. Inline links by route path.

### Shared structure

- Each section is a top-level `<section class="mb-10">` **except the last section on the page**, which omits `mb-10`.
- Section titles: `<h2 class="text-sm font-semibold mb-3">{Title}</h2>`.
- No wrapping outer container — the shell already provides width/padding.

### 4.1 Description

Single paragraph, 2–4 sentences. Explains what the component is, where it fits, and the ARIA pattern it implements (if relevant). Inline referenced component/directive names as inline code.

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Description</h2>
  <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
    The Button directive turns any element into a styled, accessible button...
  </p>
</section>
```

### 4.2 Basic Usage

One **scenario**: one live demo, one code block. "Scenario" means the minimum working configuration — for `FormField` that's label + control + error together; for `Button` it's a single button. Not a matrix, not multiple variants. The code block uses `tw-code-block` (see intro "Code blocks: use `tw-code-block`" above).

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
  <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
    <!-- minimal live demo -->
  </div>
  <tw-code-block [code]="basicUsageSnippet" language="html" />
</section>
```

With the snippet on the class:

```ts
protected readonly basicUsageSnippet = `<button twButton variant="solid">Click me</button>`;
```

### 4.3 Import

One code block, no surrounding prose. Use `tw-code-block` with a string on the class — that way the `import { X } from '...'` braces need no escaping. Multiple imports are fine if the component's minimal usage needs them.

```ts
protected readonly importSnippet = `import { ButtonDirective } from 'ngx-tw/button';`;
```

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Import</h2>
  <tw-code-block [code]="importSnippet" language="ts" />
</section>
```

### 4.4 Key Features

A bulleted list, 6–12 short items. Each line starts with a capital letter; no trailing period unless the line is a full sentence. Inline code for identifiers.

```html
<section>
  <h2 class="text-sm font-semibold mb-3">Key Features</h2>
  <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
    <li>5 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>, ...</li>
  </ul>
</section>
```

---

## 5. Examples page — `{name}-examples.component.ts`

A sequence of `<section class="mb-10">` blocks, one per meaningful axis, ending in a Playground.

### 5.1 Section canon

Include these when they apply; omit when they don't. Don't invent new names for the same axis.

| Order | Section title           | When to include |
|-------|-------------------------|-----------------|
| 1     | `Variants`              | Component has a `variant` input |
| 2     | `Colors`                | Component has a `color` input (`TwColor`) |
| 3     | `Sizes`                 | Component has a `size` input (`TwSize`) |
| 4     | `With Icons`            | Supports leading/trailing icon slots |
| 5     | `Anchor Elements`       | Directive that attaches to `<a>` as well as `<button>` |
| 6     | `States`                | Multi-state: `disabled`, `loading`, `readonly`, `invalid`, etc. |
| 7     | `Template-Driven Forms` | Form control — include a `[(ngModel)]` demo |
| 8     | `Reactive Forms`        | Form control — include a `[formControl]` demo |
| 9     | `Signal Forms`          | Form control — include a `[formField]` demo (`form()` from v21) |
| 10    | Custom slots…           | One section per structural-directive slot |
| 11    | `Playground`            | **Always last** |

Form-control components **MUST** include all three form sections (7/8/9) to prove CVA compatibility (see CLAUDE.md § Form Compatibility).

### 5.2 Axis-free components

If the component has no variant/color/size axis (e.g., `Divider`, `Spinner`), the Examples page is still required and **MUST** contain at least:

- One Basic Usage–style demo section named after the component's most meaningful dimension (for `Spinner`: `Sizes`; for `Divider`: `Orientation`).
- A Playground (even if it only toggles one or two inputs).

### 5.3 Section skeleton

Each example section is a **four-part structure**: intro paragraph, live demo, code snippet, and optional follow-up. The Examples page teaches; it doesn't just display. A reader should leave each section knowing what the axis controls, when to reach for which option, and any gotcha worth knowing.

```html
<section class="mb-10">
  <h2 class="text-sm font-semibold mb-3">Variants</h2>

  <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
    Variants change the button's visual weight without changing its meaning. Use
    <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
    for primary calls to action, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
    or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
    for secondary actions, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
    for low-emphasis toolbar buttons, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">link</code>
    when the action reads more like navigation than a command.
  </p>

  <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
    <div class="flex flex-wrap items-center gap-3">
      @for (v of variants; track v) {
      <button twButton [variant]="v">{{ v }}</button>
      }
    </div>
  </div>

  <tw-code-block [code]="variantsSnippet" language="html" />

  <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
    Variants compose with colors — a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
    error button and an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
    error button both read as destructive but differ in emphasis.
  </p>
</section>
```

With the snippet on the class:

```ts
protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <button twButton [variant]="v">{{ v }}</button>
}`.trim();
```

### 5.4 Explanatory prose

**Intro paragraph (required).** One top-level `<p>` immediately after the H2, before the demo surface. Two to four sentences that:

- Name what the axis controls (the input, the visual property, the interaction).
- Explain *when to use which option* — not just what the options are. The section title already named the axis; the intro earns its keep by giving decision guidance.
- Reference related concepts by inline code.

Do not restate the section title. "Variants control the button's variant" is dead weight. Aim for substance: "Variants change the button's visual weight without changing its meaning."

**Follow-up paragraph (optional).** One `<p>` after the code block, 1–3 sentences. Use it for:

- A gotcha (e.g., "Outline on a colored background inherits the text color; set `color` explicitly if that's not what you want").
- An accessibility note (e.g., "Icon-only buttons require `aria-label`").
- An interaction with another input (e.g., "The `loading` state overrides `disabled` visually but keeps focus management identical").
- A pointer to a related section on the same page ("See Anchor Elements for attaching this to an `<a>`").

Skip the follow-up when there's nothing substantive to add. A missing follow-up is better than a filler one.

**Styling.** Both paragraphs use the body-text style: `<p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">` for intros and `<p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">` for follow-ups. Inline code uses the cheatsheet pattern.

### 5.5 Demo + code rules

- **Demo surface:** `rounded-lg border border-border p-6 bg-surface-raised mb-4` (the `mb-4` separates demo from code).
- **Code block:** `<tw-code-block [code]="{section}Snippet" language="html" />`. Use Pattern B (input binding) by default — see the intro "Code blocks" section for when Pattern A is OK.
- **Horizontal row of samples:** `flex flex-wrap items-center gap-3`.
- **Grouped samples with sub-labels:** outer `space-y-4`; each group gets `<p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{label}</p>` above its row.
- **Grid:** `grid grid-cols-2 md:grid-cols-4 gap-4`.
- **Metadata / value readout:** `<p class="text-xs text-fg-muted mt-4 font-mono">`.
- **Design sensibility (conditional action).** If the component being documented is on the "Design sensibility" trigger list and `frontend-design` is available, **read its SKILL.md now** before composing the content inside the demo surface. Apply only its composition/realism guidance; apply the typography/color/aesthetic overrides from the intro section. For all other components, compose the demo with your own judgment — the uniform library tokens are the only styling you need.

### 5.6 What goes in the code snippet

Show the code that **literally produces the demo above it**, not a generalized or simplified version. If the demo uses `@for` over a constants array, the snippet includes the `@for`. Readers can generalize; they cannot un-simplify.

- **Template-only demos:** one snippet, `language="html"`.
- **Demos with logic** (forms, stateful examples, custom template slots): two snippets, TypeScript first, template second. Render as two `tw-code-block` elements stacked with `<div class="space-y-3">` around them, or with `mt-3` on the second. Name the fields `{section}TsSnippet` and `{section}HtmlSnippet`.
- **Imports needed to run the snippet** (e.g., `ReactiveFormsModule`): omit them. The Overview's Import section covers imports; repeating them here is noise.

### 5.7 When a section has multiple grouped demos

Some sections (like `States`) show several sub-groupings (disabled, loading, readonly). Two acceptable shapes:

- **One demo, one snippet:** combine all states into a single demo surface using sub-group labels (§ 5.5), then one snippet showing the composite template.
- **One quartet per sub-group:** each sub-group gets its own intro / demo / snippet / follow-up quartet, stacked with `space-y-8` on a wrapper inside the section. Use this when the code for each state is materially different or when each state needs its own decision guidance.

Pick one shape per section. Don't mix.

### 5.8 Shared constants

Hoist `VARIANTS`, `COLORS`, `SIZES` to module scope as typed `readonly` constants. Reference them from `protected readonly` fields. **Never** hard-code `['solid', 'outline', ...]` in the template.

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

Iterate with `@for (x of xs; track x)`.

### 5.9 Playground

Every Examples page ends with a Playground. **The Playground is exempt from the code-snippet rule** — its output changes with every control, so a static snippet would be meaningless. Show an intro paragraph, then the live demo with its controls.

The Playground **MUST**:

- Start with an intro paragraph using the § 5.4 style, explaining that this section lets the reader combine every input at once and pointing out any useful starting configurations. 2–3 sentences.
- Live inside the standard demo surface (no `mb-4`, since no code block follows).
- Expose a control group for every meaningful user-facing input — not a fixed triad. Components without variants simply don't get a Variant control.
- Render the live component inside a sunken inner box: `p-8 rounded-lg bg-surface-sunken` (or `p-6` for wider components).
- Drive controls from component signals named `playVariant`, `playColor`, `playSize`, `playMultiple`, etc.

The control row uses `flex flex-wrap gap-4 mb-6`. The canonical selected-toggle styling is `!bg-primary-100 !text-primary-700` — do not invent a new one.

**If the Playground has 5 or more control groups** and `frontend-design` is available, **read its SKILL.md now** before laying out the controls — it can help with visual grouping (dividing controls into logical clusters, ordering them from most- to least-used, using headings or subtle dividers within the control region). The typography / color / bold-aesthetic overrides from the "Design sensibility" section still apply: library tokens only, no custom fonts.

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

---

## 6. API page — `{name}-api.component.ts`

Pure reference. No live demos, no prose paragraphs. One section per exported class, plus a final `Types` section.

### 6.1 Section per public symbol

Every exported component, directive, service, pipe, or injection token gets a `<section class="mb-10">`:

- `<h2 class="text-sm font-semibold mb-3">{ExportedSymbol}</h2>` — the exact exported name.
- Selector/info line immediately below: `<p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twButton]</p>` for components/directives. For services: `Provided in: root` (or the scope). For injection tokens: `Token: BUTTON_DEFAULTS` and a one-line shape hint.

Subtables in this order; omit any that don't apply:

1. **Inputs** — `Name | Type | Default | Description`
2. **Outputs** — `Name | Type | Description` (no default; Type should include the event payload, e.g., `EventEmitter<SelectionChange>`)
3. **Methods** — `Name | Signature | Description` (for public service/directive methods)
4. **Slots** (for components with projected directives) — `Selector | Required | Cardinality | Description`. Use this when there are 2+ projection slots; one slot can stay as a dedicated section per directive.

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

- Name, Type, Default cells are `font-mono text-xs`. Description cell is not monospace.
- Type cell gets `text-fg-muted`; Name cell inherits `text-fg`.
- String literals in Type/Default are single-quoted.
- **Description: one sentence, ending in a period.** Mirror the JSDoc line. Do not repeat the type in the description.

### 6.3 Deprecations & version notes

When an input/output/method is deprecated or was added in a specific version, append a suffixed badge to the Name cell, not the description:

```html
<td class="px-4 py-2 font-mono text-xs">
  legacyMode
  <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-50 text-warning-700">deprecated</span>
</td>
```

Versions use `bg-info-50 text-info-700` with the version string (`v3.2`).

### 6.4 Types section (always last)

```ts
protected readonly typesSnippet = `type ButtonVariant = 'solid' | 'outline' | 'ghost' | 'soft' | 'link';`;
```

```html
<section>
  <h2 class="text-sm font-semibold mb-3">Types</h2>
  <tw-code-block [code]="typesSnippet" language="ts" />
</section>
```

Include every type exported from the component's entry point that appears in any table above. `TwColor` and `TwSize` are library-global — reference them by name in tables but redefine them here only if the component narrows them.

---

## 7. Token & class cheatsheet

Copy these strings exactly. Do not retype.

| Use | Class string |
|---|---|
| Page container | `mx-auto max-w-4xl px-6 py-12` |
| Section block | `mb-10` (omit on last section of a page) |
| Section H2 | `text-sm font-semibold mb-3` |
| Subsection H3 (API tables) | `text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2` |
| Sub-group label (grouped demos) | `text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide` |
| Playground control label | `block text-xs font-medium text-fg-muted mb-1` |
| Demo surface | `rounded-lg border border-border p-6 bg-surface-raised` |
| Playground inner preview | `p-8 rounded-lg bg-surface-sunken` |
| Code block | `<tw-code-block [code]="..." language="..." />` — the component owns its own styling |
| Inline code | `font-mono text-xs bg-surface-muted px-1 py-0.5 rounded` |
| Body text / explanatory prose | `text-sm text-fg-muted leading-relaxed max-w-2xl` |
| Metadata readout | `text-xs text-fg-muted mt-4 font-mono` |
| Horizontal demo row | `flex flex-wrap items-center gap-3` |
| Small action row | `flex gap-2` |
| Vertical demo stack | `space-y-4` |
| Grid demo | `grid grid-cols-2 md:grid-cols-4 gap-4` |
| Active toggle-button | `!bg-primary-100 !text-primary-700` |
| Deprecation badge | `bg-warning-50 text-warning-700` |
| Version badge | `bg-info-50 text-info-700` |

### Color rules

- Structural colors **MUST** come from semantic tokens: `surface`, `surface-raised`, `surface-sunken`, `surface-muted`, `border`, `border-muted`, `fg`, `fg-muted`, `fg-subtle`.
- Raw Tailwind palette colors (`blue-500`, `red-100`, `neutral-900`) are **forbidden** outside the single exception below.
- **Exception:** the header icon chip is always `bg-primary-50 text-primary-600`, and the deprecation/version badges use `warning-*` / `info-*` palette.
- All tokens are dark-mode-aware. **Do not** add `dark:` variants manually.

### Cross-references

Reference other components inline by their route path: `<a routerLink="/button" class="text-primary-600 hover:underline">Button</a>`. Don't link arbitrary words in prose to tangentially related pages.

---

## 8. Workflow

### Shared orientation (do this before the new-page or refactor steps)

1. **Inventory pass.** Run `ls projects/` to find the library root, then list its entry-point folders. Note what components exist — some will be used inside your examples, others will be cross-referenced in Related components. Also check `<available_skills>` for `frontend-design` and note whether it's present.
2. **Confirm `tw-code-block`'s API** by reading its source. Update the snippet pattern (content projection vs. input binding) if it differs from this skill's assumptions.
3. **Read `routes/select/`** (or the designated canonical reference) end-to-end.
4. **Design sensibility gate.** Stop and answer two questions explicitly before proceeding:
  - Is the component being documented on the "Design sensibility" trigger list (Card, Modal, Dialog, Drawer, Sheet, Accordion, Popover with rich content, Table, DataGrid, Stats, List, Timeline, Toast, Alert, Notification, Banner, composite form examples, or any Playground with 5+ controls)?
  - Is `frontend-design` in `<available_skills>` (from step 1)?

   If **both answers are yes**, reading `frontend-design`'s SKILL.md is the next action — do it now, before creating or editing any demo content. Apply its composition/realism guidance only; the typography, color, and aesthetic-direction overrides in the "Design sensibility" intro section are **non-negotiable**. In your end-of-turn summary, note that you consulted `frontend-design` and why.

   If either answer is no, skip to the next step silently. Do **not** surface the skip in your end-of-turn summary — "Button is not on the trigger list" is noise, not signal. The gate is still a required decision point (you must actually answer both questions before proceeding), but the user only needs to hear about it when the answer leads to action.

### When **creating a new page**

After the shared orientation above:

1. Create the five files per § 1.
2. Copy the routes shape from § 2; change only the three tokens.
3. Copy the shell from § 3; replace icon, title, description.
4. Write Overview per § 4 — required four sections, plus any applicable optional ones.
5. Write Examples per § 5 — every applicable axis in the canonical order, each with intro paragraph + demo + snippet + optional follow-up, ending in Playground. If the design-sensibility gate fired, apply the `frontend-design` guidance you loaded during orientation as you compose each demo interior.
6. Write API per § 6 — one section per exported symbol, Types section last.
7. Wire `{NAME}_ROUTES` into the parent demo router (grep for how another component is wired).
8. Run through the checklist below.

### When **refactoring an existing page**

After the shared orientation above:

1. Migrate the shell to the canonical `tw-item` + `twTabNav` form (§ 3).
2. Keep the same header icon — rewire it through `twItemLeading`.
3. Verify Overview section order; rename any section that drifted; add Accessibility if the component has an ARIA pattern and it's missing.
4. Replace any raw `<pre>` + sunken-div code blocks with `<tw-code-block>` — on every page (Overview, Examples, API Types).
5. Ensure every Examples section has an intro paragraph (§ 5.4) and a code snippet paired with its demo (§ 5.3). Add whichever is missing. The Playground still needs an intro but no snippet (§ 5.9). **If the design-sensibility gate fired during orientation**, this step also audits each demo interior against the `frontend-design` guidance you loaded: for every demo, decide *keep* (already realistic), *rewrite* (generic placeholder, empty box, lorem ipsum), or *enrich* (correct but bare). Report which demos you changed and why.
6. Tighten every API description cell to one-sentence-with-period form.
7. Replace raw palette colors (`text-neutral-*`, `bg-neutral-*`, etc.) with semantic tokens.
8. Hoist any inline iteration arrays to module-scope `const`s typed from `ngx-tw/core`.

The design-sensibility gate applies the same way to refactors as to new pages — the gate is the component type, not the task type. A boring Card demo doesn't stop being boring because the task label says "refactor."

If you want a structural-only refactor on a trigger-list component (explicitly leaving demo content alone), say so in the prompt ("refactor the Card page's structure only; leave demo content alone"). The skill will then skip step 5's audit but still apply every other refactor step.

---

## 9. Checklist

New page:

- [ ] Inventory pass done; `tw-code-block` API confirmed; `frontend-design` availability noted
- [ ] **Design sensibility gate resolved:** explicitly decided whether to read `frontend-design` (based on trigger list × availability); if yes, read before composing any demo content. Skips are silent — don't mention the gate in the summary unless it fired.
- [ ] Folder and 5 files match § 1 naming
- [ ] `{name}.routes.ts` matches § 2 with only the three tokens changed
- [ ] Routes wired into the parent demo router
- [ ] Shell uses the canonical `tw-item` + `twTabNav` form (§ 3)
- [ ] `tw-item` is leading-aligned — no `align="center"`, no centering classes anywhere on the header
- [ ] Header icon: 20×20 viewBox, `currentColor`, `aria-hidden="true"`
- [ ] Overview has the four required sections in the right order (§ 4)
- [ ] Accessibility section present if the component has an ARIA pattern
- [ ] All code samples use `tw-code-block`; no raw `<pre>` wrappers anywhere
- [ ] Examples covers every applicable axis in § 5.1 order and ends with a Playground
- [ ] Form controls include all three form sections (template / reactive / signal)
- [ ] Each Examples section (except Playground) has an intro paragraph, a demo, and a paired code snippet
- [ ] For components on the "Design sensibility" trigger list (Card, Modal, Table, composite forms, etc.): demo interiors show realistic content, not placeholders; typography/color overrides applied
- [ ] Playground has an intro paragraph (§ 5.9)
- [ ] API page has one section per exported symbol; subtables in order; Types section last
- [ ] Every API description cell is one sentence, ending in a period
- [ ] Deprecated / version-tagged members use the badge pattern (§ 6.3)
- [ ] No raw palette colors outside header chip and status badges
- [ ] `VARIANTS` / `COLORS` / `SIZES` hoisted to module scope, typed from `ngx-tw/core`
- [ ] Every component standalone, `OnPush`, inline `template:`

Refactor:

- [ ] Inventory pass done; `frontend-design` availability noted
- [ ] **Design sensibility gate resolved:** explicitly decided whether to read `frontend-design`; if yes, read before touching demo content. Skips are silent — don't mention the gate in the summary unless it fired.
- [ ] Shell migrated to canonical form
- [ ] `tw-item` is leading-aligned — strip any `align="center"` or centering classes from the migrated header
- [ ] Overview section order verified; drift renamed
- [ ] Raw `<pre>` code blocks replaced with `tw-code-block` on every page
- [ ] Each Examples section has an intro paragraph and a paired code snippet
- [ ] API descriptions tightened to one-sentence-with-period
- [ ] Palette colors replaced with semantic tokens
- [ ] Iteration arrays hoisted to module scope
- [ ] For trigger-list components where the gate fired: demo interiors audited; generic/placeholder demos rewritten or enriched; typography/color overrides applied
