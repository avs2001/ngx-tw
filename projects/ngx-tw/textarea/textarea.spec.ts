import {
  ChangeDetectionStrategy,
  Component,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import { CdkTextareaAutosize } from '@angular/cdk/text-field';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  FormFieldComponent,
  LabelDirective,
  TW_FORM_FIELD_CONTROL,
} from '@cdevhub/ngx-tw/form-field';
import type { ErrorStateMatcher, TwSize } from '@cdevhub/ngx-tw/core';
import { TextareaDirective, type TwTextareaResize } from './textarea';

// ── Host harnesses ──

@Component({
  imports: [TextareaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <textarea
      twTextarea
      [disabled]="disabled()"
      [required]="required()"
      [readonly]="readonly()"
      [size]="size()"
      [rows]="rows()"
      [resize]="resize()"
      [autosize]="autosize()"
      [minRows]="minRows()"
      [maxRows]="maxRows()"
      [maxLength]="maxLength()"
    ></textarea>
  `,
})
class StandaloneTextareaHost {
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly size = signal<TwSize>('md');
  readonly rows = signal(3);
  readonly resize = signal<TwTextareaResize>('vertical');
  readonly autosize = signal(false);
  readonly minRows = signal(1);
  readonly maxRows = signal<number | undefined>(undefined);
  readonly maxLength = signal<number | undefined>(undefined);
  readonly directive = viewChild.required(TextareaDirective);
}

@Component({
  imports: [TextareaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea twTextarea id="my-explicit-textarea"></textarea>`,
})
class ExplicitIdHost {
  readonly directive = viewChild.required(TextareaDirective);
}

@Component({
  imports: [FormFieldComponent, LabelDirective, TextareaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Bio</label>
      <textarea twTextarea></textarea>
    </tw-form-field>
  `,
})
class InFormFieldHost {
  readonly directive = viewChild.required(TextareaDirective);
}

@Component({
  imports: [TextareaDirective, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea twTextarea [formControl]="ctrl"></textarea>`,
})
class ReactiveHost {
  readonly ctrl = new FormControl<string | null>('', {
    validators: [Validators.required, Validators.maxLength(20)],
  });
  readonly directive = viewChild.required(TextareaDirective);
}

@Component({
  imports: [TextareaDirective, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea twTextarea [(ngModel)]="value" required></textarea>`,
})
class TemplateDrivenHost {
  value = '';
  readonly directive = viewChild.required(TextareaDirective);
}

@Component({
  imports: [TextareaDirective, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea twTextarea [formField]="signalForm.bio"></textarea>`,
})
class SignalFormsHost {
  readonly model = signal({ bio: '' });
  readonly signalForm = form(this.model, (p) => {
    required(p.bio);
    minLength(p.bio, 2);
  });
  readonly directive = viewChild.required(TextareaDirective);
}

// ── Helpers ──

function textareaEl<T>(fixture: ComponentFixture<T>): HTMLTextAreaElement {
  return fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
}

function fireInput(el: HTMLTextAreaElement, value: string) {
  el.value = value;
  el.dispatchEvent(new Event('input'));
}

// ── Tests ──

describe('TextareaDirective', () => {
  describe('rendering', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('mounts on <textarea twTextarea> without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
      const el = textareaEl(fixture);
      expect(el).toBeTruthy();
      expect(el.tagName.toLowerCase()).toBe('textarea');
    });

    it('generates a unique id when none provided', () => {
      expect(textareaEl(fixture).id).toMatch(/^tw-input-\d+$/);
    });

    it('applies standalone styling inherited from InputDirective', () => {
      const cls = textareaEl(fixture).className;
      expect(cls).toContain('border');
      expect(cls).toContain('rounded-md');
    });

    it('reports controlType "textarea"', () => {
      expect(fixture.componentInstance.directive().controlType).toBe(
        'textarea',
      );
    });

    it('renders with rows="3" by default', () => {
      expect(textareaEl(fixture).getAttribute('rows')).toBe('3');
    });

    it('applies the default resize-y class (vertical)', () => {
      expect(textareaEl(fixture).classList.contains('resize-y')).toBe(true);
    });
  });

  describe('explicit id', () => {
    it('round-trips an explicit `id` to the host attribute', async () => {
      await TestBed.configureTestingModule({
        imports: [ExplicitIdHost],
      }).compileComponents();
      const ef = TestBed.createComponent(ExplicitIdHost);
      ef.detectChanges();
      expect(textareaEl(ef).id).toBe('my-explicit-textarea');
      expect(ef.componentInstance.directive().id()).toBe('my-explicit-textarea');
    });
  });

  describe('size axis (standalone)', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it.each([
      ['xs', 'px-2', 'py-1', 'text-xs', 'min-h-6'],
      ['sm', 'px-3', 'py-1.5', 'text-sm', 'min-h-8'],
      ['md', 'px-4', 'py-2', 'text-sm', 'min-h-9'],
      ['lg', 'px-5', 'py-2.5', 'text-base', 'min-h-11'],
      ['xl', 'px-6', 'py-3', 'text-base', 'min-h-12'],
    ] as const)(
      'maps size="%s" to %s %s %s %s (padding inherited from InputDirective)',
      (size, px, py, font, minHeight) => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const tokens = textareaEl(fixture).className.split(/\s+/);
        expect(tokens).toContain(px);
        expect(tokens).toContain(py);
        expect(tokens).toContain(font);
        expect(tokens).toContain(minHeight);
      },
    );

    // A textarea is multi-line by definition: it takes a `min-h-*` floor, never
    // a pinned `h-*`, which would stop it growing with its content. Token match
    // rather than substring — `min-h-9` contains `h-9`.
    it.each(['xs', 'sm', 'md', 'lg', 'xl'] as const)(
      'never pins the height at size="%s"',
      (size) => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        const tokens = textareaEl(fixture).className.split(/\s+/);
        expect(tokens.filter((t) => /^h-/.test(t))).toEqual([]);
      },
    );

    // CdkTextareaAutosize caches its line height from the `clientHeight` of a
    // cloned textarea and clears only the clone's *inline* min-height, so a
    // `min-h-*` class would survive onto the clone and inflate the cache.
    it.each([
      ['xs', 'px-2'],
      ['sm', 'px-3'],
      ['md', 'px-4'],
      ['lg', 'px-5'],
      ['xl', 'px-6'],
    ] as const)(
      'drops the height floor at size="%s" when autosize owns the height',
      (size, px) => {
        fixture.componentInstance.size.set(size);
        fixture.componentInstance.autosize.set(true);
        fixture.detectChanges();
        const tokens = textareaEl(fixture).className.split(/\s+/);
        expect(tokens.filter((t) => /^min-h-/.test(t))).toEqual([]);
        // The density half of the size axis survives.
        expect(tokens).toContain(px);
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
      const cls = textareaEl(ff).className;
      expect(cls).toContain('p-0');
      expect(cls).toContain('border-0');
      expect(cls).not.toContain('rounded-md');
    });

    // The wrapper's control row owns the height when the textarea is nested.
    it('emits no height floor when wrapped', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const ff = TestBed.createComponent(InFormFieldHost);
      ff.detectChanges();
      await ff.whenStable();
      const tokens = textareaEl(ff).className.split(/\s+/);
      expect(tokens.filter((t) => /^(min-)?h-/.test(t))).toEqual([]);
    });
  });

  describe('rows / minRows / maxRows', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('reflects `rows` to the native attribute', () => {
      fixture.componentInstance.rows.set(7);
      fixture.detectChanges();
      expect(textareaEl(fixture).getAttribute('rows')).toBe('7');
    });

    it('forwards minRows to the underlying CdkTextareaAutosize', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.componentInstance.minRows.set(2);
      fixture.detectChanges();
      const cdk = fixture.debugElement
        .query((n) => !!n.injector.get(CdkTextareaAutosize, null))
        .injector.get(CdkTextareaAutosize);
      expect(cdk.minRows).toBe(2);
    });

    it('forwards maxRows to the underlying CdkTextareaAutosize', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.componentInstance.maxRows.set(6);
      fixture.detectChanges();
      const cdk = fixture.debugElement
        .query((n) => !!n.injector.get(CdkTextareaAutosize, null))
        .injector.get(CdkTextareaAutosize);
      expect(cdk.maxRows).toBe(6);
    });
  });

  describe('autosize', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;
    let cdk: CdkTextareaAutosize;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
      cdk = fixture.debugElement
        .query((n) => !!n.injector.get(CdkTextareaAutosize, null))
        .injector.get(CdkTextareaAutosize);
    });

    it('disables the CDK autosize directive when autosize=false (default)', () => {
      expect(cdk.enabled).toBe(false);
    });

    it('enables the CDK autosize directive when autosize=true', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.detectChanges();
      expect(cdk.enabled).toBe(true);
    });

    it('toggles `enabled` when the autosize input flips', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.detectChanges();
      expect(cdk.enabled).toBe(true);
      fixture.componentInstance.autosize.set(false);
      fixture.detectChanges();
      expect(cdk.enabled).toBe(false);
    });

    it('resizeToFitContent() proxies to the CDK directive when autosize is on', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.detectChanges();
      const spy = vi.spyOn(cdk, 'resizeToFitContent');
      fixture.componentInstance.directive().resizeToFitContent(true);
      expect(spy).toHaveBeenCalledWith(true);
    });

    it('resizeToFitContent() is a no-op when autosize is off', () => {
      const spy = vi.spyOn(cdk, 'resizeToFitContent');
      fixture.componentInstance.directive().resizeToFitContent();
      expect(spy).not.toHaveBeenCalled();
    });
  });

  describe('resize axis', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it.each([
      ['none', 'resize-none'],
      ['vertical', 'resize-y'],
      ['both', 'resize'],
    ] as const)('maps resize="%s" to %s', (val, expected) => {
      fixture.componentInstance.resize.set(val);
      fixture.detectChanges();
      const cls = textareaEl(fixture).className;
      expect(cls).toContain(expected);
    });

    it('forces resize-none when autosize is on, regardless of resize input', () => {
      fixture.componentInstance.autosize.set(true);
      fixture.componentInstance.resize.set('both');
      fixture.detectChanges();
      const cls = textareaEl(fixture).className;
      expect(cls).toContain('resize-none');
      expect(cls).not.toContain('resize-y');
      // The bare `resize` utility shouldn't be on the element because
      // twMerge collapses with resize-none.
    });
  });

  describe('maxLength', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('applies the native maxlength attribute when defined', () => {
      fixture.componentInstance.maxLength.set(120);
      fixture.detectChanges();
      expect(textareaEl(fixture).getAttribute('maxlength')).toBe('120');
    });

    it('removes the maxlength attribute when undefined', () => {
      fixture.componentInstance.maxLength.set(120);
      fixture.detectChanges();
      expect(textareaEl(fixture).hasAttribute('maxlength')).toBe(true);
      fixture.componentInstance.maxLength.set(undefined);
      fixture.detectChanges();
      expect(textareaEl(fixture).hasAttribute('maxlength')).toBe(false);
    });
  });

  describe('valueLength signal', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('starts at 0 for an empty textarea', () => {
      expect(fixture.componentInstance.directive().valueLength()).toBe(0);
    });

    it('updates on input events', () => {
      fireInput(textareaEl(fixture), 'hello');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().valueLength()).toBe(5);
    });

    it('updates again as more is typed and shrinks when text is removed', () => {
      const el = textareaEl(fixture);
      fireInput(el, 'multi\nline content');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().valueLength()).toBe(
        'multi\nline content'.length,
      );
      fireInput(el, 'short');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().valueLength()).toBe(5);
    });
  });

  describe('value + empty tracking', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('starts empty', () => {
      expect(fixture.componentInstance.directive().empty()).toBe(true);
      expect(fixture.componentInstance.directive().value()).toBeNull();
    });

    it('becomes non-empty after user input', () => {
      fireInput(textareaEl(fixture), 'multi\nline');
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().empty()).toBe(false);
      expect(fixture.componentInstance.directive().value()).toBe('multi\nline');
    });
  });

  describe('disabled & readonly', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('disables the native textarea when [disabled]="true"', () => {
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(textareaEl(fixture).disabled).toBe(true);
      expect(fixture.componentInstance.directive().disabled()).toBe(true);
    });

    it('sets aria-required when [required]="true"', () => {
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(textareaEl(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('applies the native readonly attribute when [readonly]="true"', async () => {
      fixture.componentInstance.readonly.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(textareaEl(fixture).getAttribute('readonly')).toBe('true');
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

    it('marks as required when bound control has Validators.required', () => {
      expect(fixture.componentInstance.directive().required()).toBe(true);
    });

    it('disables via FormControl.disable()', async () => {
      fixture.componentInstance.ctrl.disable();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.directive().disabled()).toBe(true);
      expect(textareaEl(fixture).disabled).toBe(true);
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
      expect(textareaEl(fixture).getAttribute('aria-invalid')).toBe('true');
    });

    it('writes user input back to the form control', async () => {
      fireInput(textareaEl(fixture), 'some bio text');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.ctrl.value).toBe('some bio text');
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

      const el = textareaEl(fixture);
      fireInput(el, 'multi\nline\nvalue');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.value).toBe('multi\nline\nvalue');
      expect(fixture.componentInstance.directive().required()).toBe(true);
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

      expect(fixture.componentInstance.directive().errorState()).toBe(false);

      const el = textareaEl(fixture);
      el.focus();
      el.dispatchEvent(new FocusEvent('focus'));
      el.blur();
      el.dispatchEvent(new FocusEvent('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      expect(fixture.componentInstance.directive().errorState()).toBe(true);
      expect(el.getAttribute('aria-invalid')).toBe('true');
    });

    it('reflects field value updates from user input', async () => {
      await TestBed.configureTestingModule({
        imports: [SignalFormsHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SignalFormsHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = textareaEl(fixture);
      fireInput(el, 'Ada');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.signalForm.bio().value()).toBe('Ada');
    });
  });

  describe('inside tw-form-field', () => {
    it('registers with the form-field via TW_FORM_FIELD_CONTROL', async () => {
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

      const queried = fixture.debugElement.query(
        (n) => !!n.injector.get(TW_FORM_FIELD_CONTROL, null),
      );
      expect(queried).toBeTruthy();
    });

    it('strips chrome and surfaces controlType=textarea on the form-field', async () => {
      await TestBed.configureTestingModule({
        imports: [InFormFieldHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(InFormFieldHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const el = textareaEl(fixture);
      expect(el.classList.contains('border-0')).toBe(true);
      expect(el.classList.contains('p-0')).toBe(true);
      expect(fixture.componentInstance.directive().controlType).toBe(
        'textarea',
      );

      // Form-field host carries the controlType class
      const formFieldEl = fixture.nativeElement.querySelector('tw-form-field');
      expect(formFieldEl.classList.contains('tw-form-field-type-textarea')).toBe(true);
    });
  });

  describe('aria-describedby', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('writes ids on the native element via setDescribedByIds', () => {
      fixture.componentInstance.directive().setDescribedByIds(['a', 'b']);
      expect(textareaEl(fixture).getAttribute('aria-describedby')).toBe('a b');
    });

    it('removes the attribute when an empty list is passed', () => {
      fixture.componentInstance.directive().setDescribedByIds(['x']);
      fixture.componentInstance.directive().setDescribedByIds([]);
      expect(textareaEl(fixture).hasAttribute('aria-describedby')).toBe(false);
    });
  });

  describe('focus', () => {
    let fixture: ComponentFixture<StandaloneTextareaHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [StandaloneTextareaHost],
      }).compileComponents();
      fixture = TestBed.createComponent(StandaloneTextareaHost);
      fixture.detectChanges();
    });

    it('reflects focus via the `focused` signal', async () => {
      const el = textareaEl(fixture);
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

    it('focus() method moves focus to the textarea', () => {
      fixture.componentInstance.directive().focus();
      expect(document.activeElement).toBe(textareaEl(fixture));
    });

    it('has the canonical focus-visible outline classes', () => {
      const cls = textareaEl(fixture).className;
      expect(cls).toContain('focus-visible:outline-2');
      expect(cls).toContain('focus-visible:outline-primary-500');
    });
  });

  describe('custom error-state matcher', () => {
    it('uses a per-instance matcher override', async () => {
      const alwaysError: ErrorStateMatcher = {
        isErrorState: () => true,
      };

      @Component({
        imports: [TextareaDirective],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<textarea twTextarea [errorStateMatcher]="matcher"></textarea>`,
      })
      class Host {
        readonly matcher = alwaysError;
        readonly directive = viewChild.required(TextareaDirective);
      }

      await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
      const fixture = TestBed.createComponent(Host);
      fixture.detectChanges();
      expect(fixture.componentInstance.directive().errorState()).toBe(true);
    });
  });
});
