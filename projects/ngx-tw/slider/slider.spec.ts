import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor } from '@angular/cdk/a11y';
import { NEVER } from 'rxjs';
import { SliderComponent, type SliderMark, type SliderValue, type SliderVariant } from './slider';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [SliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-slider
      [(value)]="value"
      [min]="min()"
      [max]="max()"
      [step]="step()"
      [color]="color()"
      [size]="size()"
      [variant]="variant()"
      [disabled]="disabled()"
      [range]="rangeMode()"
      [marks]="marks()"
      [showMarkLabels]="showMarkLabels()"
      [showMinMax]="showMinMax()"
      [showValue]="showValue()"
      [label]="label()"
      [description]="description()"
      (input)="onInput($event)"
      (change)="onChangeEvent($event)"
    />
  `,
})
class BasicHost {
  value = signal<SliderValue>(50);
  min = signal(0);
  max = signal(100);
  step = signal<number | null>(1);
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  variant = signal<SliderVariant>('solid');
  disabled = signal(false);
  rangeMode = signal(false);
  marks = signal<SliderMark[] | boolean>(false);
  showMarkLabels = signal(false);
  showMinMax = signal(false);
  showValue = signal(false);
  label = signal<string | undefined>(undefined);
  description = signal<string | undefined>(undefined);
  inputSpy = vi.fn();
  changeSpy = vi.fn();
  onInput(v: SliderValue): void {
    this.inputSpy(v);
  }
  onChangeEvent(v: SliderValue): void {
    this.changeSpy(v);
  }
}

@Component({
  imports: [SliderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-slider label="Reactive" [formControl]="control" />`,
})
class ReactiveHost {
  control = new FormControl<number>(20, { nonNullable: true });
}

/**
 * Reactive control plus bindable bounds. Exists to exercise a `min`/`max` change
 * *after* a programmatic `writeValue`, which is the only way to observe whether
 * the written value survives a re-derivation of the internal thumb signals.
 */
