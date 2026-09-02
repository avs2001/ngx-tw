import {
  Directive,
  effect,
  inject,
  input,
  model,
  type InputSignal,
  type ModelSignal,
} from '@angular/core';
import type {
  DisabledReason,
  FormValueControl,
  ValidationError,
  WithOptionalFieldTree,
} from '@angular/forms/signals';
import { CalendarComponent } from './calendar';
import type { CalendarRangeValue } from './calendar.types';

/**
 * Common signal-input surface declared by the three mode-specific directives
 * per spec §6.3 / §7.3. Each directive maps the Signal Forms contract onto
 * the hosting `CalendarComponent`, so `[field]="form.someDate"` drives the
 * calendar without any extra wiring.
 */
interface CalendarFormControlCommon {
  /** Disabled flag forwarded from the bound field. OR-merged with `disabled` on the component. */
  readonly disabled: InputSignal<boolean>;
  /** Read-only flag forwarded from the bound field. OR-merged with `readonly` on the component. */
  readonly readonly: InputSignal<boolean>;
  /** Required flag forwarded from the bound field. Surfaces `calendarRequired` when empty (§10.2). */
  readonly required: InputSignal<boolean>;
  /** Mirrors the bound field's `invalid` flag. Reserved for visual treatment (Phase 4 wires styling). */
  readonly invalid: InputSignal<boolean>;
  /** Mirrors the bound field's `hidden` flag. Consumers should guard the component with `@if` when true. */
  readonly hidden: InputSignal<boolean>;
  /** Field errors forwarded from Signal Forms for consumer-side styling. */
  readonly errors: InputSignal<readonly ValidationError.WithOptionalFieldTree[]>;
  /** Forwarded disablement reasons; surfaced for consumer-side UX (tooltips, etc.). */
  readonly disabledReasons: InputSignal<readonly WithOptionalFieldTree<DisabledReason>[]>;
  /** Two-way `touched` flag — the directive writes `true` on blur; the `Field` directive reads/writes it. */
  readonly touched: ModelSignal<boolean>;
}

function wireSignalFormsInputs(
  host: CalendarComponent<'single' | 'multiple' | 'range', unknown, unknown>,
  api: CalendarFormControlCommon,
): void {
  // Mirror Signal Forms flags onto the component. Effects run in the
  // directive's injection context (constructor-created), so cleanup is
  // automatic on destroy.
  effect(() => {
    host.cvaDisabled.set(api.disabled());
  });
  effect(() => {
    host.cvaReadonly.set(api.readonly());
  });
}

/**
 * Signal Forms strict binding for `CalendarComponent` in `single` mode.
 * Implements `FormValueControl<D | null>` so `[field]="form.someDate"`
 * infers `FieldTree<D | null>` with no casts.
 *
 * Applies automatically when `<tw-calendar mode="single">` appears in the
 * template. When the mode attribute is omitted, consumers bind the component
 * directly — the CVA path handles reactive / template-driven forms.
 */
// Selector matches the existing CalendarComponent input `mode="single"`;
// renaming to `twMode` would break the public API. The directive is scoped
// to the `tw-calendar` element so the unprefixed attribute is safe.
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tw-calendar[mode="single"]',
  exportAs: 'twCalendarSingle',
})
export class CalendarSingleDirective<D = Date, TOut = D | null>
  implements FormValueControl<TOut>, CalendarFormControlCommon
{
  private readonly host = inject(CalendarComponent, { self: true }) as unknown as CalendarComponent<
    'single',
    D,
    TOut
  >;

  /** Two-way value, forwarded to the hosting `CalendarComponent`. Signal Forms `Field` binds against this. */
  readonly value = this.host.value as unknown as ModelSignal<TOut>;

  /** Mirrors the bound field's disabled flag; Signal Forms writes it, and the host calendar disables itself when it is `true`. Defaults to `false`. */
  readonly disabled = input<boolean>(false);
  /** Mirrors the bound field's readonly flag; the host calendar renders its grids read-only when it is `true`. Defaults to `false`. */
  readonly readonly = input<boolean>(false);
  /** Mirrors the bound field's required flag. Defaults to `false`. */
  readonly required = input<boolean>(false);
  /** Mirrors the bound field's invalid flag. Defaults to `false`. */
  readonly invalid = input<boolean>(false);
  /** Mirrors the bound field's hidden flag. Defaults to `false`. */
  readonly hidden = input<boolean>(false);
  /** Mirrors the bound field's errors. Defaults to `[]` (no errors). */
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  /** Mirrors the bound field's disablement reasons. Defaults to `[]` (none). */
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  /** Two-way `touched` flag — drives and reflects the field's touched state, flipping to `true` when the calendar loses focus after an interaction. Defaults to `false`. */
  readonly touched = model<boolean>(false);

  constructor() {
    wireSignalFormsInputs(
      this.host as unknown as CalendarComponent<
        'single' | 'multiple' | 'range',
        unknown,
        unknown
      >,
      this,
    );
  }
}

