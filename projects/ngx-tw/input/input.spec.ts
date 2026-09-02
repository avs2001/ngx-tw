import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  signal,
  viewChild,
  type WritableSignal,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { AutofillMonitor } from '@angular/cdk/text-field';
import { Subject } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FormFieldComponent,
  LabelDirective,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import type { ErrorStateMatcher, TwSize } from '@cdevhub/ngx-tw/core';
import { InputDirective, TW_INPUT_VALUE_ACCESSOR } from './input';

// ── Host harnesses ──

@Component({
  imports: [InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <input
      twInput
      [type]="type()"
      [disabled]="disabled()"
      [required]="required()"
      [readonly]="readonly()"
      [size]="size()"
    />
  `,
})
class StandaloneInputHost {
  readonly type = signal('text');
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly size = signal<TwSize>('md');
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput id="my-explicit-input" />`,
})
class ExplicitIdHost {
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea twInput [disabled]="disabled()"></textarea>`,
})
class TextareaHost {
  readonly disabled = signal(false);
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [FormFieldComponent, LabelDirective, InputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Email</label>
      <input twInput />
    </tw-form-field>
  `,
})
class InFormFieldHost {
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput [formControl]="ctrl" />`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<string | null>('', {
    validators: [Validators.required],
  });
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput [(ngModel)]="value" required />`,
})
class TemplateDrivenHost {
  value = '';
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="form">
      <input twInput formControlName="email" />
    </form>
  `,
})
class SubmittedFormHost {
  readonly form = new FormGroup({
    email: new FormControl<string | null>('', {
      validators: [Validators.required],
    }),
  });
  readonly directive = viewChild.required(InputDirective);
}

// Accessor-extension directive — stores value in a WritableSignal so the
// InputDirective reads it from us instead of the native element.
@Directive({
  selector: 'input[twTestAccessor]',
  providers: [
    { provide: TW_INPUT_VALUE_ACCESSOR, useExisting: TestAccessorDirective },
  ],
})
class TestAccessorDirective {
  readonly value: WritableSignal<string> = signal('');
}

@Component({
  imports: [InputDirective, TestAccessorDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput twTestAccessor />`,
})
class AccessorHost {
  readonly accessor = viewChild.required(TestAccessorDirective);
  readonly directive = viewChild.required(InputDirective);
}

