import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { SegmentedControlComponent, SegmentedControlOptionComponent } from './segmented-control';
import type { SegmentedControlVariant, SegmentedControlRounded } from './segmented-control';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Test hosts ──

@Component({
  imports: [SegmentedControlComponent, SegmentedControlOptionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-segmented-control
      [(value)]="selected"
      [variant]="variant()"
      [rounded]="rounded()"
      [color]="color()"
      [size]="size()"
      [orientation]="orientation()"
      [disabled]="disabled()"
    >
      <tw-segmented-option value="a">Option A</tw-segmented-option>
      <tw-segmented-option value="b">Option B</tw-segmented-option>
      <tw-segmented-option value="c" [disabled]="optionCDisabled()">Option C</tw-segmented-option>
    </tw-segmented-control>
  `,
})
class TestHost {
  selected = signal<string | null>('a');
  variant = signal<SegmentedControlVariant>('surface');
  rounded = signal<SegmentedControlRounded>('pill');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  disabled = signal(false);
  optionCDisabled = signal(false);
}

@Component({
  imports: [SegmentedControlComponent, SegmentedControlOptionComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-segmented-control [formControl]="control">
      <tw-segmented-option value="x">X</tw-segmented-option>
      <tw-segmented-option value="y">Y</tw-segmented-option>
    </tw-segmented-control>
  `,
})
class CvaTestHost {
  control = new FormControl<string | null>('x');
}

@Component({
  imports: [SegmentedControlComponent, SegmentedControlOptionComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-segmented-control [(ngModel)]="value">
      <tw-segmented-option value="x">X</tw-segmented-option>
      <tw-segmented-option value="y">Y</tw-segmented-option>
    </tw-segmented-control>
  `,
})
class TemplateDrivenHost {
  value: string | null = 'x';
}

@Component({
  imports: [SegmentedControlComponent, SegmentedControlOptionComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-segmented-control [formField]="segmentForm.choice">
      <tw-segmented-option value="x">X</tw-segmented-option>
      <tw-segmented-option value="y">Y</tw-segmented-option>
    </tw-segmented-control>
  `,
})
class SignalFormHost {
  protected readonly model = signal<{ choice: string | null }>({ choice: 'x' });
  readonly segmentForm = form(this.model);
}

// ── Helpers ──

function getControl(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-segmented-control')!;
}

function getOptions(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tw-segmented-option'));
}

function dispatchKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

// ── Tests ──

describe('SegmentedControl', () => {
  let fixture: ComponentFixture<TestHost>;
  let host: TestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ── Rendering ──

  describe('Rendering', () => {
    it('should render with default inputs', () => {
      expect(getControl(fixture)).toBeTruthy();
      expect(getOptions(fixture)).toHaveLength(3);
    });

    it('should render projected text content', () => {
      const options = getOptions(fixture);
      expect(options[0].textContent!.trim()).toBe('Option A');
      expect(options[1].textContent!.trim()).toBe('Option B');
    });

    it('should render all sizes without errors', () => {
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const size of sizes) {
        host.size.set(size);
        fixture.detectChanges();
        expect(getOptions(fixture)).toHaveLength(3);
      }
    });

    it('should render both orientations', () => {
      host.orientation.set('vertical');
      fixture.detectChanges();
      expect(getControl(fixture).getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should render all color variants', () => {
      const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
      for (const color of colors) {
        host.color.set(color);
        fixture.detectChanges();
        expect(getOptions(fixture)).toHaveLength(3);
      }
    });
  });

  // ── Rounded ──

  describe('Rounded', () => {
    it('should use pill rounded by default', () => {
      expect(getControl(fixture).classList).toContain('rounded-full');
      expect(getOptions(fixture)[0].classList).toContain('rounded-full');
    });

    it('should use md rounded when set', () => {
      host.rounded.set('md');
      fixture.detectChanges();
      const control = getControl(fixture);
      expect(control.classList).toContain('rounded-md');
      expect(control.classList).not.toContain('rounded-full');
      expect(getOptions(fixture)[0].classList).toContain('rounded-md');
    });

    it('should force md rounded when orientation is vertical', () => {
      host.rounded.set('pill');
      host.orientation.set('vertical');
      fixture.detectChanges();
      const control = getControl(fixture);
      expect(control.classList).toContain('rounded-md');
      expect(control.classList).not.toContain('rounded-full');
    });

    it('should restore pill when orientation returns to horizontal', () => {
      host.orientation.set('vertical');
      fixture.detectChanges();
      expect(getControl(fixture).classList).toContain('rounded-md');

      host.orientation.set('horizontal');
      fixture.detectChanges();
      expect(getControl(fixture).classList).toContain('rounded-full');
    });
  });

  // ── Variants ──

  describe('Variants', () => {
    it('should render with surface variant (default)', () => {
      expect(getOptions(fixture)).toHaveLength(3);
    });

    it('should render with filled variant', () => {
      host.variant.set('filled');
      fixture.detectChanges();
      expect(getOptions(fixture)).toHaveLength(3);
    });

    it('should render with outline variant', () => {
      host.variant.set('outline');
      fixture.detectChanges();
      expect(getOptions(fixture)).toHaveLength(3);
    });

    it('should render all variants across all colors', () => {
      const variants: SegmentedControlVariant[] = ['surface', 'filled', 'outline'];
      const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
      for (const v of variants) {
        for (const c of colors) {
          host.variant.set(v);
          host.color.set(c);
          fixture.detectChanges();
          expect(getOptions(fixture)).toHaveLength(3);
        }
      }
    });

    it('should update selection in outline mode', () => {
      host.variant.set('outline');
      fixture.detectChanges();
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(options[1].getAttribute('aria-checked')).toBe('true');
      expect(host.selected()).toBe('b');
    });

    it('should update selection in filled mode', () => {
      host.variant.set('filled');
      fixture.detectChanges();
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(options[1].getAttribute('aria-checked')).toBe('true');
      expect(host.selected()).toBe('b');
    });
  });

  // ── Interactions ──

  describe('Interactions', () => {
    it('should select option on click', () => {
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(host.selected()).toBe('b');
      expect(options[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should not select a disabled option on click', () => {
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const options = getOptions(fixture);
      options[2].click();
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should not select any option when group is disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should select next option with ArrowRight', () => {
      dispatchKey(getControl(fixture), 'ArrowRight');
      fixture.detectChanges();
      expect(host.selected()).toBe('b');
    });

    it('should select next option with ArrowDown', () => {
      dispatchKey(getControl(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(host.selected()).toBe('b');
    });

    it('should select previous option with ArrowLeft', () => {
      host.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'ArrowLeft');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should select previous option with ArrowUp', () => {
      host.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'ArrowUp');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should wrap around from last to first', () => {
      host.selected.set('c');
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'ArrowRight');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should wrap around from first to last', () => {
      dispatchKey(getControl(fixture), 'ArrowLeft');
      fixture.detectChanges();
      expect(host.selected()).toBe('c');
    });

    it('should skip disabled options during keyboard navigation', () => {
      host.optionCDisabled.set(true);
      host.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'ArrowRight');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should select first option with Home', () => {
      host.selected.set('c');
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'Home');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
    });

    it('should select last option with End', () => {
      dispatchKey(getControl(fixture), 'End');
      fixture.detectChanges();
      expect(host.selected()).toBe('c');
    });

    it('should select last enabled option with End when last is disabled', () => {
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      dispatchKey(getControl(fixture), 'End');
      fixture.detectChanges();
      expect(host.selected()).toBe('b');
    });
  });

  // ── Accessibility ──

  describe('Accessibility', () => {
    it('should have role="radiogroup" on container', () => {
      expect(getControl(fixture).getAttribute('role')).toBe('radiogroup');
    });

    it('should have role="radio" on each option', () => {
      for (const opt of getOptions(fixture)) {
        expect(opt.getAttribute('role')).toBe('radio');
      }
    });

    it('should set aria-checked on the active option', () => {
      const options = getOptions(fixture);
      expect(options[0].getAttribute('aria-checked')).toBe('true');
      expect(options[1].getAttribute('aria-checked')).toBe('false');
      expect(options[2].getAttribute('aria-checked')).toBe('false');
    });

    it('should update aria-checked when selection changes', () => {
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(options[0].getAttribute('aria-checked')).toBe('false');
      expect(options[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should set aria-orientation', () => {
      expect(getControl(fixture).getAttribute('aria-orientation')).toBe('horizontal');
      host.orientation.set('vertical');
      fixture.detectChanges();
      expect(getControl(fixture).getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should set aria-disabled on disabled group', () => {
      expect(getControl(fixture).getAttribute('aria-disabled')).toBeNull();
      host.disabled.set(true);
      fixture.detectChanges();
      expect(getControl(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('should set aria-disabled on individual disabled option', () => {
      const options = getOptions(fixture);
      expect(options[2].getAttribute('aria-disabled')).toBeNull();
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      expect(options[2].getAttribute('aria-disabled')).toBe('true');
    });

    it('should use roving tabindex — active option has 0, others have -1', () => {
      const options = getOptions(fixture);
      expect(options[0].getAttribute('tabindex')).toBe('0');
      expect(options[1].getAttribute('tabindex')).toBe('-1');
      expect(options[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should move tabindex when selection changes', () => {
      const options = getOptions(fixture);
      options[1].click();
      fixture.detectChanges();
      expect(options[0].getAttribute('tabindex')).toBe('-1');
      expect(options[1].getAttribute('tabindex')).toBe('0');
    });
  });
});

// ── ControlValueAccessor ──

describe('SegmentedControl CVA', () => {
  let fixture: ComponentFixture<CvaTestHost>;
  let host: CvaTestHost;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CvaTestHost],
    }).compileComponents();
    fixture = TestBed.createComponent(CvaTestHost);
    host = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should set initial value from FormControl', () => {
    const options = getOptions(fixture);
    expect(options[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should update FormControl on click', () => {
    const options = getOptions(fixture);
    options[1].click();
    fixture.detectChanges();
    expect(host.control.value).toBe('y');
  });

  it('should update DOM when FormControl value changes', () => {
    host.control.setValue('y');
    fixture.detectChanges();
    const options = getOptions(fixture);
    expect(options[0].getAttribute('aria-checked')).toBe('false');
    expect(options[1].getAttribute('aria-checked')).toBe('true');
  });

  it('should disable all options when FormControl is disabled', () => {
    host.control.disable();
    fixture.detectChanges();
    expect(getControl(fixture).getAttribute('aria-disabled')).toBe('true');
    // Click should not change value
    getOptions(fixture)[1].click();
    fixture.detectChanges();
    expect(host.control.value).toBe('x');
  });
});

// ── Template-driven forms ──

describe('SegmentedControl template-driven forms', () => {
  let fixture: ComponentFixture<TemplateDrivenHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateDrivenHost],
    }).compileComponents();
    fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
  });

  it('should reflect initial ngModel value in the DOM', async () => {
    await fixture.whenStable();
    const options = getOptions(fixture);
    expect(options[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should update ngModel on click', async () => {
    await fixture.whenStable();
    const options = getOptions(fixture);
    options[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('y');
  });

});

// ── Signal forms ──

describe('SegmentedControl signal forms', () => {
  let fixture: ComponentFixture<SignalFormHost>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SignalFormHost],
    }).compileComponents();
    fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
  });

  it('should reflect initial field value in the DOM', () => {
    const options = getOptions(fixture);
    expect(options[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should update field value when user selects an option', () => {
    const options = getOptions(fixture);
    options[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.segmentForm.choice().value()).toBe('y');
  });

  it('should reflect programmatic field updates in the DOM', () => {
    fixture.componentInstance.segmentForm.choice().value.set('y');
    fixture.detectChanges();
    const options = getOptions(fixture);
    expect(options[1].getAttribute('aria-checked')).toBe('true');
  });
});
