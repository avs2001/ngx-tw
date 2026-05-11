/**
 * Programmatic route inventory for the demo app. Single source of truth for
 * the smoke matrix in `specs/00-smoke/routes.spec.ts` and the navigation POMs.
 *
 * This list is **derived** from `projects/demo/src/app/app.routes.ts`. A
 * Vitest-level guard (see `projects/demo/src/app/app.routes.spec.ts`) compares
 * this list to the routes extracted from `app.routes.ts` at build time and
 * fails the build if they diverge.
 *
 * Sorted alphabetically — must match the order produced by the guard.
 */

export const COMPONENTS = [
  'accordion',
  'alert',
  'avatar',
  'badge',
  'button',
  'calendar',
  'card',
  'checkbox',
  'code-block',
  'collapsible',
  'command-palette',
  'date-picker',
  'date-range-picker',
  'dialog',
  'flip-card',
  'form-field',
  'icon',
  'input',
  'item',
  'menu',
  'paginator',
  'popover',
  'progress-bar',
  'radio',
  'segmented-control',
  'select',
  'separator',
  'skeleton',
  'slider',
  'sort',
  'spinner',
  'split',
  'stepper',
  'switch',
  'tab-nav',
  'table',
  'tabs',
  'time-picker',
  'toast',
  'tooltip',
] as const;

export const SERVICES = ['theme'] as const;

export const SUBROUTES = ['overview', 'examples', 'api'] as const;

export type ComponentRoute = (typeof COMPONENTS)[number];
export type ServiceRoute = (typeof SERVICES)[number];
export type Subroute = (typeof SUBROUTES)[number];

/** Every concrete demo URL — components × subroutes + services × subroutes. */
export const PAGES: readonly string[] = [
  ...COMPONENTS.flatMap((c) => SUBROUTES.map((s) => `/components/${c}/${s}`)),
  ...SERVICES.flatMap((s) => SUBROUTES.map((sub) => `/services/${s}/${sub}`)),
];

/** The default landing route after the root `/` redirect (see `app.routes.ts`). */
export const ROOT_REDIRECT_TARGET = '/components/button';
