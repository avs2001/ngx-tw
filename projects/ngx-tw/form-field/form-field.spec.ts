import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TwColor } from 'ngx-tw/core';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
  PrefixDirective,
  SuffixDirective,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from './form-field';
import type { FormFieldAppearance, FloatLabel } from './form-field';

// ── Fake control directive implementing FormFieldControl ──

@Directive({
  selector: '[fakeControl]',
  providers: [
    { provide: TW_FORM_FIELD_CONTROL, useExisting: FakeControlDirective },
  ],
  host: {
    '[attr.id]': 'id()',
  },
})
class FakeControlDirective extends FormFieldControl<string> {
  readonly id = signal('fake-control-id');
  readonly value = signal<string | null>(null);
  readonly focused = signal(false);
  readonly empty = signal(true);
  readonly disabled = signal(false);
  readonly required = signal(false);
  readonly errorState = signal(false);
  readonly controlType = 'fake';
  readonly userAriaDescribedBy = signal<string | undefined>(undefined);

  readonly describedByIds = signal<string[]>([]);
  readonly containerClickCount = signal(0);

  setDescribedByIds(ids: string[]): void {
    this.describedByIds.set(ids);
  }
  onContainerClick(_event: MouseEvent): void {
    this.containerClickCount.update((n) => n + 1);
  }
}

// ── Test host components ──

