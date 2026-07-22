# Getting started with ngx-tw

## Install

```bash
npm install @cdevhub/ngx-tw @angular/cdk tailwindcss tailwind-variants
```

Peer requirements:

| Package | Version |
|---|---|
| `@angular/core`, `@angular/common` | `^22.0.0` |
| `@angular/cdk` | `^22.0.0` |
| `tailwindcss` | `^4.0.0` |
| `tailwind-variants` | `^0.3.0` |

Form controls additionally use `@angular/forms` (ships with Angular). Node
`^22.22.3`, `^24.15.0`, or `>=26.0.0`.

## Theme CSS — one import

Tailwind v4 has no JS config file; all customization happens in CSS.

```css
/* src/styles.css */
@import '@cdevhub/ngx-tw/theme/index.css';
```

That single line pulls in Tailwind itself, the semantic tokens, and a `@source`
directive pointing at the library's compiled bundles. The last part matters:
Tailwind v4 never scans `node_modules` on its own, so without it a build emits
tokens but **no component utilities**. Do not add a `@source` line yourself, and
do not add a separate `@import 'tailwindcss'` (a duplicate is harmless if one is
already there).

For any overlay-based component — dialog, sheet, menu, popover, select, tooltip,
combobox, date-picker, time-picker, command-palette — also import the CDK
overlay stylesheet:

```css
@import '@angular/cdk/overlay-prebuilt.css';
```

## Providers

Several subsystems are provider-based. Register only the ones in use:

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
    provideTheme(),
    provideNativeDateAdapter(),
    provideTwLucideIcons({ Star, Search, Settings }),
    provideTwDialog(),
    provideSheet(),
    provideToast({ position: 'bottom-right', duration: 4000 }),
  ],
};
```

| Provider | Required for | Entry point |
|---|---|---|
| `provideTheme()` | runtime theme switching / `ThemeService` (optional) | `@cdevhub/ngx-tw/theme` |
| `provideNativeDateAdapter()` | `calendar`, `date-picker`, `date-range-picker` | `@cdevhub/ngx-tw/calendar` |
| `provideTwLucideIcons()` / `provideTwIcons()` | `<tw-icon>` and any component rendering glyphs | `@cdevhub/ngx-tw/icon/lucide`, `@cdevhub/ngx-tw/icon` |
| `provideTwDialog()` | imperative dialogs via the `TwDialog` service | `@cdevhub/ngx-tw/dialog` |
| `provideSheet()` | imperative side sheets via the `Sheet` service | `@cdevhub/ngx-tw/sheet` |
| `provideToast()` | `ToastService` notifications | `@cdevhub/ngx-tw/toast` |

## Importing components

Import from the per-component entry point for the best tree-shaking. Components
are standalone — list them in the consuming component's `imports` array.

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

A root barrel (`@cdevhub/ngx-tw`) re-exports everything for convenience, but the
per-component path is preferred.

## Icons — the registration model, not a catalogue

`<tw-icon>` uses a **registry**: a glyph renders only after its name has been
registered by the consuming application. There is no built-in icon set, so
**valid `name` values are whatever that application registered** — never assume
a name exists.

The Lucide adapter is the quickest path:

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

## Theming

Components never reference raw palette colors — only semantic roles on a 50–950
scale (`bg-primary-500`, `text-error-800`) plus structural tokens (`surface`,
`surface-raised`, `fg`, `fg-muted`, `border`). Re-theme the whole library by
overriding those tokens:

```css
@import '@cdevhub/ngx-tw/theme/index.css';

@theme {
  --color-primary-500: oklch(0.55 0.2 260);
  --color-primary-600: oklch(0.48 0.2 260);
  --color-info-50: var(--color-sky-50);
  --color-info-500: var(--color-sky-500);
}
```

Dark mode is driven by a `data-theme` attribute on `<html>`, with a
`prefers-color-scheme` fallback when no attribute is set — so the simplest setup
needs no JavaScript. For explicit, persisted switching, register `provideTheme()`
and inject `ThemeService` (`theme`, `resolvedTheme`, `isDark` signals;
`setTheme()`, `cycleTheme()`). A `[twTheme]` directive scopes a theme to a
subtree.

## Date & time

Calendar and date pickers require a date adapter:

```ts
import { provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';
// providers: [ provideNativeDateAdapter() ]
```

A Luxon adapter lives at `@cdevhub/ngx-tw/calendar/luxon`, test helpers at
`@cdevhub/ngx-tw/calendar/testing`. Calendar UI strings are localizable via
`CalendarIntl` / `provideCalendarIntl`.

## Form controls

`input`, `textarea`, `select`, `combobox`, `checkbox`, `radio`, `switch`,
`slider`, `date-picker`, `date-range-picker`, and `time-picker` implement
`ControlValueAccessor` and work with **all three** Angular form strategies —
template-driven, reactive, and signal forms. The library does not prescribe one.
Pair them with `tw-form-field` for labels, hints, and error messages.
