# ngx-tw

An Angular component library for applications built with **Tailwind CSS v4+**
and **Angular CDK**. The quality bar is [Angular Material](https://material.angular.io/)
— well-tested, accessible, composable — but styled with Tailwind utility classes
instead of Material Design tokens.

- **37 components** covering common UI needs (buttons, inputs, overlays,
  navigation, data display, etc.)
- **Standalone, signal-based APIs** — Angular v21 idioms throughout (no
  NgModules, `OnPush`, `input()`/`output()`/`model()`).
- **Accessible by default** — built on Angular CDK primitives (focus management,
  overlays, a11y, collections). WCAG AA.
- **Tailwind v4 native** — no component CSS files; consumers control theming
  through semantic tokens.
- **Tree-shakeable secondary entry points** — import only what you use.

## Installation

```bash
npm install @cdevhub/ngx-tw @angular/cdk tailwindcss tailwind-variants
```

**Peer requirements**

- Angular `^21.2.0` (`@angular/core`, `@angular/common`)
- `@angular/cdk` `^21.0.0`
- `tailwindcss` `^4.0.0`
- `tailwind-variants` `^0.3.0`

## Setup

### 1. Import the default theme

Tailwind v4 has no JS config file — all customization happens in CSS. Add the
ngx-tw default theme to your global stylesheet so semantic tokens resolve:

```css
/* src/styles.css */
@import 'tailwindcss';
@import '@cdevhub/ngx-tw/theme/index.css';
```

The default theme maps semantic roles (`info`, `success`, `warning`, `error`,
`primary`, `secondary`, `accent`, `neutral`) and structural tokens (`surface`,
`fg`, `border`) to Tailwind's palette, with dark mode support out of the box.

### 2. Use components

Import from the per-component entry points for best tree-shaking:

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

## Customizing the theme

Override any semantic token in your own CSS using Tailwind v4's `@theme` block:

```css
@import '@cdevhub/ngx-tw/theme/index.css';

@theme {
  /* Re-brand primary to a custom indigo */
  --color-primary-500: oklch(0.55 0.2 260);
  --color-primary-600: oklch(0.48 0.2 260);

  /* Remap "info" to the sky palette */
  --color-info-50: var(--color-sky-50);
  --color-info-500: var(--color-sky-500);
}
```

Dark mode is handled entirely by the theme layer — swap in your own
`index.css` equivalent (or extend the ngx-tw one) if you need a different
dark palette. Components only reference semantic tokens, so they adapt
automatically.

## Components

All components are exposed as independent secondary entry points:

```
@cdevhub/ngx-tw/accordion          @cdevhub/ngx-tw/input                @cdevhub/ngx-tw/sort
@cdevhub/ngx-tw/alert              @cdevhub/ngx-tw/item                 @cdevhub/ngx-tw/spinner
@cdevhub/ngx-tw/avatar             @cdevhub/ngx-tw/menu                 @cdevhub/ngx-tw/stepper
@cdevhub/ngx-tw/badge              @cdevhub/ngx-tw/paginator            @cdevhub/ngx-tw/switch
@cdevhub/ngx-tw/button             @cdevhub/ngx-tw/popover              @cdevhub/ngx-tw/tab-nav
@cdevhub/ngx-tw/calendar           @cdevhub/ngx-tw/progress-bar         @cdevhub/ngx-tw/table
@cdevhub/ngx-tw/card               @cdevhub/ngx-tw/radio                @cdevhub/ngx-tw/tabs
@cdevhub/ngx-tw/checkbox           @cdevhub/ngx-tw/segmented-control    @cdevhub/ngx-tw/time-picker
@cdevhub/ngx-tw/code-block         @cdevhub/ngx-tw/select               @cdevhub/ngx-tw/toast
@cdevhub/ngx-tw/collapsible        @cdevhub/ngx-tw/separator            @cdevhub/ngx-tw/tooltip
@cdevhub/ngx-tw/command-palette    @cdevhub/ngx-tw/skeleton
@cdevhub/ngx-tw/date-picker        @cdevhub/ngx-tw/slider
@cdevhub/ngx-tw/dialog             @cdevhub/ngx-tw/form-field
@cdevhub/ngx-tw/flip-card          @cdevhub/ngx-tw/icon
```

Shared types (`TwColor`, `TwSize`) live in `@cdevhub/ngx-tw/core`.

A catch-all entry (`@cdevhub/ngx-tw`) re-exports every public API for convenience, but
per-component imports are preferred for tree-shaking.

## Form controls

Interactive controls (input, select, checkbox, radio, switch, slider,
date-picker, time-picker, etc.) implement `ControlValueAccessor` and work with
all three Angular form strategies — template-driven, reactive, and
signal-based forms.

## Building locally

```bash
ng build ngx-tw              # build library to dist/ngx-tw
ng test ngx-tw --no-watch    # run unit tests (Vitest)
ng serve demo                # run the demo app
```

## License

[MIT](./LICENSE) © Iuga Ciprian