@Component({
  imports: [
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    PrefixDirective,
    SuffixDirective,
    FakeControlDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field
      [appearance]="appearance()"
      [color]="color()"
      [floatLabel]="floatLabel()"
      [hideRequiredMarker]="hideRequiredMarker()"
      [hintAlign]="hintAlign()">
      @if (showLabel()) {
        <label twLabel>Email</label>
      }
      @if (showPrefix()) {
        <span slot="prefix">$</span>
      }
      <input fakeControl />
      @if (showSuffix()) {
        <span slot="suffix">USD</span>
      }
      @if (showHint()) {
        <span twHint>Hint text</span>
      }
      @if (showHintEnd()) {
        <span twHint align="end">End hint</span>
      }
      @if (showError()) {
        <span twError>Error text</span>
      }
      @if (showError2()) {
        <span twError>Second error</span>
      }
    </tw-form-field>
  `,
})
class TestHost {
  readonly appearance = signal<FormFieldAppearance>('outline');
  readonly color = signal<TwColor>('primary');
  readonly floatLabel = signal<FloatLabel>('auto');
  readonly hideRequiredMarker = signal(false);
  readonly hintAlign = signal<'start' | 'end'>('start');
  readonly showLabel = signal(true);
  readonly showPrefix = signal(false);
  readonly showSuffix = signal(false);
  readonly showHint = signal(true);
  readonly showHintEnd = signal(false);
  readonly showError = signal(false);
  readonly showError2 = signal(false);

  readonly fake = viewChild.required(FakeControlDirective);
}

@Component({
  imports: [FormFieldComponent, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>No control</label>
    </tw-form-field>
  `,
})
class NoControlHost {}

@Component({
  imports: [
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    FakeControlDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Label</label>
      <input fakeControl />
      <span twHint>Hint one</span>
      <span twHint>Hint two</span>
    </tw-form-field>
  `,
})
class DuplicateHintHost {}

// ── Helpers ──

function controlWrapper(fixture: ComponentFixture<TestHost>): HTMLElement {
  const children = fixture.nativeElement
    .querySelector('tw-form-field')
    .children as HTMLCollection;
  return children[0] as HTMLElement;
}

function subscriptWrapper(fixture: ComponentFixture<TestHost>): HTMLElement {
  const children = fixture.nativeElement
    .querySelector('tw-form-field')
    .children as HTMLCollection;
  return children[1] as HTMLElement;
}

function labelEl(fixture: ComponentFixture<TestHost>): HTMLElement | null {
  return fixture.nativeElement.querySelector('label[twLabel]');
}

// ── Tests ──

describe('FormFieldComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    it('creates without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
      expect(fixture.nativeElement.querySelector('tw-form-field')).toBeTruthy();
    });

    it('renders the projected control', () => {
      expect(fixture.nativeElement.querySelector('input[fakeControl]')).toBeTruthy();
    });

    it('applies a controlType class hook to the host', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      expect(host.className).toContain('tw-form-field-type-fake');
    });

    it('renders the subscript wrapper even with no hint or error', async () => {
      fixture.componentInstance.showHint.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(subscriptWrapper(fixture)).toBeTruthy();
      expect(subscriptWrapper(fixture).className).toContain('min-h-5');
    });
  });

  describe('missing control', () => {
    it('throws in dev mode when no control is projected', async () => {
      await TestBed.configureTestingModule({ imports: [NoControlHost] }).compileComponents();
      const fixture = TestBed.createComponent(NoControlHost);
      expect(() => fixture.detectChanges()).toThrowError(/requires a child control/i);
    });
  });

  describe('appearance input', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    it('renders outline by default', () => {
      const wrapper = controlWrapper(fixture);
      expect(wrapper.className).toContain('border');
      expect(wrapper.className).toContain('border-border');
      expect(wrapper.className).not.toContain('bg-surface-muted');
    });

    it('renders filled when appearance is "filled"', () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.detectChanges();
      const wrapper = controlWrapper(fixture);
      expect(wrapper.className).toContain('bg-surface-muted');
      expect(wrapper.className).toContain('border-b');
    });
  });

  describe('color input', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    const colors: TwColor[] = [
      'primary',
      'secondary',
      'accent',
      'info',
      'success',
      'warning',
      'error',
    ];
    for (const color of colors) {
      it(`renders ${color} color without errors`, async () => {
        fixture.componentInstance.color.set(color);
        fixture.componentInstance.fake().focused.set(true);
        fixture.detectChanges();
        await fixture.whenStable();
        const wrapper = controlWrapper(fixture);
        expect(wrapper.className).toContain(`border-${color}-500`);
      });
    }

    it('renders neutral color as border-border-strong when focused', async () => {
      fixture.componentInstance.color.set('neutral');
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const wrapper = controlWrapper(fixture);
      expect(wrapper.className).toContain('border-border-strong');
    });
  });

  describe('required marker', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    it('is absent when control is not required', async () => {
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[aria-hidden="true"]')).toBeNull();
    });

    it('appears when control.required() is true', async () => {
      fixture.componentInstance.fake().required.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const marker = fixture.nativeElement.querySelector('span[aria-hidden="true"]');
      expect(marker).toBeTruthy();
      expect(marker.textContent).toContain('*');
    });

    it('is hidden when hideRequiredMarker is true even if control is required', async () => {
      fixture.componentInstance.fake().required.set(true);
      fixture.componentInstance.hideRequiredMarker.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('span[aria-hidden="true"]')).toBeNull();
    });
  });

  describe('label association', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    it('sets label `for` to the control id', async () => {
      await fixture.whenStable();
      const label = labelEl(fixture);
      const fake = fixture.componentInstance.fake();
      expect(label?.getAttribute('for')).toBe(fake.id());
    });

    it('updates label `for` when the control id changes', async () => {
      fixture.componentInstance.fake().id.set('new-id');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelEl(fixture)?.getAttribute('for')).toBe('new-id');
    });

    it('gives the label a generated id', () => {
      expect(labelEl(fixture)?.getAttribute('id')).toMatch(/^tw-form-field-label-\d+$/);
    });
  });

  describe('aria-describedby wiring', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('sets hint ids on the control when hints are present', () => {
      const fake = fixture.componentInstance.fake();
      expect(fake.describedByIds().length).toBe(1);
      expect(fake.describedByIds()[0]).toMatch(/^tw-form-field-hint-\d+$/);
    });

    it('swaps to error ids when the control enters error state', async () => {
      const fake = fixture.componentInstance.fake();
      fixture.componentInstance.showError.set(true);
      fake.errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fake.describedByIds().length).toBe(1);
      expect(fake.describedByIds()[0]).toMatch(/^tw-form-field-error-\d+$/);
    });

    it('includes multiple error ids when multiple errors are projected', async () => {
      const fake = fixture.componentInstance.fake();
      fixture.componentInstance.showError.set(true);
      fixture.componentInstance.showError2.set(true);
      fake.errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fake.describedByIds().length).toBe(2);
    });

    it('preserves userAriaDescribedBy ids in the merged output', async () => {
      const fake = fixture.componentInstance.fake();
      fake.userAriaDescribedBy.set('user-id-1 user-id-2');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fake.describedByIds()).toContain('user-id-1');
      expect(fake.describedByIds()).toContain('user-id-2');
    });
  });

  describe('error directive a11y', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showError.set(true);
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies role="alert" to each error element', () => {
      const errors = fixture.nativeElement.querySelectorAll('[twError]');
      expect(errors.length).toBeGreaterThan(0);
      for (const el of errors as NodeListOf<HTMLElement>) {
        expect(el.getAttribute('role')).toBe('alert');
        expect(el.getAttribute('aria-live')).toBe('polite');
      }
    });

    it('gives each error a generated id', () => {
      const err = fixture.nativeElement.querySelector('[twError]') as HTMLElement;
      expect(err.getAttribute('id')).toMatch(/^tw-form-field-error-\d+$/);
    });
  });

  describe('floating label', () => {
    let fixture: ComponentFixture<TestHost>;

    function labelWrapperEl(): HTMLElement {
      const label = fixture.nativeElement.querySelector('label[twLabel]');
      return label?.parentElement as HTMLElement;
    }

    function labelFontSizeEl(): HTMLElement {
      return fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement;
    }

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('renders label in resting position when empty and not focused', () => {
      const wrapper = labelWrapperEl();
      expect(wrapper.className).toContain('top-1/2');
      expect(labelFontSizeEl().className).toContain('text-sm');
    });

    it('floats the label when the control is focused', async () => {
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().className).toContain('text-xs');
      expect(labelWrapperEl().className).not.toContain('top-1/2');
    });

    it('floats the label when the control is not empty', async () => {
      fixture.componentInstance.fake().empty.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().className).toContain('text-xs');
    });

    it('always floats when floatLabel="always"', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().className).toContain('text-xs');
    });

    it('applies the outline notch (bg-surface) when floated and outline', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelWrapperEl().className).toContain('bg-surface');
    });

    it('uses in-surface position for filled floated (no notch)', async () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelWrapperEl().className).not.toContain('bg-surface');
      expect(labelWrapperEl().className).toContain('top-1');
    });

    it('does not force the label to float just because a prefix is present', async () => {
      fixture.componentInstance.showPrefix.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().className).toContain('text-sm');
    });

    it('still floats the label on focus when a prefix is present', async () => {
      fixture.componentInstance.showPrefix.set(true);
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().className).toContain('text-xs');
    });

    it('pins the floated label to the container left edge (0.5rem)', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelWrapperEl().style.left).toBe('0.5rem');
    });
  });

  describe('placeholder hiding', () => {
    let fixture: ComponentFixture<TestHost>;

    function infixEl(): HTMLElement {
      return fixture.nativeElement.querySelector(
        'tw-form-field > div > div',
      ) as HTMLElement;
    }

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('hides the input placeholder when the label is resting', () => {
      expect(infixEl().className).toContain('[&_input::placeholder]:opacity-0');
    });

    it('does not hide the placeholder when the label is floated', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(infixEl().className).not.toContain('[&_input::placeholder]:opacity-0');
    });

    it('does not hide the placeholder when there is no label', async () => {
      fixture.componentInstance.showLabel.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(infixEl().className).not.toContain('[&_input::placeholder]:opacity-0');
    });
  });

  describe('subscript swap', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('shows hints when not in error state', () => {
      expect(fixture.nativeElement.querySelector('[twHint]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[twError]')).toBeNull();
    });

    it('shows errors and hides hints when errorState is true and errors are projected', async () => {
      fixture.componentInstance.showError.set(true);
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[twError]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[twHint]')).toBeNull();
    });

    it('still shows hints when errorState is true but no error is projected', async () => {
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('[twHint]')).toBeTruthy();
    });
  });

  describe('container click', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('calls control.onContainerClick when the form-field host is clicked', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      host.click();
      expect(fixture.componentInstance.fake().containerClickCount()).toBe(1);
    });
  });

  describe('duplicate hint alignment', () => {
    it('throws in dev mode when two start-aligned hints are projected', async () => {
      await TestBed.configureTestingModule({ imports: [DuplicateHintHost] }).compileComponents();
      const fixture = TestBed.createComponent(DuplicateHintHost);
      expect(() => fixture.detectChanges()).toThrowError(/only one twHint per alignment/i);
    });
  });

  describe('hint alignment', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showHint.set(true);
      fixture.componentInstance.showHintEnd.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies ml-auto to an end-aligned hint', () => {
      const endHint = fixture.nativeElement.querySelector('[twHint][align="end"]') as HTMLElement;
      expect(endHint.className).toContain('ml-auto');
    });

    it('does not apply ml-auto to a start-aligned hint', () => {
      const startHint = fixture.nativeElement.querySelector('[twHint]:not([align])') as HTMLElement;
      expect(startHint.className).not.toContain('ml-auto');
    });
  });

  describe('disabled state', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies opacity-50 and pointer-events-none when control.disabled() is true', async () => {
      fixture.componentInstance.fake().disabled.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      expect(host.className).toContain('opacity-50');
      expect(host.className).toContain('pointer-events-none');
    });
  });

  describe('invalid state border', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies error border on the outline appearance when errorState is true', async () => {
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(controlWrapper(fixture).className).toContain('border-error-500');
    });

    it('applies a thicker error bottom border on the filled appearance when errorState is true', async () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(controlWrapper(fixture).className).toContain('border-b-2');
      expect(controlWrapper(fixture).className).toContain('border-error-500');
    });
  });

  describe('prefix and suffix', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
    });

    it('applies prefix slot classes to projected prefix element', async () => {
      fixture.componentInstance.showPrefix.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const prefix = fixture.nativeElement.querySelector('[slot="prefix"]') as HTMLElement;
      expect(prefix).toBeTruthy();
      expect(prefix.className).toContain('shrink-0');
    });

    it('applies suffix slot classes to projected suffix element', async () => {
      fixture.componentInstance.showSuffix.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const suffix = fixture.nativeElement.querySelector('[slot="suffix"]') as HTMLElement;
      expect(suffix).toBeTruthy();
      expect(suffix.className).toContain('shrink-0');
    });
  });
});
