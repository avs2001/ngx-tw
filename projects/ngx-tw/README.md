# ngx-tw

An Angular component library for applications built with **Tailwind CSS v4+**
and **Angular CDK**. The quality bar is [Angular Material](https://material.angular.io/)
— well-tested, accessible, composable — but styled with Tailwind utility classes
instead of Material Design tokens.

- **54 components** spanning forms, overlays, navigation, data display, layout,
  and feedback.
- **Standalone, signal-based APIs** — Angular v22 idioms throughout (no
  NgModules, `OnPush`, `input()` / `output()` / `model()`).
- **Accessible by default** — built on Angular CDK primitives (focus management,
  overlays, a11y, collections). Targets WCAG AA and is checked with AXE.
- **Tailwind v4 native** — no component CSS files; consumers control appearance
  through semantic design tokens.
- **Theme runtime included** — light / dark / high-contrast / system with a
  persisted `ThemeService`, or pure-CSS dark mode with no JS.
- **Tree-shakeable secondary entry points** — import only what you use.

> **Live demo & API reference:** <https://avs2001.github.io/ngx-tw/>

## Installation

```bash
npm install @cdevhub/ngx-tw @angular/cdk tailwindcss tailwind-variants
```

**Peer requirements**

| Package | Version |
|---|---|
| `@angular/core`, `@angular/common` | `^22.0.0` |
| `@angular/cdk` | `^22.0.0` |
| `tailwindcss` | `^4.0.0` |
| `tailwind-variants` | `^0.3.0` |

Form controls additionally use `@angular/forms` (ships with Angular). Node
`^22.22.3`, `^24.15.0`, or `>=26.0.0`.

## Setup

### 1. Import the default theme

Tailwind v4 has no JS config file — all customization happens in CSS. One
import is all that is needed:

```css
/* src/styles.css */
@import '@cdevhub/ngx-tw/theme/index.css';
```

That single line pulls in Tailwind itself, the semantic tokens, and a `@source`
directive pointing at the library's compiled bundles — the last one matters
because Tailwind v4 never scans `node_modules` on its own, so without it your
build would emit tokens but no component utilities. You do not need to add a
`@source` line yourself, and you do not need a separate `@import 'tailwindcss'`
(a duplicate is harmless if you already have one).

If you use any overlay-based component (dialog, sheet, menu, popover, select,
tooltip, combobox, date-picker, time-picker, command-palette), also import the
CDK overlay stylesheet:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```

The theme maps semantic roles (`info`, `success`, `warning`, `error`,
`primary`, `secondary`, `accent`, `neutral`) and structural tokens (`surface`,
`fg`, `border`) to Tailwind's palette, and ships **dark** and **high-contrast**
variants out of the box.

### 2. Register providers

A handful of subsystems are provider-based. Register the ones you use once, in
your application config:

```ts
// src/app/app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideTheme } from '@cdevhub/ngx-tw/theme';
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
import { provideTwLucideIcons } from '@cdevhub/ngx-tw/icon/lucide';
import { provideTwDialog } from '@cdevhub/ngx-tw/dialog';
import { provideSheet } from '@cdevhub/ngx-tw/sheet';
import { provideToast } from '@cdevhub/ngx-tw/toast';
import { Star, Search, Settings } from 'lucide';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTheme(),                              // applies + persists the theme
    provideNativeDateAdapter(),                  // calendar / date pickers
    provideTwLucideIcons({ Star, Search, Settings }), // register named icons
    provideTwDialog(),                           // tw-dialog overlay service
    provideSheet(),                              // side-sheet overlay service
    provideToast({ position: 'bottom-right', duration: 4000 }),
  ],
};
```

You only need the providers for the features you use:

| Provider | Required for | Entry point |
|---|---|---|
| `provideTheme()` | explicit / persisted theme switching and `ThemeService` (optional — pure-CSS dark mode needs none) | `@cdevhub/ngx-tw/theme` |
| `provideNativeDateAdapter()` | `calendar`, `date-picker`, `date-range-picker` | `@cdevhub/ngx-tw/calendar` |
| `provideTwLucideIcons()` / `provideTwIcons()` | `<tw-icon>` and any component that renders glyphs | `@cdevhub/ngx-tw/icon/lucide`, `@cdevhub/ngx-tw/icon` |
| `provideTwDialog()` | imperative dialogs via the `TwDialog` service | `@cdevhub/ngx-tw/dialog` |
| `provideSheet()` | imperative side sheets via the `Sheet` service | `@cdevhub/ngx-tw/sheet` |
| `provideToast()` | `ToastService` notifications | `@cdevhub/ngx-tw/toast` |

### 3. Use components

Import from the per-component entry points for the best tree-shaking:

```ts
import { Component } from '@angular/core';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { AlertComponent } from '@cdevhub/ngx-tw/alert';