@Component({
  imports: [SliderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-slider label="Bounded reactive" [formControl]="control" [min]="min()" [max]="max()" />`,
})
class BoundedReactiveHost {
  control = new FormControl<number>(20, { nonNullable: true });
  min = signal(0);
  max = signal(100);
}

@Component({
  imports: [SliderComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-slider label="Template" [(ngModel)]="value" />`,
})
class TemplateDrivenHost {
  value = 10;
}

/** Reactive control carrying `Validators.required` and NO `[required]` input. */
@Component({
  imports: [SliderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-slider label="Required validator" [formControl]="control" />`,
})
class RequiredValidatorHost {
  control = new FormControl<number>(20, {
    nonNullable: true,
    validators: Validators.required,
  });
}

@Component({
  imports: [SliderComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // No `$any()`: `min`/`max` accept `number | undefined` so this binding
  // type-checks under `strictTemplates` exactly as a consumer would write it.
  // Signal forms writes the `min`/`max` control bindings from the field state,
  // which are `number | undefined` — a cast here would hide a real TS2322.
  template: `<tw-slider label="Signal" [formField]="sliderForm.volume" />`,
})
class SignalFormHost {
  protected readonly model = signal<{ volume: number }>({ volume: 30 });
  readonly sliderForm = form(this.model);
}

@Component({
  imports: [SliderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-slider aria-label="External" />`,
})
class AriaHost {}

// ── Helpers ───────────────────────────────────────────────────────

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-slider')!;
}

function getRegion(fixture: ComponentFixture<unknown>): HTMLElement {
  return getHost(fixture).querySelector('[class*="touch-none"]') as HTMLElement;
}

function getThumbs(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(getHost(fixture).querySelectorAll<HTMLButtonElement>('[role="slider"]'));
}

function mockRegionRect(
  fixture: ComponentFixture<unknown>,
  rect: { left: number; width: number },
): void {
  const region = getRegion(fixture);
  vi.spyOn(region, 'getBoundingClientRect').mockReturnValue({
    left: rect.left,
    width: rect.width,
    top: 0,
    right: rect.left + rect.width,
    bottom: 20,
    height: 20,
    x: rect.left,
    y: 0,
    toJSON: () => ({}),
  });
}

function dispatchKey(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

function dispatchPointer(
  el: HTMLElement,
  type: 'pointerdown' | 'pointermove' | 'pointerup',
  clientX: number,
): void {
  const Ctor =
    typeof PointerEvent !== 'undefined'
      ? PointerEvent
      : (class FakePointerEvent extends MouseEvent {
          pointerId: number;
          pointerType: string;
          constructor(t: string, init: PointerEventInit) {
            super(t, init);
            this.pointerId = init.pointerId ?? 1;
            this.pointerType = init.pointerType ?? 'mouse';
          }
        } as unknown as typeof PointerEvent);
  const event = new Ctor(type, {
    bubbles: true,
    cancelable: true,
    clientX,
    clientY: 10,
    button: 0,
    pointerId: 1,
    pointerType: 'mouse',
  });
  el.dispatchEvent(event);
}

// ── Tests ─────────────────────────────────────────────────────────

describe('SliderComponent', () => {
  const focusMonitorSpy = {
    monitor: vi.fn().mockReturnValue(NEVER),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    focusMonitorSpy.monitor = vi.fn().mockReturnValue(NEVER);
    focusMonitorSpy.stopMonitoring = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  // ── Rendering ──

  describe('rendering', () => {
    it('mounts with default inputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getHost(fixture)).toBeTruthy();
    });

    it('renders a single thumb with role="slider" by default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const thumbs = getThumbs(fixture);
      expect(thumbs).toHaveLength(1);
      expect(thumbs[0].getAttribute('role')).toBe('slider');
    });

    it('renders two thumbs when range is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.rangeMode.set(true);
      fixture.componentInstance.value.set([20, 80]);
      fixture.detectChanges();
      expect(getThumbs(fixture)).toHaveLength(2);
    });

    it('renders every color without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      const colors: TwColor[] = [
        'primary',
        'secondary',
        'accent',
        'neutral',
        'info',
        'success',
        'warning',
        'error',
      ];
      for (const c of colors) {
        host.color.set(c);
        fixture.detectChanges();
        expect(getHost(fixture)).toBeTruthy();
      }
    });

    it('renders every size without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const s of sizes) {
        host.size.set(s);
        fixture.detectChanges();
        expect(getHost(fixture)).toBeTruthy();
      }
    });

    it('renders every variant without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      const variants: SliderVariant[] = ['solid', 'soft', 'outline'];
      for (const v of variants) {
        host.variant.set(v);
        fixture.detectChanges();
        expect(getHost(fixture)).toBeTruthy();
      }
    });

    it('renders the label and wires aria-labelledby on the thumb', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.label.set('Volume');
      fixture.detectChanges();
      expect(getHost(fixture).textContent).toContain('Volume');
      const labelledBy = getThumbs(fixture)[0].getAttribute('aria-labelledby');
      expect(labelledBy).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${labelledBy}`)).toBeTruthy();
    });

    it('renders the description with aria-describedby wiring', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.description.set('0 silent, 100 loud');
      fixture.detectChanges();
      const describedBy = getThumbs(fixture)[0].getAttribute('aria-describedby');
      expect(describedBy).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${describedBy}`)).toBeTruthy();
    });

    it('renders min/max labels when showMinMax is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.showMinMax.set(true);
      fixture.componentInstance.min.set(0);
      fixture.componentInstance.max.set(50);
      fixture.detectChanges();
      const host = getHost(fixture);
      expect(host.textContent).toContain('0');
      expect(host.textContent).toContain('50');
    });

    it('renders auto-generated marks when marks=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.marks.set(true);
      fixture.componentInstance.step.set(25);
      fixture.detectChanges();
      // 0, 25, 50, 75, 100 — five marks
      const marks = getHost(fixture).querySelectorAll('[class*="-translate-x-1/2"][class*="rounded-full"]');
      // thumbs also match so filter by absence of role
      const markDots = Array.from(marks).filter(
        (n) => !(n as HTMLElement).hasAttribute('role'),
      );
      expect(markDots.length).toBeGreaterThanOrEqual(5);
    });

    it('renders custom marks with labels when showMarkLabels is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.marks.set([
        { value: 0, label: 'Low' },
        { value: 100, label: 'High' },
      ]);
      fixture.componentInstance.showMarkLabels.set(true);
      fixture.detectChanges();
      expect(getHost(fixture).textContent).toContain('Low');
      expect(getHost(fixture).textContent).toContain('High');
    });
  });

  // ── Inputs / ARIA ──

  describe('aria attributes', () => {
    it('reflects min/max/now on the single thumb', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.min.set(10);
      fixture.componentInstance.max.set(200);
      fixture.componentInstance.value.set(120);
      fixture.detectChanges();
      const thumb = getThumbs(fixture)[0];
      expect(thumb.getAttribute('aria-valuemin')).toBe('10');
      expect(thumb.getAttribute('aria-valuemax')).toBe('200');
      expect(thumb.getAttribute('aria-valuenow')).toBe('120');
    });

    it('uses valueFormatter for aria-valuetext', () => {
      @Component({
        imports: [SliderComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-slider [value]="40" [valueFormatter]="fmt" />`,
      })
      class FmtHost {
        fmt = (v: number): string => `${v}%`;
      }
      const fixture = TestBed.createComponent(FmtHost);
      fixture.detectChanges();
      const thumb = getThumbs(fixture)[0];
      expect(thumb.getAttribute('aria-valuetext')).toBe('40%');
    });

    it('constrains range thumbs: start valuemax=end, end valuemin=start', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.rangeMode.set(true);
      fixture.componentInstance.value.set([25, 75]);
      fixture.detectChanges();
      const [start, end] = getThumbs(fixture);
      expect(start.getAttribute('aria-valuemax')).toBe('75');
      expect(end.getAttribute('aria-valuemin')).toBe('25');
    });

    it('sets aria-orientation="horizontal"', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('binds aria-required when required is true', () => {
      @Component({
        imports: [SliderComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-slider [required]="true" aria-label="x" />`,
      })
      class RequiredHost {}

      const fixture = TestBed.createComponent(RequiredHost);
      fixture.detectChanges();
      const thumb = fixture.nativeElement.querySelector(
        '[role="slider"]',
      ) as HTMLElement;
      expect(thumb.getAttribute('aria-required')).toBe('true');
    });

    it('does not bind aria-required when required is false (default)', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].hasAttribute('aria-required')).toBe(false);
    });

    it('uses external aria-label when no visible label is set', () => {
      const fixture = TestBed.createComponent(AriaHost);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('aria-label')).toBe('External');
    });

    it('sets aria-disabled when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('aria-disabled')).toBe('true');
    });

    it('sets tabindex=-1 when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('tabindex')).toBe('-1');
    });
  });

  // ── Keyboard ──

  describe('keyboard', () => {
    it('increments by step on ArrowRight', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.componentInstance.step.set(5);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(55);
    });

    it('decrements by step on ArrowLeft', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.componentInstance.step.set(5);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(45);
    });

    it('ArrowUp increments, ArrowDown decrements', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(51);
      dispatchKey(getThumbs(fixture)[0], 'ArrowDown');
      dispatchKey(getThumbs(fixture)[0], 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(49);
    });

    it('Home jumps to min, End jumps to max', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'Home');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(0);
      dispatchKey(getThumbs(fixture)[0], 'End');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(100);
    });

    it('PageUp adds 10% of range', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'PageUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(60);
    });

    it('PageDown subtracts 10% of range', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'PageDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(40);
    });

    it('clamps to min/max on arrow nav', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(100);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(100);
      fixture.componentInstance.value.set(0);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(0);
    });

    it('emits input and change on keyboard activation', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.inputSpy).toHaveBeenCalledWith(51);
      expect(fixture.componentInstance.changeSpy).toHaveBeenCalledWith(51);
    });

    it('blocks keyboard when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(50);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(50);
    });

    it('in range mode, start thumb cannot cross end thumb', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.rangeMode.set(true);
      fixture.componentInstance.value.set([40, 50]);
      fixture.detectChanges();
      const [start] = getThumbs(fixture);
      for (let i = 0; i < 20; i++) dispatchKey(start, 'ArrowRight');
      fixture.detectChanges();
      const v = fixture.componentInstance.value() as readonly [number, number];
      expect(v[0]).toBe(50);
      expect(v[1]).toBe(50);
    });

    it('in range mode, end thumb cannot cross start thumb', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.rangeMode.set(true);
      fixture.componentInstance.value.set([40, 50]);
      fixture.detectChanges();
      const [, end] = getThumbs(fixture);
      for (let i = 0; i < 20; i++) dispatchKey(end, 'ArrowLeft');
      fixture.detectChanges();
      const v = fixture.componentInstance.value() as readonly [number, number];
      expect(v[0]).toBe(40);
      expect(v[1]).toBe(40);
    });
  });

  // ── Pointer / track click ──

  describe('pointer', () => {
    it('click on track moves the single thumb and emits input', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(0);
      fixture.detectChanges();
      mockRegionRect(fixture, { left: 0, width: 100 });
      // Click at 75px on a 100px-wide track → value should be 75.
      dispatchPointer(getRegion(fixture), 'pointerdown', 75);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(75);
      expect(fixture.componentInstance.inputSpy).toHaveBeenCalledWith(75);
    });

    it('snaps to step on track click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(0);
      fixture.componentInstance.step.set(10);
      fixture.detectChanges();
      mockRegionRect(fixture, { left: 0, width: 100 });
      // Click at 73px → raw 73, snap to nearest multiple of 10 = 70.
      dispatchPointer(getRegion(fixture), 'pointerdown', 73);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(70);
    });

    it('emits change on pointer release after a track click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(0);
      fixture.detectChanges();
      mockRegionRect(fixture, { left: 0, width: 100 });
      dispatchPointer(getRegion(fixture), 'pointerdown', 60);
      fixture.detectChanges();
      // Capture routes pointerup to the thumb.
      dispatchPointer(getThumbs(fixture)[0], 'pointerup', 60);
      fixture.detectChanges();
      expect(fixture.componentInstance.changeSpy).toHaveBeenCalledWith(60);
    });

    it('track click moves the nearest thumb in range mode', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.rangeMode.set(true);
      fixture.componentInstance.value.set([20, 80]);
      fixture.detectChanges();
      mockRegionRect(fixture, { left: 0, width: 100 });
      // Click at 30px → closer to start(20) than end(80) → moves start to 30.
      dispatchPointer(getRegion(fixture), 'pointerdown', 30);
      fixture.detectChanges();
      const v = fixture.componentInstance.value() as readonly [number, number];
      expect(v[0]).toBe(30);
      expect(v[1]).toBe(80);
    });

    it('does nothing when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(10);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      mockRegionRect(fixture, { left: 0, width: 100 });
      dispatchPointer(getRegion(fixture), 'pointerdown', 50);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(10);
      expect(fixture.componentInstance.inputSpy).not.toHaveBeenCalled();
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });
  });

  // ── Two-way binding ──

  describe('two-way binding', () => {
    it('reflects programmatic value updates from the parent', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      fixture.componentInstance.value.set(77);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('77');
    });

    it('clamps parent-provided values outside min/max', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.max.set(50);
      fixture.detectChanges();
      fixture.componentInstance.value.set(500);
      fixture.detectChanges();
      expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('50');
    });
  });
});

