import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  inject,
  input,
  signal,
  type OnInit,
} from '@angular/core';
import { TestBed, type ComponentFixture } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import {
  FormControl,
  FormGroup,
  NgControl,
  ReactiveFormsModule,
  Validators,
  type ControlValueAccessor,
} from '@angular/forms';
import { beforeEach, describe, expect, it } from 'vitest';
import {
  TW_ERROR_STATE_MATCHER,
  type ErrorStateMatcher,
} from './error-state-matcher';
import { wireErrorState } from './error-state-wiring';

// ── Test controls ──────────────────────────────────────────────────
//
// These mirror the shape every ngx-tw form control uses: `NgControl` resolved
// with `{ optional, self }`, the value accessor assigned in the *constructor*
// (never `ngOnInit` — see CLAUDE.md), and `wireErrorState()` called from a field
// initializer so it runs inside the injection context.

@Directive({ selector: '[twWiredControl]' })
class WiredControlDirective implements ControlValueAccessor, OnInit {
  readonly requiredInput = input(false, { alias: 'required' });
  readonly matcherInput = input<ErrorStateMatcher | undefined>(undefined, {
    alias: 'errorStateMatcher',
  });

  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  /** Stands in for a control's `FocusMonitor`-driven focus signal. */
  readonly focused = signal(false);
  /** Stands in for a picker's `parseError()` / a radio's parent delegation. */
  readonly forcedError = signal<boolean | undefined>(undefined);

  readonly wiring = wireErrorState({
    ngControl: () => this.ngControl,
    matcher: () => this.matcherInput(),
    required: () => this.requiredInput(),
    track: [this.focused],
    errorStateOverride: () => this.forcedError(),
  });

  readonly errorState = this.wiring.errorState;
  readonly required = this.wiring.required;
  readonly errors = this.wiring.errors;

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.wiring.connect();
  }

  writeValue(): void {
    /* no-op */
  }
  registerOnChange(): void {
    /* no-op */
  }
  registerOnTouched(): void {
    /* no-op */
  }
}

/** The `tw-checkbox` / `tw-switch` shape: `requiredTrue` also marks required. */
@Directive({ selector: '[twWiredBooleanControl]' })
class WiredBooleanControlDirective implements ControlValueAccessor, OnInit {
  private readonly ngControl = inject(NgControl, { optional: true, self: true });

  readonly wiring = wireErrorState({
    ngControl: () => this.ngControl,
    requiredValidators: [Validators.required, Validators.requiredTrue],
  });

  constructor() {
    if (this.ngControl) {
      this.ngControl.valueAccessor = this;
    }
  }

  ngOnInit(): void {
    this.wiring.connect();
  }

  writeValue(): void {
    /* no-op */
  }
  registerOnChange(): void {
    /* no-op */
  }
  registerOnTouched(): void {
    /* no-op */
  }
}

@Component({
  selector: 'test-reactive-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WiredControlDirective],
  template: `
    <form [formGroup]="form">
      <input twWiredControl formControlName="name" [errorStateMatcher]="matcher()" />
    </form>
  `,
})
class ReactiveHost {
  readonly matcher = input<ErrorStateMatcher | undefined>(undefined);
  readonly control = new FormControl('', Validators.required);
  readonly form = new FormGroup({ name: this.control });
}

@Component({
  selector: 'test-boolean-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, WiredBooleanControlDirective],
  template: `
    <form [formGroup]="form">
      <input twWiredBooleanControl formControlName="agree" />
    </form>
  `,
})
class BooleanHost {
  readonly control = new FormControl(false, Validators.requiredTrue);
  readonly form = new FormGroup({ agree: this.control });
}

@Component({
  selector: 'test-unbound-host',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [WiredControlDirective],
  template: `<input twWiredControl [required]="requiredInput()" />`,
})
class UnboundHost {
  readonly requiredInput = input(false);
}

function wired(fixture: ComponentFixture<unknown>): WiredControlDirective {
  return fixture.debugElement.query(By.directive(WiredControlDirective)).injector.get(
    WiredControlDirective,
  );
}