@Component({
  selector: 'app-root',
  imports: [ButtonDirective, AlertComponent],
  template: `
    <button twButton color="primary">Save</button>
    <tw-alert color="success">Changes saved.</tw-alert>
  `,
})
export class AppComponent {}
```

## Theming

### Semantic tokens

Components never reference raw palette colors. They use **semantic roles** on a
50–950 scale (`bg-primary-500`, `text-error-800`) plus structural tokens
(`surface`, `surface-raised`, `fg`, `fg-muted`, `border`). Re-theme the whole
library — including dark mode and brand palettes — by overriding those tokens.

```css
@import '@cdevhub/ngx-tw/theme/index.css';

@theme {
  /* Re-brand primary to a custom indigo */
  --color-primary-500: oklch(0.55 0.2 260);
  --color-primary-600: oklch(0.48 0.2 260);

  /* Remap "info" onto the sky palette */
  --color-info-50: var(--color-sky-50);
  --color-info-500: var(--color-sky-500);
}
```

### Dark mode & runtime switching

Dark mode is driven by a `data-theme` attribute (with a `prefers-color-scheme`
fallback when no attribute is set), so the simplest setup needs **no
JavaScript** — the imported theme CSS already responds to the OS preference.

All three schemes ship as element-agnostic `[data-theme="…"]` blocks, so the
attribute works on `<html>` *and* on any element in the page — including
switching a subtree back to `light` inside a dark page.

For explicit, persisted switching, register `provideTheme()`:

```ts
import { provideTheme } from '@cdevhub/ngx-tw/theme';

bootstrapApplication(App, { providers: [provideTheme()] });
```

`provideTheme()` is self-sufficient: it constructs `ThemeService` at bootstrap,
so the stored preference is applied on first paint whether or not anything
injects the service. Inject it where you need to read or change the theme:

```ts
import { ThemeService } from '@cdevhub/ngx-tw/theme';

export class ThemeToggle {
  private readonly theme = inject(ThemeService);

  readonly current = this.theme.theme;          // 'light' | 'dark' | 'high-contrast' | 'system'
  readonly resolved = this.theme.resolvedTheme;  // never 'system'
  readonly isDark = this.theme.isDark;           // boolean signal

  toggle() {
    this.theme.cycleTheme();           // light → dark → high-contrast → system → …
  }

  dark() {
    this.theme.setTheme('dark');       // also: 'light' | 'high-contrast' | 'system'
  }
}
```

`ThemeService` writes the active theme to `data-theme` on `documentElement` and
tracks the OS preference — `prefers-color-scheme: dark` resolves `'system'` to
`dark`, and `prefers-contrast: more` resolves it to `high-contrast` when dark is
not also requested (the shipped high-contrast scheme is light-based, so contrast
never overrides a dark preference). Configure via `provideTheme({ defaultTheme,
storageKey, attribute, target })`.

**Storage is written only by `setTheme()` / `cycleTheme()`.** Providing the
service never touches `localStorage`, so `defaultTheme` keeps applying until the
user actually picks something, and apps under a storage-consent flow can
register the provider before consent is granted.

### Scoping a theme to a subtree

The `[twTheme]` directive writes `data-theme` on its host, and the token blocks
re-resolve there and cascade into the subtree — in any direction:

```html
<div [twTheme]="'light'" class="bg-surface text-fg p-4">
  Always light, even on a dark page.