// ── ControlValueAccessor ──

describe('SliderComponent CVA', () => {
  const focusMonitorSpy = {
    monitor: vi.fn().mockReturnValue(NEVER),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    focusMonitorSpy.monitor = vi.fn().mockReturnValue(NEVER);
    focusMonitorSpy.stopMonitoring = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('initializes from reactive FormControl value', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('20');
  });

  it('updates FormControl when the user presses a key', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(21);
  });

  it('blocks interaction when FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(getThumbs(fixture)[0].getAttribute('aria-disabled')).toBe('true');
    dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(20);
  });

  it('works with template-driven ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe(11);
  });

  // Guard for FIX-1/#3. `Validators.required` on the bound control must reach
  // `aria-required` without the consumer ALSO writing `[required]="true"`.
  // Regressing `required` back to a bare `input(false)` still passes every
  // other test in this file (and every signal-forms test, because
  // `cvaControlCreate` writes the input directly) — only this one fails.
  it('derives aria-required from Validators.required on the bound control', () => {
    const fixture = TestBed.createComponent(RequiredValidatorHost);
    fixture.detectChanges();
    expect(getThumbs(fixture)[0].getAttribute('aria-required')).toBe('true');
  });

  it('leaves aria-required off when the bound control carries no required validator', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    expect(getThumbs(fixture)[0].hasAttribute('aria-required')).toBe(false);
  });
});

