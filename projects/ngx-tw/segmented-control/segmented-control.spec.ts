import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { SegmentedControlComponent, SegmentedControlOptionComponent } from './segmented-control';
import type { SegmentedControlVariant, SegmentedControlRounded } from './segmented-control';
import type { TwColor, TwOrientation, TwSize } from '@cdevhub/ngx-tw/core';

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
      [class]="rootClass()"
    >
      <tw-segmented-option value="a" [class]="optionClass()">Option A</tw-segmented-option>
      <tw-segmented-option value="b" [class]="optionClass()">Option B</tw-segmented-option>
      <tw-segmented-option value="c" [disabled]="optionCDisabled()" [class]="optionClass()">Option C</tw-segmented-option>
    </tw-segmented-control>
  `,
})
class TestHost {
  selected = signal<string | null>('a');
  variant = signal<SegmentedControlVariant>('surface');
  rounded = signal<SegmentedControlRounded>('pill');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  orientation = signal<TwOrientation>('horizontal');
  disabled = signal(false);
  optionCDisabled = signal(false);
  rootClass = signal('');
  optionClass = signal('');
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

    it('should apply -solid-fg slot on filled-variant active option for every role', () => {
      const cases: { color: TwColor; cls: string }[] = [
        { color: 'primary', cls: 'text-primary-solid-fg' },
        { color: 'secondary', cls: 'text-secondary-solid-fg' },
        { color: 'accent', cls: 'text-accent-solid-fg' },
        { color: 'info', cls: 'text-info-solid-fg' },
        { color: 'success', cls: 'text-success-solid-fg' },
        { color: 'warning', cls: 'text-warning-solid-fg' },
        { color: 'error', cls: 'text-error-solid-fg' },
      ];
      host.variant.set('filled');
      for (const { color, cls } of cases) {
        host.color.set(color);
        fixture.detectChanges();
        const active = getOptions(fixture)[0];
        expect(active.className).toContain(cls);
      }
    });

    it('should consume slot tokens on outline-variant active option (no `dark:` overrides)', () => {
      host.variant.set('outline');
      host.color.set('primary');
      fixture.detectChanges();
      const active = getOptions(fixture)[0];
      expect(active.className).toContain('ring-primary-border-strong');
      expect(active.className).toContain('text-primary-fg');
      expect(active.className).not.toMatch(/\bdark:/);
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

    it('should select the option that has focus with Space', () => {
      const options = getOptions(fixture);
      dispatchKey(options[1], ' ');
      fixture.detectChanges();
      expect(host.selected()).toBe('b');
      expect(options[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should select the option that has focus with Enter', () => {
      const options = getOptions(fixture);
      dispatchKey(options[2], 'Enter');
      fixture.detectChanges();
      expect(host.selected()).toBe('c');
      expect(options[2].getAttribute('aria-checked')).toBe('true');
    });

    it('should not select a disabled option with Space', () => {
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const options = getOptions(fixture);
      dispatchKey(options[2], ' ');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
      expect(options[2].getAttribute('aria-checked')).toBe('false');
    });

    it('should not select any option with Space when the group is disabled', () => {
      host.disabled.set(true);
      fixture.detectChanges();
      const options = getOptions(fixture);
      dispatchKey(options[1], ' ');
      fixture.detectChanges();
      expect(host.selected()).toBe('a');
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

    // Tab-order recovery (SC 2.1.1). Every one of these used to leave the
    // control with zero tab stops, making it unreachable by keyboard.
    it('should keep a tab stop when the value matches no option', () => {
      host.selected.set('nope');
      fixture.detectChanges();
      const options = getOptions(fixture);
      expect(options[0].getAttribute('tabindex')).toBe('0');
      expect(options.filter(o => o.getAttribute('tabindex') === '0')).toHaveLength(1);
    });

    it('should keep a tab stop when the value is an empty string', () => {
      host.selected.set('');
      fixture.detectChanges();
      const options = getOptions(fixture);
      expect(options[0].getAttribute('tabindex')).toBe('0');
    });

    it('should keep a tab stop when the value is null', () => {
      host.selected.set(null);
      fixture.detectChanges();
      const options = getOptions(fixture);
      expect(options[0].getAttribute('tabindex')).toBe('0');
    });

    it('should move the tab stop to the first enabled option when the active option is disabled', () => {
      host.selected.set('c');
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const options = getOptions(fixture);
      expect(options[2].getAttribute('tabindex')).toBe('-1');
      expect(options[0].getAttribute('tabindex')).toBe('0');
    });
  });

  // ── Customization (standard `[class]` binding) ──
  // `rootClass` and `optionClass` inputs were removed — consumers use
  // Angular's standard `[class]` binding instead. `tv()` runs with
  // `twMerge: true` so consumer classes still win on conflicts.

  describe('Customization', () => {
    it('should merge consumer [class] onto the radiogroup root', () => {
      host.rootClass.set('shadow-2xl my-marker');
      fixture.detectChanges();
      const control = getControl(fixture);
      expect(control.classList).toContain('shadow-2xl');
      expect(control.classList).toContain('my-marker');
    });

    it('should merge consumer [class] onto every option', () => {
      host.optionClass.set('uppercase tracking-wide');
      fixture.detectChanges();
      for (const opt of getOptions(fixture)) {
        expect(opt.classList).toContain('uppercase');
        expect(opt.classList).toContain('tracking-wide');
      }
    });

    it('should keep consumer [class] on disabled options', () => {
      host.optionClass.set('uppercase');
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const disabledOption = getOptions(fixture)[2];
      expect(disabledOption.classList).toContain('uppercase');
      expect(disabledOption.classList).toContain('opacity-50');
    });

  });

  // ── Compound variants resolution ──
  // tv() compoundVariants own the active styling for every (variant × color)
  // tuple. These tests assert the resolved class strings match the documented
  // contract — adding new colors or variants requires extending the compound
  // table, not patching consumer code.

  describe('Compound variants', () => {
    it('should apply inactive option styling on non-active options regardless of variant', () => {
      const variants: SegmentedControlVariant[] = ['surface', 'filled', 'outline'];
      for (const v of variants) {
        host.variant.set(v);
        fixture.detectChanges();
        const inactive = getOptions(fixture)[1];
        expect(inactive.className).toContain('text-fg-muted');
        expect(inactive.className).toContain('hover:text-fg');
      }
    });

    it('should apply surface-variant active classes for every color', () => {
      const cases: { color: TwColor; cls: string }[] = [
        { color: 'primary', cls: 'text-primary-fg' },
        { color: 'secondary', cls: 'text-secondary-fg' },
        { color: 'accent', cls: 'text-accent-fg' },
        { color: 'info', cls: 'text-info-fg' },
        { color: 'success', cls: 'text-success-fg' },
        { color: 'warning', cls: 'text-warning-fg' },
        { color: 'error', cls: 'text-error-fg' },
      ];
      host.variant.set('surface');
      for (const { color, cls } of cases) {
        host.color.set(color);
        fixture.detectChanges();
        const active = getOptions(fixture)[0];
        expect(active.className).toContain('bg-surface');
        expect(active.className).toContain('shadow-sm');
        expect(active.className).toContain(cls);
      }
    });

    it('should apply disabled option classes via tv() variant, not a short-circuit', () => {
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const disabled = getOptions(fixture)[2];
      expect(disabled.className).toContain('opacity-50');
      expect(disabled.className).toContain('pointer-events-none');
      expect(disabled.className).toContain('cursor-default');
    });

    it('should keep the active color underneath the disabled layer (no short-circuit)', () => {
      // Behavior change in S16: with the disabled axis moved into the tv()
      // variant block, a disabled+active option still resolves its active
      // color compound — it's now visually "faded but still selected" rather
      // than collapsed to muted styling. Locks the new behavior in.
      host.variant.set('filled');
      host.color.set('success');
      host.selected.set('c');
      host.optionCDisabled.set(true);
      fixture.detectChanges();
      const activeDisabled = getOptions(fixture)[2];
      // Active color compound is still applied (faded-but-selected).
      expect(activeDisabled.className).toContain('bg-success-solid');
      expect(activeDisabled.className).toContain('text-success-solid-fg');
      // Disabled axis adds the opacity / pointer-events layer on top.
      expect(activeDisabled.className).toContain('opacity-50');
      expect(activeDisabled.className).toContain('pointer-events-none');
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

// ── Dev-mode parent guard ──

@Component({
  imports: [SegmentedControlOptionComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-segmented-option value="orphan">Orphan</tw-segmented-option>`,
})
class OrphanOptionHost {}

describe('SegmentedControlOption — dev-mode parent guard', () => {
  it('should log a console.error when rendered outside a parent <tw-segmented-control>', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    await TestBed.configureTestingModule({
      imports: [OrphanOptionHost],
    }).compileComponents();
    const fixture = TestBed.createComponent(OrphanOptionHost);
    fixture.detectChanges();
    expect(errorSpy).toHaveBeenCalledWith(
      expect.stringContaining('<tw-segmented-option> must be a child of <tw-segmented-control>'),
    );
    errorSpy.mockRestore();
  });
});