</div>
```

Note the directive writes the literal `data-theme` attribute, which is what the
shipped CSS keys off. `provideTheme({ attribute })` renames the attribute
`ThemeService` writes to the document, but a renamed attribute needs matching
CSS of your own.

### Avoiding a theme flash on reload

The CSS fallback already gives a flash-free first paint to anyone who never
picked a theme. An **explicit** choice that disagrees with the OS is different:
`ThemeService` is application JavaScript, so the browser paints the OS-derived
theme before the bundle runs. Add the standard inline bootstrap to `index.html`
— it must be inline in `<head>`, before any stylesheet:

```html
<head>
  <script>try{var t=localStorage.getItem('ngx-tw-theme');if(t&&t!=='system')document.documentElement.setAttribute('data-theme',t)}catch(e){}</script>
</head>
```

The same string is exported as `TW_THEME_BOOTSTRAP_SCRIPT` for SSR or
`index.html`-transform setups, built from the same defaults `ThemeService` uses
so the key and attribute cannot drift:

```ts
import { TW_THEME_BOOTSTRAP_SCRIPT } from '@cdevhub/ngx-tw/theme';

const head = `<script>${TW_THEME_BOOTSTRAP_SCRIPT}</script>`;
```

A stored `'system'` deliberately writes nothing, so the CSS
`prefers-color-scheme` fallback keeps deciding. The snippet assumes the default
`target: 'documentElement'` — a `<head>` script runs before `<body>` exists — and
if you overrode `storageKey` or `attribute`, adapt the literal snippet to match.

## Icons

`<tw-icon>` uses a registry: a glyph renders only after its name is registered.
The Lucide adapter is the quickest path — register the icons you need at
bootstrap:

```ts
import { provideTwLucideIcons } from '@cdevhub/ngx-tw/icon/lucide';
import { Star, Search } from 'lucide';