describe('wireErrorState', () => {
  describe('bound to a reactive control', () => {
    let fixture: ComponentFixture<ReactiveHost>;
    let directive: WiredControlDirective;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [ReactiveHost] }).compileComponents();
      fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      directive = wired(fixture);
    });

    it('starts with errorState false while the control is untouched', () => {
      expect(fixture.componentInstance.control.invalid).toBe(true);
      expect(directive.errorState()).toBe(false);
    });

    it('turns errorState on once the control is touched and re-validated', async () => {
      // Read first so the computed is cached: without the `statusChanges`
      // subscription in `connect()` nothing invalidates it and this stays false.
      expect(directive.errorState()).toBe(false);
      fixture.componentInstance.control.markAsTouched();
      fixture.componentInstance.control.updateValueAndValidity();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errorState()).toBe(true);
    });

    it('turns errorState on when the parent form is submitted, without touching', async () => {
      // Read first so the computed is cached: without the `ngSubmit`
      // subscription in `connect()` nothing invalidates it and this stays false.
      expect(directive.errorState()).toBe(false);
      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.control.touched).toBe(false);
      expect(directive.errorState()).toBe(true);
    });

    it('derives required from Validators.required on the bound control', () => {
      expect(directive.required()).toBe(true);
    });

    it('re-derives required when the bound control gains a required validator', async () => {
      fixture.componentInstance.control.removeValidators(Validators.required);
      fixture.componentInstance.control.updateValueAndValidity();
      fixture.detectChanges();
      await fixture.whenStable();
      // Cache the `false` before adding the validator back, so only a
      // `statusChanges` bump from `connect()` can surface the change.
      expect(directive.required()).toBe(false);

      fixture.componentInstance.control.addValidators(Validators.required);
      fixture.componentInstance.control.updateValueAndValidity();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.required()).toBe(true);
    });

    it('exposes the bound control errors map and clears it when the control validates', async () => {
      expect(directive.errors()).toEqual({ required: true });
      fixture.componentInstance.control.setValue('abc');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errors()).toBeNull();
    });

    it('reacts to a validator transition that does not flip VALID/INVALID', async () => {
      // Cache the computed first — `setErrors` keeps the control INVALID, so the
      // only thing that can surface the new map is a `statusChanges` bump.
      expect(directive.errors()).toEqual({ required: true });
      fixture.componentInstance.control.setErrors({ custom: 'x' });
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errors()).toEqual({ custom: 'x' });
    });

    it('bump() advances rev and invalidates the derived signals', () => {
      const before = directive.wiring.rev();
      directive.wiring.bump();
      expect(directive.wiring.rev()).toBe(before + 1);
    });

    it('prefers the per-instance matcher over the injected default', async () => {
      // Cached first, so only the matcher callback being track-read can flip it.
      expect(directive.errorState()).toBe(false);
      fixture.componentRef.setInput('matcher', {
        isErrorState: () => true,
      } satisfies ErrorStateMatcher);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errorState()).toBe(true);
    });

    it('errorStateOverride short-circuits, delegates, and falls through', async () => {
      expect(directive.errorState()).toBe(false);

      // A `true` override wins without consulting the matcher (picker parse/range errors).
      directive.forcedError.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errorState()).toBe(true);

      // A `false` override also wins — the `tw-radio` case, where a child
      // inherits its group's (possibly false) error state.
      fixture.componentInstance.control.markAsTouched();
      fixture.componentInstance.control.updateValueAndValidity();
      directive.forcedError.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errorState()).toBe(false);

      // `undefined` falls through to the matcher, which now says true.
      directive.forcedError.set(undefined);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.errorState()).toBe(true);
    });
  });

  describe('tracked sources', () => {
    it('recomputes errorState when a tracked signal changes', async () => {
      // A matcher whose answer comes from a plain variable: the only thing that
      // can produce a new value is the tracked signal invalidating the computed.
      const state = { errored: false };
      const matcher: ErrorStateMatcher = { isErrorState: () => state.errored };
      await TestBed.configureTestingModule({
        imports: [ReactiveHost],
        providers: [{ provide: TW_ERROR_STATE_MATCHER, useValue: matcher }],
      }).compileComponents();
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const directive = wired(fixture);

      expect(directive.errorState()).toBe(false);
      state.errored = true;
      // Still cached — nothing the computed reads has changed.
      expect(directive.errorState()).toBe(false);

      directive.focused.set(true);
      expect(directive.errorState()).toBe(true);
    });
  });

  describe('injected TW_ERROR_STATE_MATCHER', () => {
    it('is used when no per-instance override is set', async () => {
      const alwaysOn: ErrorStateMatcher = { isErrorState: () => true };
      await TestBed.configureTestingModule({
        imports: [ReactiveHost],
        providers: [{ provide: TW_ERROR_STATE_MATCHER, useValue: alwaysOn }],
      }).compileComponents();
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(wired(fixture).errorState()).toBe(true);
    });
  });

  describe('requiredValidators', () => {
    it('honours Validators.requiredTrue when the control opts in', async () => {
      await TestBed.configureTestingModule({ imports: [BooleanHost] }).compileComponents();
      const fixture = TestBed.createComponent(BooleanHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const directive = fixture.debugElement
        .query(By.directive(WiredBooleanControlDirective))
        .injector.get(WiredBooleanControlDirective);
      expect(directive.wiring.required()).toBe(true);
    });
  });

  describe('unbound host (no NgControl)', () => {
    it('is a clean no-op: errorState false, errors null, required from the input', async () => {
      await TestBed.configureTestingModule({ imports: [UnboundHost] }).compileComponents();
      const fixture = TestBed.createComponent(UnboundHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const directive = wired(fixture);

      expect(directive.errorState()).toBe(false);
      expect(directive.errors()).toBeNull();
      expect(directive.required()).toBe(false);

      fixture.componentRef.setInput('requiredInput', true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(directive.required()).toBe(true);
    });
  });
});
