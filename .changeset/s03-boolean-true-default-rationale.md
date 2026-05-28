---
"ngx-tw": patch
---

Documentation-only sweep: every `input(true)` declaration in the library now carries rationale either as an inline `// TRUE-default:` comment, in its JSDoc one-liner, or in CLAUDE.md's codified Boolean-defaults list. Closes the audit's "Boolean `true` defaults without codified rationale" theme.

**New inline rationale comments:** `stepper.showError`, `stepper.headerInteractive`, `calendar-header.canSwitchView`, `paginator.showFirstLastButtons`, `paginator.showPageInfo`, `paginator.hideOnEmpty`, `combobox.showChevron`, `combobox.clearable`, `combobox.openOnFocus`.

**Spinner JSDoc** now explains *why* `track` defaults to `true` — without the ring the spinner reads as a partial arc, not a loading indicator.

**CLAUDE.md codified list** appended with `popover.twPopoverArrow`, `popover.twPopoverCloseOnOutside`, `popover.twPopoverCloseOnEscape`, `popover.twPopoverTrapFocus`, `timePicker.showSteppers`, `timePicker.showClear`.

No behavior or API changes.