// in providers:
provideTwLucideIcons({ Star, Search });
```

```html
<tw-icon name="Star" size="md" />
```

Bring your own SVGs with `provideTwIcons()` / `IconRegistry` from
`@cdevhub/ngx-tw/icon`.

## Date & time

The calendar and date pickers require a date adapter. The native adapter works
zero-config:

```ts
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
// providers: [ provideNativeDateAdapter() ]
```

A Luxon adapter is available from the `@cdevhub/ngx-tw/calendar/luxon`
sub-entry, and calendar test helpers from `@cdevhub/ngx-tw/calendar/testing`.
Calendar UI strings are localizable via `CalendarIntl` / `provideCalendarIntl`.

## Form controls

Interactive controls — `input`, `textarea`, `select`, `combobox`, `checkbox`,
`radio`, `switch`, `slider`, `date-picker`, `date-range-picker`, `time-picker` —
implement `ControlValueAccessor` and work with all three Angular form
strategies: template-driven, reactive, and signal forms. Pair them with
`tw-form-field` for labels, hints, and error messages.

## Components

54 components, each published as an independent secondary entry point
(`@cdevhub/ngx-tw/<name>`). See the [live demo](https://avs2001.github.io/ngx-tw/)
for full API tables and examples.

### Actions & inputs

| Component | Selector | Purpose |
|---|---|---|
| button | `[twButton]` | Multi-variant button (color / size / variant) |
| checkbox | `tw-checkbox` | Accessible checkbox control |
| radio | `tw-radio-group` / `tw-radio` | Single-choice radio group |
| switch | `tw-switch` | Boolean toggle |
| slider | `tw-slider` | Numeric range selector |
| input | `[twInput]` | Text input styling directive |
| textarea | `[twTextarea]` | Multi-line text input |
| select | `tw-select` | Single/multi dropdown select |
| combobox | `tw-combobox` | Autocomplete / filterable input |
| segmented-control | `tw-segmented-control` | Single-select button group |
| form-field | `tw-form-field` | Label / hint / error wrapper |

### Date & time

| Component | Selector | Purpose |
|---|---|---|
| calendar | `tw-calendar` | Single / multiple / range calendar |
| date-picker | `tw-date-picker` | Single date input + overlay |
| date-range-picker | `tw-date-range-picker` | Date-range input + overlay |
| time-picker | `tw-time-picker` | Hours / minutes selector |

### Overlays & feedback

| Component | Selector / API | Purpose |
|---|---|---|
| dialog | `TwDialog` service | Modal dialog overlay |
| sheet | `Sheet` service | Side drawer / sheet |
| popover | `[twPopover]` | Floating anchored content |
| tooltip | `[twTooltip]` | Hover / focus tooltip |
| menu | `tw-menu` + `[twMenuTrigger]` | Dropdown & context menus |
| toast | `ToastService` | Transient notifications |
| command-palette | `tw-command-palette` | Keyboard command finder |
| alert | `tw-alert` | Inline status message |

### Navigation

| Component | Selector | Purpose |
|---|---|---|
| tabs | `tw-tabs` | Tabbed content panels |
| tab-nav | `[twTabNav]` / `[twTabLink]` | Router-aware tab bar |
| breadcrumbs | `tw-breadcrumbs` | Hierarchical path navigation |
| paginator | `tw-paginator` | Page-size / range pagination |
| stepper | `tw-stepper` | Multi-step flow |

### Data display

| Component | Selector | Purpose |
|---|---|---|
| table | `tw-table` | Data table (sort, expand, sticky) |
| sort | `[twSort]` | Sortable column headers |
| card | `tw-card` | Elevated / outlined container |
| item | `tw-item` | List item with leading/trailing slots |
| stat | `tw-stat` | KPI value with delta |
| badge | `[twBadge]` | Count / status indicator |
| avatar | `tw-avatar` / `tw-avatar-group` | Image / initials avatar |
| timeline | `tw-timeline` | Chronological event list |
| code-block | `tw-code-block` | Code display with header |
| separator | `tw-separator` | Divider line |

### Layout & disclosure

| Component | Selector | Purpose |
|---|---|---|
| accordion | `tw-accordion` | Single / multi-panel disclosure |
| collapsible | `tw-collapsible` | Collapsible region + group |
| split | `tw-split` | Resizable split panes |
| carousel | `tw-carousel` | Slide carousel |
| flip-card | `tw-flip-card` | Front/back flip animation |

### Status & utility

| Component | Selector | Purpose |
|---|---|---|
| spinner | `tw-spinner` | Loading spinner |
| progress-bar | `tw-progress-bar` | Determinate / indeterminate progress |
| skeleton | `tw-skeleton` | Content placeholder |
| empty-state | `tw-empty-state` | No-data / empty screen |
| icon | `tw-icon` | Registry-backed SVG icon |

## Entry points

| Entry point | Contents |
|---|---|
| `@cdevhub/ngx-tw/<component>` | One per component (preferred — tree-shakeable) |
| `@cdevhub/ngx-tw` | Catch-all re-export of every public API (convenience) |
| `@cdevhub/ngx-tw/core` | Shared types (`TwColor`, `TwSize`) and `TW_ERROR_STATE_MATCHER` |
| `@cdevhub/ngx-tw/theme` | `ThemeService`, `provideTheme`, `[twTheme]`, `TW_THEME_BOOTSTRAP_SCRIPT`, theme types |
| `@cdevhub/ngx-tw/theme/index.css` | Default semantic theme stylesheet — the same directory ships as a copied CSS asset *and* as the TypeScript entry point above |
| `@cdevhub/ngx-tw/icon/lucide` | `provideTwLucideIcons`, `fromLucideIcon` |
| `@cdevhub/ngx-tw/calendar/luxon` | Luxon date adapter |
| `@cdevhub/ngx-tw/calendar/testing` | Calendar test harnesses |

Per-component imports are preferred over the catch-all for tree-shaking.

## Building locally

```bash
ng build ngx-tw              # build the library to dist/ngx-tw
ng test ngx-tw --no-watch    # run unit tests (Vitest)
ng serve demo                # run the demo app
```

## License

[MIT](./LICENSE) © Iuga Ciprian
</content>
</invoke>
