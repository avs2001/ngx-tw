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
import { describe, it, expect, beforeEach } from 'vitest';
import {
  FormFieldComponent,
  LabelDirective,
  TW_FORM_FIELD_CONTROL,
} from 'ngx-tw/form-field';
import type { ErrorStateMatcher } from 'ngx-tw/core';
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
    />
  `,
})
class StandaloneInputHost {
  readonly type = signal('text');
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly readonly = signal(false);
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
  selector: 'input[testAccessor]',
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
  template: `<input twInput testAccessor />`,
})
class AccessorHost {
  readonly accessor = viewChild.required(TestAccessorDirective);
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
});