/**
 * Signal Forms strict binding for `CalendarComponent` in `multiple` mode.
 * Implements `FormValueControl<D[]>`.
 */
// See note above on the single-mode directive — same rationale.
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tw-calendar[mode="multiple"]',
  exportAs: 'twCalendarMultiple',
})
export class CalendarMultipleDirective<D = Date, TOut = D[]>
  implements FormValueControl<TOut>, CalendarFormControlCommon
{
  private readonly host = inject(CalendarComponent, { self: true }) as unknown as CalendarComponent<
    'multiple',
    D,
    TOut
  >;

  /** Two-way value, forwarded to the hosting `CalendarComponent`. Signal Forms `Field` binds against this. */
  readonly value = this.host.value as unknown as ModelSignal<TOut>;

  /** Mirrors the bound field's disabled flag; Signal Forms writes it, and the host calendar disables itself when it is `true`. Defaults to `false`. */
  readonly disabled = input<boolean>(false);
  /** Mirrors the bound field's readonly flag; the host calendar renders its grids read-only when it is `true`. Defaults to `false`. */
  readonly readonly = input<boolean>(false);
  /** Mirrors the bound field's required flag. Defaults to `false`. */
  readonly required = input<boolean>(false);
  /** Mirrors the bound field's invalid flag. Defaults to `false`. */
  readonly invalid = input<boolean>(false);
  /** Mirrors the bound field's hidden flag. Defaults to `false`. */
  readonly hidden = input<boolean>(false);
  /** Mirrors the bound field's errors. Defaults to `[]` (no errors). */
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  /** Mirrors the bound field's disablement reasons. Defaults to `[]` (none). */
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  /** Two-way `touched` flag — drives and reflects the field's touched state, flipping to `true` when the calendar loses focus after an interaction. Defaults to `false`. */
  readonly touched = model<boolean>(false);

  constructor() {
    wireSignalFormsInputs(
      this.host as unknown as CalendarComponent<
        'single' | 'multiple' | 'range',
        unknown,
        unknown
      >,
      this,
    );
  }
}

/**
 * Signal Forms strict binding for `CalendarComponent` in `range` mode.
 * Implements `FormValueControl<{ start: D | null; end: D | null }>`.
 */
// See note above on the single-mode directive — same rationale.
@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: 'tw-calendar[mode="range"]',
  exportAs: 'twCalendarRange',
})
export class CalendarRangeDirective<D = Date, TOut = CalendarRangeValue<D>>
  implements FormValueControl<TOut>, CalendarFormControlCommon
{
  private readonly host = inject(CalendarComponent, { self: true }) as unknown as CalendarComponent<
    'range',
    D,
    TOut
  >;

  /** Two-way value, forwarded to the hosting `CalendarComponent`. Signal Forms `Field` binds against this. */
  readonly value = this.host.value as unknown as ModelSignal<TOut>;

  /** Mirrors the bound field's disabled flag; Signal Forms writes it, and the host calendar disables itself when it is `true`. Defaults to `false`. */
  readonly disabled = input<boolean>(false);
  /** Mirrors the bound field's readonly flag; the host calendar renders its grids read-only when it is `true`. Defaults to `false`. */
  readonly readonly = input<boolean>(false);
  /** Mirrors the bound field's required flag. Defaults to `false`. */
  readonly required = input<boolean>(false);
  /** Mirrors the bound field's invalid flag. Defaults to `false`. */
  readonly invalid = input<boolean>(false);
  /** Mirrors the bound field's hidden flag. Defaults to `false`. */
  readonly hidden = input<boolean>(false);
  /** Mirrors the bound field's errors. Defaults to `[]` (no errors). */
  readonly errors = input<readonly ValidationError.WithOptionalFieldTree[]>([]);
  /** Mirrors the bound field's disablement reasons. Defaults to `[]` (none). */
  readonly disabledReasons = input<readonly WithOptionalFieldTree<DisabledReason>[]>([]);
  /** Two-way `touched` flag — drives and reflects the field's touched state, flipping to `true` when the calendar loses focus after an interaction. Defaults to `false`. */
  readonly touched = model<boolean>(false);

  constructor() {
    wireSignalFormsInputs(
      this.host as unknown as CalendarComponent<
        'single' | 'multiple' | 'range',
        unknown,
        unknown
      >,
      this,
    );
  }
}
