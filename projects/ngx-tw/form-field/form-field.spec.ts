import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  signal,
  viewChild,
} from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
  PrefixDirective,
  SuffixDirective,
  PrefixIconDirective,
  SuffixIconDirective,
  FormFieldControl,
  TW_FORM_FIELD_CONTROL,
} from './form-field';
import type {
  FormFieldAppearance,
  FloatLabel,
  SubscriptSizing,
} from './form-field';

// ── Fake control directive implementing FormFieldControl ──

@Directive({
  selector: '[twFakeControl]',
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
  override readonly errors = signal<Record<string, unknown> | null>(null);
  readonly controlType = 'fake';
  readonly userAriaDescribedBy = signal<string | undefined>(undefined);
  override readonly userAriaLabelledby = signal<string | undefined>(undefined);

  readonly describedByIds = signal<string[]>([]);
  readonly labelledByIds = signal<string[]>([]);
  readonly containerClickCount = signal(0);

  setDescribedByIds(ids: string[]): void {
    this.describedByIds.set(ids);
  }
  override setLabelledByIds(ids: string[]): void {
    this.labelledByIds.set(ids);
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
    PrefixIconDirective,
    SuffixIconDirective,
    FakeControlDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field
      [appearance]="appearance()"
      [size]="size()"
      [color]="color()"
      [floatLabel]="floatLabel()"
      [subscriptSizing]="subscriptSizing()"
      [hideRequiredMarker]="hideRequiredMarker()"
      [hintAlign]="hintAlign()">
      @if (showLabel()) {
        <label twLabel>Email</label>
      }
      @if (showPrefix()) {
        <span twPrefix>$</span>
      }
      @if (showPrefixIcon()) {
        <svg twPrefixIcon viewBox="0 0 20 20"><path d="M0 0"/></svg>
      }
      <input twFakeControl />
      @if (showSuffix()) {
        <span twSuffix>USD</span>
      }
      @if (showSuffixIcon()) {
        <svg twSuffixIcon viewBox="0 0 20 20"><path d="M0 0"/></svg>
      }
      @if (showHint()) {
        <span twHint>Hint text</span>
      }
      @if (showHintEnd()) {
        <span twHint align="end">End hint</span>
      }
      @if (showError()) {
        <span twError [match]="errorMatch()">Error text</span>
      }
      @if (showError2()) {
        <span twError [match]="error2Match()">Second error</span>
      }
    </tw-form-field>
  `,
})
class TestHost {
  readonly appearance = signal<FormFieldAppearance>('outline');
  readonly size = signal<TwSize>('md');
  readonly color = signal<TwColor>('primary');
  readonly floatLabel = signal<FloatLabel>('auto');
  readonly subscriptSizing = signal<SubscriptSizing>('fixed');
  readonly hideRequiredMarker = signal(false);
  readonly hintAlign = signal<'start' | 'end'>('start');
  readonly showLabel = signal(true);
  readonly showPrefix = signal(false);
  readonly showPrefixIcon = signal(false);
  readonly showSuffix = signal(false);
  readonly showSuffixIcon = signal(false);
  readonly showHint = signal(true);
  readonly showHintEnd = signal(false);
  readonly showError = signal(false);
  readonly showError2 = signal(false);
  readonly errorMatch = signal<string | undefined>(undefined);
  readonly error2Match = signal<string | undefined>(undefined);

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
      <input twFakeControl />
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
      expect(fixture.nativeElement.querySelector('input[twFakeControl]')).toBeTruthy();
    });

    it('applies a controlType class hook to the host', () => {
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      expect(host.classList.contains('tw-form-field-type-fake')).toBe(true);
    });

    it('renders the subscript wrapper even with no hint or error', async () => {
      fixture.componentInstance.showHint.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(subscriptWrapper(fixture)).toBeTruthy();
      expect(subscriptWrapper(fixture).classList.contains('min-h-5')).toBe(true);
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
      expect(wrapper.classList.contains('border')).toBe(true);
      expect(wrapper.classList.contains('border-border')).toBe(true);
      expect(wrapper.classList.contains('bg-surface-muted')).toBe(false);
    });

    it('renders filled when appearance is "filled"', () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.detectChanges();
      const wrapper = controlWrapper(fixture);
      expect(wrapper.classList.contains('bg-surface-muted')).toBe(true);
      expect(wrapper.classList.contains('border-b')).toBe(true);
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
        expect(wrapper.classList.contains(`border-${color}-border`)).toBe(true);
      });
    }

    it('renders neutral color as border-border-strong when focused', async () => {
      fixture.componentInstance.color.set('neutral');
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const wrapper = controlWrapper(fixture);
      expect(wrapper.classList.contains('border-border-strong')).toBe(true);
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

  describe('error match filtering', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showError.set(true);
      fixture.componentInstance.showError2.set(true);
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    function errorEls(): HTMLElement[] {
      return Array.from(
        fixture.nativeElement.querySelectorAll('[twError]'),
      ) as HTMLElement[];
    }

    it('shows a bare twError (no match) whenever the control is in error state', async () => {
      // No match on either, no errors map — both should be visible.
      const [first, second] = errorEls();
      expect(first.classList.contains('hidden')).toBe(false);
      expect(second.classList.contains('hidden')).toBe(false);
    });

    it('shows a matching twError when the matched key is active', async () => {
      fixture.componentInstance.errorMatch.set('required');
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ required: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const [first, second] = errorEls();
      expect(first.classList.contains('hidden')).toBe(false);
      expect(second.classList.contains('hidden')).toBe(true);
    });

    it('switches which twError shows when the active error key changes', async () => {
      fixture.componentInstance.errorMatch.set('required');
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ required: true });
      fixture.detectChanges();
      await fixture.whenStable();

      fixture.componentInstance.fake().errors.set({ email: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const [first, second] = errorEls();
      expect(first.classList.contains('hidden')).toBe(true);
      expect(second.classList.contains('hidden')).toBe(false);
    });

    it('hides every matched twError when no error key matches', async () => {
      fixture.componentInstance.errorMatch.set('required');
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ minlength: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const [first, second] = errorEls();
      expect(first.classList.contains('hidden')).toBe(true);
      expect(second.classList.contains('hidden')).toBe(true);
    });

    it('lets a bare twError act as a fallback alongside matched ones', async () => {
      // First is bare (no match), second matches "email".
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ minlength: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const [first, second] = errorEls();
      expect(first.classList.contains('hidden')).toBe(false);
      expect(second.classList.contains('hidden')).toBe(true);
    });

    it('excludes hidden errors from aria-describedby ids on the control', async () => {
      fixture.componentInstance.errorMatch.set('required');
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ required: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const ids = fixture.componentInstance.fake().describedByIds();
      const visibleId = errorEls()[0].id;
      const hiddenId = errorEls()[1].id;
      expect(ids).toContain(visibleId);
      expect(ids).not.toContain(hiddenId);
    });

    it('re-runs aria-describedby when the active error key changes', async () => {
      fixture.componentInstance.errorMatch.set('required');
      fixture.componentInstance.error2Match.set('email');
      fixture.componentInstance.fake().errors.set({ required: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const initialId = errorEls()[0].id;
      expect(fixture.componentInstance.fake().describedByIds()).toContain(initialId);

      fixture.componentInstance.fake().errors.set({ email: true });
      fixture.detectChanges();
      await fixture.whenStable();
      const switchedId = errorEls()[1].id;
      const ids = fixture.componentInstance.fake().describedByIds();
      expect(ids).toContain(switchedId);
      expect(ids).not.toContain(initialId);
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
      expect(wrapper.classList.contains('top-1/2')).toBe(true);
      expect(labelFontSizeEl().classList.contains('text-sm')).toBe(true);
    });

    it('floats the label when the control is focused', async () => {
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().classList.contains('text-xs')).toBe(true);
      expect(labelWrapperEl().classList.contains('top-1/2')).toBe(false);
    });

    it('floats the label when the control is not empty', async () => {
      fixture.componentInstance.fake().empty.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().classList.contains('text-xs')).toBe(true);
    });

    it('always floats when floatLabel="always"', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().classList.contains('text-xs')).toBe(true);
    });

    it('applies the outline notch (bg-surface) when floated and outline', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelWrapperEl().classList.contains('bg-surface')).toBe(true);
    });

    it('uses in-surface position for filled floated (no notch)', async () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelWrapperEl().classList.contains('bg-surface')).toBe(false);
      expect(labelWrapperEl().classList.contains('top-1')).toBe(true);
    });

    it('does not force the label to float just because a prefix is present', async () => {
      fixture.componentInstance.showPrefix.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().classList.contains('text-sm')).toBe(true);
    });

    it('still floats the label on focus when a prefix is present', async () => {
      fixture.componentInstance.showPrefix.set(true);
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(labelFontSizeEl().classList.contains('text-xs')).toBe(true);
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
      expect(infixEl().classList.contains('[&_input::placeholder]:opacity-0')).toBe(true);
    });

    it('does not hide the placeholder when the label is floated', async () => {
      fixture.componentInstance.floatLabel.set('always');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(infixEl().classList.contains('[&_input::placeholder]:opacity-0')).toBe(false);
    });

    it('does not hide the placeholder when there is no label', async () => {
      fixture.componentInstance.showLabel.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(infixEl().classList.contains('[&_input::placeholder]:opacity-0')).toBe(false);
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
    it('logs a dev-mode error when two start-aligned hints are projected', async () => {
      await TestBed.configureTestingModule({ imports: [DuplicateHintHost] }).compileComponents();
      const fixture = TestBed.createComponent(DuplicateHintHost);
      const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
      try {
        fixture.detectChanges();
        await fixture.whenStable();
        expect(spy).toHaveBeenCalledWith(
          expect.stringMatching(/only one twHint per alignment/i),
        );
      } finally {
        spy.mockRestore();
      }
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
      expect(endHint.classList.contains('ml-auto')).toBe(true);
    });

    it('does not apply ml-auto to a start-aligned hint', () => {
      const startHint = fixture.nativeElement.querySelector('[twHint]:not([align])') as HTMLElement;
      expect(startHint.classList.contains('ml-auto')).toBe(false);
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

    it('dims the control row and blocks pointer interaction when control.disabled() is true', async () => {
      fixture.componentInstance.fake().disabled.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      // The wash is on the control row; the pointer block stays on the host so
      // clicks on the subscript row cannot reach `onContainerClick`.
      expect(controlWrapper(fixture).classList.contains('opacity-50')).toBe(true);
      expect(host.classList.contains('pointer-events-none')).toBe(true);
    });

    // SC 1.4.3 regression guard. The wash used to sit on the host, which meant
    // it composited the subscript row too: `text-fg-muted` (7.56:1 at rest)
    // measured 2.34:1 in light and 3.92:1 in dark once halved. A hint describes
    // the control rather than being part of it, so it does not inherit 1.4.3's
    // inactive-component exemption — and no foreground token can survive 50%
    // alpha anyway (pure black at 50% over white is 3.95:1). Asserting on the
    // utility is deliberate here: the utility IS the contrast behaviour, and
    // jsdom computes no styles to observe instead.
    it('does not dim the host, so hint text keeps full contrast while disabled', async () => {
      fixture.componentInstance.fake().disabled.set(true);
      fixture.detectChanges();
      await fixture.whenStable();

      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      expect(host.classList.contains('opacity-50')).toBe(false);

      const hint = fixture.nativeElement.querySelector('[twHint]') as HTMLElement;
      expect(hint).toBeTruthy();
      for (
        let el: HTMLElement | null = hint;
        el && el !== host.parentElement;
        el = el.parentElement
      ) {
        expect(el.classList.contains('opacity-50')).toBe(false);
      }
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
      expect(controlWrapper(fixture).classList.contains('border-error-border')).toBe(true);
    });

    it('applies a thicker error bottom border on the filled appearance when errorState is true', async () => {
      fixture.componentInstance.appearance.set('filled');
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(controlWrapper(fixture).classList.contains('border-b-2')).toBe(true);
      expect(controlWrapper(fixture).classList.contains('border-error-border')).toBe(true);
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
      const prefix = fixture.nativeElement.querySelector('[twPrefix]') as HTMLElement;
      expect(prefix).toBeTruthy();
      expect(prefix.classList.contains('shrink-0')).toBe(true);
    });

    it('applies suffix slot classes to projected suffix element', async () => {
      fixture.componentInstance.showSuffix.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const suffix = fixture.nativeElement.querySelector('[twSuffix]') as HTMLElement;
      expect(suffix).toBeTruthy();
      expect(suffix.classList.contains('shrink-0')).toBe(true);
    });
  });

  describe('size input', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    // Horizontal padding plus the control-height floor. The floor is the load-
    // bearing half: it is what makes a wrapped control the same height as the
    // same control standalone (see `docs/vertical-rhythm.md`). Vertical padding
    // is deliberately NOT asserted — it sits a half-step below the nominal
    // scale purely so the floor binds, and pinning it here would freeze an
    // implementation detail. The rendered height itself is enforced end-to-end
    // by `e2e/specs/02-cross-cutting/vertical-rhythm.spec.ts`, which jsdom
    // cannot do because it performs no layout.
    const outlineSizing: [TwSize, string, string][] = [
      ['xs', 'px-2', 'min-h-6'],
      ['sm', 'px-3', 'min-h-8'],
      ['md', 'px-3', 'min-h-9'],
      ['lg', 'px-4', 'min-h-11'],
      ['xl', 'px-5', 'min-h-12'],
    ];
    for (const [size, px, minH] of outlineSizing) {
      it(`applies ${px} and the ${minH} control-height floor for size="${size}"`, async () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        await fixture.whenStable();
        const classes = controlWrapper(fixture).className.split(/\s+/);
        expect(classes).toContain(px);
        expect(classes).toContain(minH);
      });
    }

    const filledPaddings: [TwSize, string, string, string][] = [
      ['xs', 'px-2', 'pt-5', 'pb-1'],
      ['sm', 'px-3', 'pt-5', 'pb-1.5'],
      ['md', 'px-3', 'pt-6', 'pb-2'],
      ['lg', 'px-4', 'pt-7', 'pb-2.5'],
      ['xl', 'px-5', 'pt-8', 'pb-3'],
    ];
    for (const [size, px, pt, pb] of filledPaddings) {
      it(`applies ${px} ${pt} ${pb} on the filled control wrapper for size="${size}"`, async () => {
        fixture.componentInstance.appearance.set('filled');
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        await fixture.whenStable();
        const wrapper = controlWrapper(fixture);
        expect(wrapper.classList.contains(px)).toBe(true);
        expect(wrapper.classList.contains(pt)).toBe(true);
        expect(wrapper.classList.contains(pb)).toBe(true);
      });
    }

    // Regression: the `size` variants used to be empty and the nested control
    // strips its own `text-*`, so the control row inherited the ambient 16px
    // line box at every size — the size axis did nothing vertically.
    const controlRowFonts: [TwSize, string][] = [
      ['xs', 'text-xs'],
      ['sm', 'text-sm'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
      ['xl', 'text-base'],
    ];
    for (const [size, fontClass] of controlRowFonts) {
      it(`applies ${fontClass} on the control wrapper for size="${size}"`, async () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        await fixture.whenStable();
        expect(controlWrapper(fixture).className.split(/\s+/)).toContain(fontClass);
      });
    }

    // A floor, not a pinned height — the row has to grow for a textarea or any
    // other multi-line control the consumer projects.
    const controlRowFloors: [TwSize, string][] = [
      ['xs', 'min-h-6'],
      ['sm', 'min-h-8'],
      ['md', 'min-h-9'],
      ['lg', 'min-h-11'],
      ['xl', 'min-h-12'],
    ];
    for (const [size, floorClass] of controlRowFloors) {
      it(`applies ${floorClass} on the control wrapper for size="${size}"`, async () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        await fixture.whenStable();
        const tokens = controlWrapper(fixture).className.split(/\s+/);
        expect(tokens).toContain(floorClass);
        expect(tokens.filter((t) => /^h-/.test(t))).toEqual([]);
      });
    }

    const labelFontResting: [TwSize, string][] = [
      ['xs', 'text-xs'],
      ['sm', 'text-sm'],
      ['md', 'text-sm'],
      ['lg', 'text-base'],
      ['xl', 'text-base'],
    ];
    for (const [size, fontClass] of labelFontResting) {
      it(`uses ${fontClass} for the resting label at size="${size}"`, async () => {
        fixture.componentInstance.size.set(size);
        fixture.detectChanges();
        await fixture.whenStable();
        const label = fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement;
        expect(label.classList.contains(fontClass)).toBe(true);
      });
    }

    const labelFontFloated: [TwSize, string][] = [
      ['xs', 'text-2xs'],
      ['sm', 'text-xs'],
      ['md', 'text-xs'],
      ['lg', 'text-sm'],
      ['xl', 'text-sm'],
    ];
    for (const [size, fontClass] of labelFontFloated) {
      it(`uses ${fontClass} for the floated label at size="${size}"`, async () => {
        fixture.componentInstance.size.set(size);
        fixture.componentInstance.floatLabel.set('always');
        fixture.detectChanges();
        await fixture.whenStable();
        const label = fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement;
        expect(label.classList.contains(fontClass)).toBe(true);
      });
    }
  });

  describe("floatLabel='never'", () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.floatLabel.set('never');
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('does not render the label wrapper even when twLabel is projected', () => {
      const labelEl = fixture.nativeElement.querySelector('label[twLabel]');
      expect(labelEl).toBeNull();
    });

    it('does not hide the placeholder on the infix', () => {
      const infix = fixture.nativeElement.querySelector(
        'tw-form-field > div > div',
      ) as HTMLElement;
      expect(infix.classList.contains('[&_input::placeholder]:opacity-0')).toBe(false);
    });

    it('keeps the floated state false', async () => {
      fixture.componentInstance.fake().focused.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const labelEl = fixture.nativeElement.querySelector('label[twLabel]');
      expect(labelEl).toBeNull();
    });
  });

  describe("subscriptSizing='dynamic'", () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.subscriptSizing.set('dynamic');
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('drops the min-h-5 reserve on the subscript wrapper when hints exist', () => {
      const sub = subscriptWrapper(fixture);
      expect(sub).toBeTruthy();
      expect(sub.classList.contains('min-h-5')).toBe(false);
    });

    it('omits the subscript wrapper entirely when no hint or error is projected', async () => {
      fixture.componentInstance.showHint.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      const host: HTMLElement = fixture.nativeElement.querySelector('tw-form-field');
      // Only the control wrapper child remains.
      expect(host.children.length).toBe(1);
    });

    it('renders the subscript wrapper when an error is projected in error state', async () => {
      fixture.componentInstance.showHint.set(false);
      fixture.componentInstance.showError.set(true);
      fixture.componentInstance.fake().errorState.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
      const sub = subscriptWrapper(fixture);
      expect(sub).toBeTruthy();
      expect(sub.querySelector('[twError]')).toBeTruthy();
    });
  });

  describe("subscriptSizing='fixed' (default)", () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
    });

    it('keeps the min-h-5 reserve on the subscript wrapper even with no hints', async () => {
      fixture.componentInstance.showHint.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      const sub = subscriptWrapper(fixture);
      expect(sub.classList.contains('min-h-5')).toBe(true);
    });
  });

  describe('twLabel host element validation', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
      warnSpy.mockRestore();
    });

    it('does not warn when twLabel is applied to a <label> element', async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      const fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      expect(warnSpy).not.toHaveBeenCalled();
    });

    it('warns when twLabel is applied to a non-<label> element', async () => {
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
            <span twLabel>Label</span>
            <input twFakeControl />
            <span twHint>Hint</span>
          </tw-form-field>
        `,
      })
      class SpanLabelHost {}

      await TestBed.configureTestingModule({ imports: [SpanLabelHost] }).compileComponents();
      const fixture = TestBed.createComponent(SpanLabelHost);
      fixture.detectChanges();
      expect(warnSpy).toHaveBeenCalled();
      const message = warnSpy.mock.calls[0]?.[0] as string;
      expect(message).toMatch(/twLabel.*<label>/);
      expect(message).toMatch(/<span>/);
    });
  });

  describe('aria-labelledby pushdown', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('pushes the projected label id onto the control via setLabelledByIds', () => {
      const fake = fixture.componentInstance.fake();
      const labelEl = fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement;
      expect(fake.labelledByIds()).toEqual([labelEl.id]);
    });

    it('drops the label id when the label is not projected', async () => {
      fixture.componentInstance.showLabel.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.fake().labelledByIds()).toEqual([]);
    });

    it("drops the label id when floatLabel='never' suppresses the wrapper", async () => {
      fixture.componentInstance.floatLabel.set('never');
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.fake().labelledByIds()).toEqual([]);
    });

    it('preserves userAriaLabelledby ids in the merged output', async () => {
      const fake = fixture.componentInstance.fake();
      fake.userAriaLabelledby.set('user-label-a user-label-b');
      fixture.detectChanges();
      await fixture.whenStable();
      const ids = fake.labelledByIds();
      expect(ids).toContain('user-label-a');
      expect(ids).toContain('user-label-b');
    });
  });

  describe('aria-describedby — empty list', () => {
    it('calls setDescribedByIds([]) when no hints or errors are present', async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      const fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showHint.set(false);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(fixture.componentInstance.fake().describedByIds()).toEqual([]);
    });
  });

  describe('prefix-icon directive', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showPrefixIcon.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies size-5 along with the standard prefix classes', () => {
      const icon = fixture.nativeElement.querySelector('[twPrefixIcon]') as HTMLElement;
      expect(icon).toBeTruthy();
      // SVG `className` is an SVGAnimatedString — read the class attribute directly.
      const klass = icon.getAttribute('class') ?? '';
      expect(klass).toContain('size-5');
      expect(klass).toContain('shrink-0');
      expect(klass).toContain('text-fg-muted');
    });

    it('shifts the resting-label left so the label sits after the icon', async () => {
      // Wait an additional macrotask so the afterRenderEffect measurement (and any
      // ResizeObserver follow-up) settles in jsdom.
      await fixture.whenStable();
      const wrapper = (fixture.nativeElement.querySelector('label[twLabel]') as HTMLElement)
        .parentElement as HTMLElement;
      // Resting label `left` is set inline by the form-field as a measured pixel offset; it
      // should not equal '0.5rem' (the floated-edge value). jsdom reports `offsetLeft` as 0, so
      // assert the shape rather than a magnitude — the magnitude only means something in a real
      // layout engine, where the visual e2e specs cover it.
      expect(wrapper.style.left).toMatch(/^\d+(\.\d+)?px$/);
      expect(wrapper.style.left).not.toBe('0.5rem');
    });
  });

  describe('suffix-icon directive', () => {
    let fixture: ComponentFixture<TestHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({ imports: [TestHost] }).compileComponents();
      fixture = TestBed.createComponent(TestHost);
      fixture.componentInstance.showSuffixIcon.set(true);
      fixture.detectChanges();
      await fixture.whenStable();
    });

    it('applies size-5 along with the standard suffix classes', () => {
      const icon = fixture.nativeElement.querySelector('[twSuffixIcon]') as HTMLElement;
      expect(icon).toBeTruthy();
      const klass = icon.getAttribute('class') ?? '';
      expect(klass).toContain('size-5');
      expect(klass).toContain('shrink-0');
      expect(klass).toContain('text-fg-muted');
    });
  });
});