@Component({
  imports: [InputDirective, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input twInput [formField]="signalForm.fullName" />`,
})
class SignalFormsHost {
  readonly model = signal({ fullName: '' });
  readonly signalForm = form(this.model, (p) => {
    required(p.fullName);
    minLength(p.fullName, 2);
  });
  readonly directive = viewChild.required(InputDirective);
}

// ── Helpers ──

function inputEl<T>(fixture: ComponentFixture<T>): HTMLInputElement {
  return fixture.nativeElement.querySelector('input') as HTMLInputElement;
}

function textareaEl<T>(fixture: ComponentFixture<T>): HTMLTextAreaElement {
  return fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
}

function fireInput(el: HTMLInputElement | HTMLTextAreaElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

// ── Tests ──

describe('InputDirective', () => {
  describe('rendering', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('creates without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
      expect(inputEl(fixture)).toBeTruthy();
    });

    it('generates a unique id when not provided', () => {
      expect(inputEl(fixture).id).toMatch(/^tw-input-\d+$/);
    });

    it('applies standalone styling (border + rounded)', () => {
      const cls = inputEl(fixture).className;
      expect(cls).toContain('border');
      expect(cls).toContain('rounded-md');
    });

    it('keeps type="text" by default on the native element', () => {
      expect(inputEl(fixture).getAttribute('type')).toBe('text');
    });
  });

  describe('explicit id', () => {
    it('round-trips an explicit `id` to the host attribute', async () => {
      await TestBed.configureTestingModule({
        imports: [ExplicitIdHost],
      }).compileComponents();
      const ef = TestBed.createComponent(ExplicitIdHost);
      ef.detectChanges();
      expect(inputEl(ef).id).toBe('my-explicit-input');
      expect(ef.componentInstance.directive().id()).toBe('my-explicit-input');
    });
  });

  describe('size axis (standalone)', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('defaults to md padding, font, and pinned height (`px-4 text-sm h-9`)', () => {
      const tokens = inputEl(fixture).className.split(/\s+/);
      expect(tokens).toContain('px-4');
      expect(tokens).toContain('text-sm');
      expect(tokens).toContain('h-9');
    });

    it.each([
      ['xs', 'px-2', 'h-6', 'text-xs'],
      ['sm', 'px-3', 'h-8', 'text-sm'],
      ['md', 'px-4', 'h-9', 'text-sm'],
      ['lg', 'px-5', 'h-11', 'text-base'],
      ['xl', 'px-6', 'h-12', 'text-base'],
    ] as const)(
      'maps size="%s" to %s %s %s',
      (size, px, height, font) => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        // Token match, not substring: `toContain('h-9')` would also pass on
        // `min-h-9`, hiding a mis-keyed height variant.
        const tokens = inputEl(fixture).className.split(/\s+/);
        expect(tokens).toContain(px);
        expect(tokens).toContain(height);
        expect(tokens).toContain(font);
      },
    );

    // The pinned height replaces the vertical padding — leaving both alive lets
    // padding and height fight, and the taller one silently wins. See
    // `docs/vertical-rhythm.md`.
    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
      'emits no vertical padding at size="%s"',
      (size) => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const tokens = inputEl(fixture).className.split(/\s+/);
        expect(tokens.filter((t) => /^(p|py|pt|pb)-/.test(t))).toEqual([]);
      },
    );
  });

  describe('size axis (in form-field)', () => {
    it('strips padding entirely when wrapped — wrapper carries density', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const ff = TestBed.createComponent(InFormFieldHost);
      ff.detectChanges();
      await ff.whenStable();
      const cls = inputEl(ff).className;
      expect(cls).toContain('p-0');
      expect(cls).not.toContain('px-4');
    });

    // The wrapper's control row owns the height when the input is nested, so
    // the control must not carry one of its own.
    it('emits no pinned height when wrapped', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const ff = TestBed.createComponent(InFormFieldHost);
      ff.detectChanges();
      await ff.whenStable();
      const tokens = inputEl(ff).className.split(/\s+/);
      expect(tokens.filter((t) => /^h-/.test(t))).toEqual([]);
    });
  });

  describe('inputs → DOM', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('syncs `type` to the native type attribute', () => {
      fixture.componentInstance.type.set('email');
      fixture.detectChanges();
      expect(inputEl(fixture).getAttribute('type')).toBe('email');
    });

    it('disables the native element when `disabled` is true', () => {
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(inputEl(fixture).disabled).toBe(true);
      expect(fixture.componentInstance.directive().disabled()).toBe(true);
    });

    it('sets aria-required when `required` is true', () => {
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(inputEl(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('applies native readonly attribute when `readonly` is true', async () => {
      fixture.componentInstance.readonly.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(inputEl(fixture).getAttribute('readonly')).toBe('true');
    });

    it('throws in dev mode for unsupported types', () => {
      fixture.componentInstance.type.set('checkbox');
      expect(() => fixture.detectChanges()).toThrowError(
        /unsupported input type/i,
      );
    });
  });

  describe('value + empty tracking', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('starts empty', () => {
      expect(fixture.componentInstance.directive().empty()).toBe(true);
      expect(fixture.componentInstance.directive().value()).toBeNull();
    });

    it('becomes non-empty after user input', () => {
      fireInput(inputEl(fixture), 'hello');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().empty()).toBe(false);
      expect(fixture.componentInstance.directive().value()).toBe('hello');
    });

    it('treats `date` type as never-empty', () => {
      fixture.componentInstance.type.set('date');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().empty()).toBe(false);
    });
  });

  describe('focus', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('reflects focus via the `focused` signal', async () => {
      const el = inputEl(fixture);
      el.focus();
      el.dispatchEvent(new FocusEvent('focus'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().focused()).toBe(true);
      el.blur();
      el.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().focused()).toBe(false);
    });
  });

  describe('reactive forms', () => {
    let fixture: ComponentFixture<ReactiveHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReactiveHost],
      }).compileComponents();
      fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
    });

    it('marks as required from Validators.required', () => {
      expect(fixture.componentInstance.directive().required()).toBe(true);
    });

    it('disables via FormControl.disable()', async () => {
      fixture.componentInstance.ctrl.disable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().disabled()).toBe(true);
      expect(inputEl(fixture).disabled).toBe(true);
    });

    it('errorState is false while pristine even when invalid', () => {
      expect(fixture.componentInstance.ctrl.invalid).toBe(true);
      expect(fixture.componentInstance.directive().errorState()).toBe(false);
    });

    it('errorState flips to true once the control is touched', async () => {
      fixture.componentInstance.ctrl.markAsTouched();
      fixture.componentInstance.ctrl.updateValueAndValidity();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().errorState()).toBe(true);
      expect(inputEl(fixture).getAttribute('aria-invalid')).toBe('true');
    });
  });

  describe('template-driven forms', () => {
    it('drives value through ngModel', async () => {
      await TestBed.configureTestingModule({
        imports: [TemplateDrivenHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TemplateDrivenHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = inputEl(fixture);
      fireInput(el, 'abc');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.value).toBe('abc');
      expect(fixture.componentInstance.directive().required()).toBe(true);
    });
  });

  describe('parent form submit triggers error state', () => {
    it('turns on errorState after ngSubmit even without touched', async () => {
      await TestBed.configureTestingModule({
        imports: [SubmittedFormHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SubmittedFormHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const form = fixture.nativeElement.querySelector('form') as HTMLFormElement;
      form.dispatchEvent(new Event('submit'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().errorState()).toBe(true);
    });
  });

  describe('inside tw-form-field', () => {
    it('registers with the form-field and strips its own border', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(InFormFieldHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const formField = fixture.debugElement.children[0].injector.get(
        FormFieldComponent,
      );
      expect(formField.control()).toBe(fixture.componentInstance.directive());

      const el = inputEl(fixture);
      expect(el.className).toContain('border-0');
      expect(el.className).toContain('p-0');
      expect(el.className).not.toContain('rounded-md');
    });

    it('provides FormFieldControl via TW_FORM_FIELD_CONTROL', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(InFormFieldHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = fixture.debugElement.query((n) => !!n.injector.get(TW_FORM_FIELD_CONTROL, null));
      expect(el).toBeTruthy();
    });
  });

  describe('aria-describedby', () => {
    let fixture: ComponentFixture<StandaloneInputHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
    });

    it('writes ids on the native element via setDescribedByIds', () => {
      fixture.componentInstance.directive().setDescribedByIds(['a', 'b']);
      expect(inputEl(fixture).getAttribute('aria-describedby')).toBe('a b');
    });

    it('removes the attribute when an empty list is passed', () => {
      fixture.componentInstance.directive().setDescribedByIds(['x']);
      fixture.componentInstance.directive().setDescribedByIds([]);
      expect(inputEl(fixture).hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('custom error-state matcher', () => {
    it('uses a per-instance matcher override', async () => {
      const alwaysError: ErrorStateMatcher = {
        isErrorState: () => true,
      };

      @Component({
        imports: [InputDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<input twInput [errorStateMatcher]="matcher" />`,
      })
      class Host {
        readonly matcher = alwaysError;
        readonly directive = viewChild.required(InputDirective);
      }

      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      // With the override always returning true, errorState reflects it even
      // without an NgControl attached.
      expect(fixture.componentInstance.directive().errorState()).toBe(true);
    });
  });

  describe('value accessor extension', () => {
    it('reads value from the provided TW_INPUT_VALUE_ACCESSOR signal', async () => {
      await TestBed.configureTestingModule({
        imports: [AccessorHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(AccessorHost);
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.accessor().value.set('from-accessor');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().value()).toBe(
        'from-accessor',
      );
      expect(fixture.componentInstance.directive().empty()).toBe(false);
    });
  });

  describe('textarea support', () => {
    it('mounts on <textarea> and reports controlType "textarea"', async () => {
      await TestBed.configureTestingModule({
        imports: [TextareaHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TextareaHost);
      fixture.detectChanges();
      expect(textareaEl(fixture)).toBeTruthy();
      expect(fixture.componentInstance.directive().controlType).toBe('textarea');
    });

    it('tracks value on textarea input events', async () => {
      await TestBed.configureTestingModule({
        imports: [TextareaHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(TextareaHost);
      fixture.detectChanges();
      const ta = textareaEl(fixture);
      fireInput(ta, 'multi\nline');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().value()).toBe('multi\nline');
    });
  });

  describe('signal forms', () => {
    it('flips errorState once a required signal-field is touched and invalid', async () => {
      await TestBed.configureTestingModule({
        imports: [SignalFormsHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SignalFormsHost);
      fixture.detectChanges();
      await fixture.whenStable();

      // Pristine: invalid but not touched → no error state.
      expect(fixture.componentInstance.directive().errorState()).toBe(false);

      const el = inputEl(fixture);
      el.focus();
      el.dispatchEvent(new FocusEvent('focus'));
      el.blur();
      el.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.directive().errorState()).toBe(true);
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });

    it('reflects field value updates from the model', async () => {
      await TestBed.configureTestingModule({
        imports: [SignalFormsHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SignalFormsHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = inputEl(fixture);
      fireInput(el, 'Ada');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.signalForm.fullName().value()).toBe('Ada');
    });
  });

  describe('autofill monitor', () => {
    it('marks the directive non-empty when AutofillMonitor fires `isAutofilled: true`', async () => {
      const autofillSubject = new Subject<{ target: Element; isAutofilled: boolean }>();
      const autofillStub = {
        monitor: vi.fn(() => autofillSubject.asObservable()),
        stopMonitoring: vi.fn(),
      };

      await TestBed.configureTestingModule({
        imports: [StandaloneInputHost],
        providers: [{ provide: AutofillMonitor, useValue: autofillStub }],
      }).compileComponents();
      const fixture = TestBed.createComponent(StandaloneInputHost);
      fixture.detectChanges();
      await fixture.whenStable();

      // Bare element value is empty.
      expect(fixture.componentInstance.directive().empty()).toBe(true);

      const el = inputEl(fixture);
      autofillSubject.next({ target: el, isAutofilled: true });
      fixture.detectChanges();

      expect(autofillStub.monitor).toHaveBeenCalledWith(el);
      expect(fixture.componentInstance.directive().empty()).toBe(false);

      autofillSubject.next({ target: el, isAutofilled: false });
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().empty()).toBe(true);
    });
  });
});
