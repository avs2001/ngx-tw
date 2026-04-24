# Changelog

All notable changes to **ngx-tw** will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

- Initial set of 37 components exposed as secondary entry points:
  accordion, alert, avatar, badge, button, calendar, card, checkbox,
  code-block, collapsible, command-palette, date-picker, dialog, flip-card,
  form-field, icon, input, item, menu, paginator, popover, progress-bar,
  radio, segmented-control, select, separator, skeleton, slider, sort,
  spinner, stepper, switch, tab-nav, table, tabs, time-picker, toast,
  tooltip.
- Shared types (`TwColor`, `TwSize`) exported from `ngx-tw/core`.
- Default theme CSS at `ngx-tw/theme/default.css` mapping semantic tokens
  (info, success, warning, error, primary, secondary, accent, neutral) and
  surface/fg/border tokens to Tailwind palette colors, with built-in dark
  mode support.
- Keyframe animation classes (`fade-in`, `fade-out`, `scale-in`, `scale-out`,
  etc.) shipped with the default theme for use with Angular's native
  `animate.enter`/`animate.leave`.
- Unit test suites (Vitest) for every component.

### Requirements

- Angular `^21.2.0` with `@angular/cdk ^21.0.0`
- Tailwind CSS `^4.0.0`
- `tailwind-variants ^0.3.0`