// ── Signal forms ──

describe('SliderComponent signal forms', () => {
  const focusMonitorSpy = {
    monitor: vi.fn().mockReturnValue(NEVER),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    focusMonitorSpy.monitor = vi.fn().mockReturnValue(NEVER);
    focusMonitorSpy.stopMonitoring = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('reflects initial signal form field value', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('30');
  });

  it('updates the field when the user presses a key', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    dispatchKey(getThumbs(fixture)[0], 'ArrowRight');
    fixture.detectChanges();
    expect(fixture.componentInstance.sliderForm.volume().value() as number).toBe(31);
  });

  it('marks the field touched on blur', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getThumbs(fixture)[0].dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.sliderForm.volume().touched()).toBe(true);
  });
});

// ── Output-channel split (F-6) ─────────────────────────────────────
//
// The slider ships three value channels and the split between them is real:
//   `(input)`  — live, fires on every drag move and key step
//   `(change)` — commit, fires on pointer release / key release / blur
//   `valueChange` — the output Angular mints from the `value` model()
// Both hand-written channels are USER-GESTURE-ONLY: a programmatic write from a
// bound form reaches the rendered value through `writeValue()` and must not look
// like an interaction. These tests pin that, and pin that `(change)` does not
// fire mid-drag — which is the whole reason `(input)` exists.
//
// Deliberately NOT asserted: whether `valueChange` fires for a programmatic
// write. It does not today, because `writeValue()` sets only the internal
// linkedSignals and never `this.value` — but that is a defect (the model goes
// stale, and a later `min`/`max` change recomputes the linkedSignals from the
// stale model and discards the written value), not a contract. Pinning it would
// turn fixing the defect into a red test. See the pass-6 report.
//
// Non-vacuity: move `this.change.emit(current)` from `commitValue()` into
// `setThumbValue()` and the mid-drag assertion fails; call `this.onChange` /
// emit from `writeValue()` and the programmatic test fails.

@Component({
  imports: [SliderComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-slider
      label="Split"
      [formControl]="control"
      (input)="inputSpy($event)"
      (change)="changeSpy($event)"
    />
  `,
})
class OutputSplitHost {
  readonly control = new FormControl<number>(20, { nonNullable: true });
  readonly inputSpy = vi.fn();
  readonly changeSpy = vi.fn();
}

describe('SliderComponent output-channel split', () => {
  const focusMonitorSpy = {
    monitor: vi.fn().mockReturnValue(NEVER),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    focusMonitorSpy.monitor = vi.fn().mockReturnValue(NEVER);
    focusMonitorSpy.stopMonitoring = vi.fn();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('fires NEITHER input nor change for a programmatic FormControl.setValue', () => {
    const fixture = TestBed.createComponent(OutputSplitHost);
    fixture.detectChanges();
    const host = fixture.componentInstance;
    host.inputSpy.mockClear();
    host.changeSpy.mockClear();

    host.control.setValue(70);
    fixture.detectChanges();

    // The write still reaches the rendered thumb…
    expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('70');
    // …but neither gesture channel fires.
    expect(host.inputSpy).not.toHaveBeenCalled();
    expect(host.changeSpy).not.toHaveBeenCalled();
  });

  it('fires input during the drag and change only on release', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.value.set(0);
    fixture.detectChanges();
    mockRegionRect(fixture, { left: 0, width: 100 });
    const host = fixture.componentInstance;

    dispatchPointer(getRegion(fixture), 'pointerdown', 40);
    fixture.detectChanges();
    dispatchPointer(getThumbs(fixture)[0], 'pointermove', 60);
    fixture.detectChanges();

    // Live channel has fired for both positions; commit channel has not fired at all.
    expect(host.inputSpy).toHaveBeenCalledWith(40);
    expect(host.inputSpy).toHaveBeenCalledWith(60);
    expect(host.changeSpy).not.toHaveBeenCalled();

    dispatchPointer(getThumbs(fixture)[0], 'pointerup', 60);
    fixture.detectChanges();

    expect(host.changeSpy).toHaveBeenCalledTimes(1);
    expect(host.changeSpy).toHaveBeenCalledWith(60);
  });

  // ── A programmatic write must survive a bounds change ──
  //
  // `writeValue()` sets the internal thumb `linkedSignal`s and never the `value`
  // model. Those linkedSignals derive from `value()`, so any later re-derivation
  // recomputes from a model that a CVA write never updated — the written value is
  // silently discarded and the slider snaps back to the model's stale answer
  // (its `0` default, then clamped to the new `min`).
  //
  // A `min`/`max` change is the reachable trigger: it re-runs the computation.
  // Nothing in the suite bound `min` alongside a `formControl`, which is why this
  // shipped. Non-vacuous: on the unfixed component the first assertion passes and
  // the second reports 10 — the new `min` — instead of 20.
  describe('programmatic write vs. bounds change', () => {
    it('keeps a control-written value when min moves below it', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BoundedReactiveHost],
      }).createComponent(BoundedReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('20');

      // 10 is still below the written 20, so clamping cannot legitimately move it.
      fixture.componentInstance.min.set(10);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('20');
    });

    it('keeps a control-written value when max moves above it', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BoundedReactiveHost],
      }).createComponent(BoundedReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      fixture.componentInstance.max.set(200);
      fixture.detectChanges();
      await fixture.whenStable();
      fixture.detectChanges();

      expect(getThumbs(fixture)[0].getAttribute('aria-valuenow')).toBe('20');
    });
  });

});
