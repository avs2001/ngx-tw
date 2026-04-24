import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor } from '@angular/cdk/a11y';
import { RadioComponent, RadioGroupComponent } from './radio';
import type { RadioOrientation, RadioVariant } from './radio';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group
      [(value)]="selected"
      [color]="color()"
      [size]="size()"
      [variant]="variant()"
      [orientation]="orientation()"
      [disabled]="disabled()"
      [required]="required()"
      [name]="groupName()"
      aria-label="Plan"
      (change)="onChange($event)"
    >
      <tw-radio value="a" label="Option A" />
      <tw-radio value="b" label="Option B" />
      <tw-radio value="c" label="Option C" [disabled]="radioCDisabled()" />
    </tw-radio-group>
  `,
})
class GroupHost {
  selected = signal<string | null>('a');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  variant = signal<RadioVariant>('solid');
  orientation = signal<RadioOrientation>('vertical');
  disabled = signal(false);
  required = signal(false);
  radioCDisabled = signal(false);
  groupName = signal<string | undefined>(undefined);
  changeSpy = vi.fn();
  onChange(v: string | null): void {
    this.changeSpy(v);
  }
}

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [(value)]="selected" aria-label="Priority">
      <tw-radio value="low" label="Low" />
      <tw-radio value="high" label="High" color="error" variant="outline" size="lg" />
    </tw-radio-group>
  `,
})
class InheritanceHost {
  selected = signal<string | null>(null);
}

@Component({
  imports: [RadioGroupComponent, RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [(value)]="selected" aria-label="Shipping">
      <tw-radio value="standard">
        <span data-testid="projected-label">Standard</span>
        <span slot="description" data-testid="projected-desc">3–5 days</span>
      </tw-radio>
      <tw-radio value="express" label="Express">
        <span slot="dot" data-testid="custom-dot">*</span>
      </tw-radio>
    </tw-radio-group>
  `,
})
class ProjectionHost {
  selected = signal<string | null>('express');
}

@Component({
  imports: [RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-radio [(checked)]="value" label="Confirm" (change)="onChange($event)" />`,
})
class StandaloneHost {
  value = signal(false);
  changeSpy = vi.fn();
  onChange(v: boolean): void {
    this.changeSpy(v);
  }
}

@Component({
  imports: [RadioGroupComponent, RadioComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [formControl]="control" aria-label="Reactive">
      <tw-radio value="a" label="A" />
      <tw-radio value="b" label="B" />
      <tw-radio value="c" label="C" />
    </tw-radio-group>
  `,
})
class ReactiveHost {
  control = new FormControl<string | null>('a');
}

@Component({
  imports: [RadioGroupComponent, RadioComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [(ngModel)]="value" aria-label="Template driven">
      <tw-radio value="x" label="X" />
      <tw-radio value="y" label="Y" />
    </tw-radio-group>
  `,
})
class TemplateDrivenHost {
  value: string | null = 'x';
}

@Component({
  imports: [RadioGroupComponent, RadioComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [formField]="radioForm.plan" aria-label="Signal">
      <tw-radio value="free" label="Free" />
      <tw-radio value="pro" label="Pro" />
    </tw-radio-group>
  `,
})
class SignalFormHost {
  protected readonly model = signal<{ plan: string | null }>({ plan: null });
  readonly radioForm = form(this.model);
}

// ── Helpers ───────────────────────────────────────────────────────

function getGroup(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-radio-group')!;
}

function getRadios(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(fixture.nativeElement.querySelectorAll('tw-radio'));
}

function dispatchKey(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

// ── Grouped tests ─────────────────────────────────────────────────

describe('RadioGroupComponent', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  describe('rendering', () => {
    it('should mount with default inputs', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture)).toBeTruthy();
      expect(getRadios(fixture)).toHaveLength(3);
    });

    it('should set role="radiogroup" on the group host', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('role')).toBe('radiogroup');
    });

    it('should set role="radio" on each radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      for (const r of getRadios(fixture)) {
        expect(r.getAttribute('role')).toBe('radio');
      }
    });

    it('should set aria-orientation="vertical" by default', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-orientation')).toBe('vertical');
    });

    it('should set aria-orientation="horizontal" when overridden', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.orientation.set('horizontal');
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should render every color without errors', () => {
      const fixture = TestBed.createComponent(GroupHost);
      const host = fixture.componentInstance;
      const colors: TwColor[] = [
        'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
      ];
      for (const c of colors) {
        host.color.set(c);
        fixture.detectChanges();
        expect(getRadios(fixture)).toHaveLength(3);
      }
    });

    it('should render every size without errors', () => {
      const fixture = TestBed.createComponent(GroupHost);
      const host = fixture.componentInstance;
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const s of sizes) {
        host.size.set(s);
        fixture.detectChanges();
        expect(getRadios(fixture)).toHaveLength(3);
      }
    });

    it('should render every variant without errors', () => {
      const fixture = TestBed.createComponent(GroupHost);
      const host = fixture.componentInstance;
      const variants: RadioVariant[] = ['solid', 'outline'];
      for (const v of variants) {
        host.variant.set(v);
        fixture.detectChanges();
        expect(getRadios(fixture)).toHaveLength(3);
      }
    });

    it('should render label text from the label input', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[0].textContent).toContain('Option A');
    });
  });

  describe('selection', () => {
    it('should reflect the initial value via aria-checked', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[0].getAttribute('aria-checked')).toBe('true');
      expect(radios[1].getAttribute('aria-checked')).toBe('false');
      expect(radios[2].getAttribute('aria-checked')).toBe('false');
    });

    it('should update selection on click', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      radios[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');
      expect(radios[0].getAttribute('aria-checked')).toBe('false');
      expect(radios[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should emit change output from the group on user selection', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      getRadios(fixture)[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.changeSpy).toHaveBeenCalledWith('b');
    });

    it('should not emit change when value is updated programmatically', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      fixture.componentInstance.changeSpy.mockClear();
      fixture.componentInstance.selected.set('b');
      fixture.detectChanges();
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
      expect(getRadios(fixture)[1].getAttribute('aria-checked')).toBe('true');
    });

    it('should not re-emit change when clicking the already-selected radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      getRadios(fixture)[0].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });
  });

  describe('keyboard', () => {
    it('should select the next radio on ArrowDown and prevent default', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const event = dispatchKey(getGroup(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');
      expect(event.defaultPrevented).toBe(true);
    });

    it('should select the next radio on ArrowRight', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');
    });

    it('should select the previous radio on ArrowUp', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should select the previous radio on ArrowLeft', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should wrap from last to first with ArrowDown', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set('c');
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should wrap from first to last with ArrowUp', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('c');
    });

    it('should jump to first enabled on Home', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set('c');
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'Home');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should jump to last enabled on End', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'End');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('c');
    });

    it('should skip disabled radios during arrow navigation', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.radioCDisabled.set(true);
      fixture.componentInstance.selected.set('b');
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should select the last enabled radio on End when last is disabled', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.radioCDisabled.set(true);
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'End');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');
    });

    it('should activate a focused radio on Space', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set(null);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      radios[1].dispatchEvent(event);
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');
      expect(event.defaultPrevented).toBe(true);
    });

    it('should NOT activate on Enter', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set(null);
      fixture.detectChanges();
      getRadios(fixture)[1].dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true, cancelable: true }));
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe(null);
    });

    it('should not change selection via keyboard when group is disabled', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      dispatchKey(getGroup(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });
  });

  describe('roving tabindex', () => {
    it('should give tabindex="0" only to the selected radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[0].getAttribute('tabindex')).toBe('0');
      expect(radios[1].getAttribute('tabindex')).toBe('-1');
      expect(radios[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should move tabindex=0 with selection', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      radios[1].click();
      fixture.detectChanges();
      expect(radios[0].getAttribute('tabindex')).toBe('-1');
      expect(radios[1].getAttribute('tabindex')).toBe('0');
    });

    it('should give tabindex="0" to the first enabled radio when nothing is selected', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.selected.set(null);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[0].getAttribute('tabindex')).toBe('0');
      expect(radios[1].getAttribute('tabindex')).toBe('-1');
    });

    it('should never put tabindex="0" on a disabled radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.radioCDisabled.set(true);
      fixture.componentInstance.selected.set('c');
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[2].getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('disabled cascade', () => {
    it('should disable every radio when the group is disabled', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      for (const r of getRadios(fixture)) {
        expect(r.getAttribute('aria-disabled')).toBe('true');
      }
      expect(getGroup(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('should block click on a disabled radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.radioCDisabled.set(true);
      fixture.detectChanges();
      getRadios(fixture)[2].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
    });

    it('should block click on every radio when group is disabled', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      getRadios(fixture)[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });

    it('should set aria-disabled only on the individually disabled radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.radioCDisabled.set(true);
      fixture.detectChanges();
      const radios = getRadios(fixture);
      expect(radios[0].getAttribute('aria-disabled')).toBeNull();
      expect(radios[1].getAttribute('aria-disabled')).toBeNull();
      expect(radios[2].getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('inheritance overrides', () => {
    it('should inherit color/size/variant from the group when radio does not override', () => {
      const fixture = TestBed.createComponent(InheritanceHost);
      fixture.detectChanges();
      // Both render without errors — verifies inheritance resolves
      expect(getRadios(fixture)).toHaveLength(2);
    });

    it('should allow per-radio overrides to win', () => {
      const fixture = TestBed.createComponent(InheritanceHost);
      fixture.componentInstance.selected.set('high');
      fixture.detectChanges();
      const radios = getRadios(fixture);
      const circle = radios[1].querySelector('span')!;
      // The second radio has color=error, variant=outline — verify border-error-600 appears on the circle
      const html = radios[1].innerHTML;
      expect(html).toContain('border-error-600');
      expect(circle).toBeTruthy();
    });
  });

  describe('name propagation', () => {
    it('should propagate the group name to every radio', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.groupName.set('plan');
      fixture.detectChanges();
      for (const r of getRadios(fixture)) {
        expect(r.getAttribute('name')).toBe('plan');
      }
    });
  });

  describe('accessibility', () => {
    it('should reflect aria-label on the group host', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-label')).toBe('Plan');
    });

    it('should set aria-required when required is true', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('should omit aria-required when false', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      expect(getGroup(fixture).hasAttribute('aria-required')).toBe(false);
    });

    it('should assign a unique id per group instance', () => {
      const f1 = TestBed.createComponent(GroupHost);
      const f2 = TestBed.createComponent(GroupHost);
      f1.detectChanges();
      f2.detectChanges();
      expect(getGroup(f1).id).not.toBe(getGroup(f2).id);
    });

    it('should assign a unique id per radio instance', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      const ids = getRadios(fixture).map(r => r.id);
      expect(new Set(ids).size).toBe(ids.length);
    });

    it('should log a dev-mode warning when the group has no accessible name', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      @Component({
        imports: [RadioGroupComponent, RadioComponent],
        changeDetection: ChangeDetectionStrategy.OnPush,
        template: `<tw-radio-group><tw-radio value="x" label="X" /></tw-radio-group>`,
      })
      class NoNameHost {}
      const fixture = TestBed.createComponent(NoNameHost);
      fixture.detectChanges();
      await fixture.whenStable();
      expect(warnSpy).toHaveBeenCalled();
      const logged = warnSpy.mock.calls.flat().join(' ');
      expect(logged).toContain('tw-radio-group');
      warnSpy.mockRestore();
    });
  });

  describe('content projection', () => {
    it('should render projected default-slot label content', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="projected-label"]')).toBeTruthy();
    });

    it('should render projected description content', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="projected-desc"]')).toBeTruthy();
    });

    it('should render a projected dot slot when selected', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="custom-dot"]')).toBeTruthy();
    });
  });

  describe('FocusMonitor', () => {
    it('should monitor both group and every radio host on init', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      // 1 group + 3 radios = 4 monitor calls
      expect(focusMonitorSpy.monitor).toHaveBeenCalledTimes(4);
    });

    it('should stop monitoring on destroy', () => {
      const fixture = TestBed.createComponent(GroupHost);
      fixture.detectChanges();
      fixture.destroy();
      expect(focusMonitorSpy.stopMonitoring).toHaveBeenCalledTimes(4);
    });
  });
});

// ── Standalone radio ──────────────────────────────────────────────

describe('RadioComponent standalone', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('should render with aria-checked="false" by default', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tw-radio').getAttribute('aria-checked')).toBe('false');
  });

  it('should set tabindex="0" by default when standalone', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tw-radio').getAttribute('tabindex')).toBe('0');
  });

  it('should set checked on click', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio')!;
    radio.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(true);
    expect(radio.getAttribute('aria-checked')).toBe('true');
    expect(fixture.componentInstance.changeSpy).toHaveBeenCalledWith(true);
  });

  it('should NOT un-check on second click — matches native radio semantics', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio')!;
    radio.click();
    fixture.detectChanges();
    fixture.componentInstance.changeSpy.mockClear();
    radio.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(true);
    expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
  });

  it('should activate on Space and prevent default', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio')!;
    const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
    radio.dispatchEvent(event);
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(true);
    expect(event.defaultPrevented).toBe(true);
  });

  it('should block click when disabled via standalone disabled input', () => {
    @Component({
      imports: [RadioComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio [(checked)]="value" label="X" [disabled]="true" />`,
    })
    class DisabledHost {
      value = signal(false);
    }
    const fixture = TestBed.createComponent(DisabledHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio')!;
    radio.click();
    fixture.detectChanges();
    expect(fixture.componentInstance.value()).toBe(false);
    expect(radio.getAttribute('aria-disabled')).toBe('true');
    expect(radio.getAttribute('tabindex')).toBe('-1');
  });

  it('should reflect parent-set checked programmatically', () => {
    const fixture = TestBed.createComponent(StandaloneHost);
    fixture.detectChanges();
    fixture.componentInstance.value.set(true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('tw-radio').getAttribute('aria-checked')).toBe('true');
  });

  it('should log a dev-mode warning when the radio has no accessible name', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    @Component({
      imports: [RadioComponent],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio />`,
    })
    class NoNameHost {}
    const fixture = TestBed.createComponent(NoNameHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const logged = warnSpy.mock.calls.flat().join(' ');
    expect(logged).toContain('tw-radio');
    warnSpy.mockRestore();
  });
});

// ── ControlValueAccessor ──────────────────────────────────────────

describe('RadioGroup CVA', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('should initialise from reactive FormControl value', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    expect(getRadios(fixture)[0].getAttribute('aria-checked')).toBe('true');
  });

  it('should update FormControl on user click', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getRadios(fixture)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('b');
  });

  it('should reflect FormControl.setValue into the DOM', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue('c');
    fixture.detectChanges();
    const radios = getRadios(fixture);
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    expect(radios[2].getAttribute('aria-checked')).toBe('true');
  });

  it('should block interaction when FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(getGroup(fixture).getAttribute('aria-disabled')).toBe('true');
    for (const r of getRadios(fixture)) {
      expect(r.getAttribute('aria-disabled')).toBe('true');
    }
    getRadios(fixture)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('a');
  });

  it('should work with template-driven ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    getRadios(fixture)[1].click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe('y');
  });
});

// ── Signal forms ──

describe('RadioGroupComponent signal forms', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  it('should reflect initial field value in the DOM', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.componentInstance.radioForm.plan().value.set('pro');
    fixture.detectChanges();
    const radios = getRadios(fixture);
    expect(radios[0].getAttribute('aria-checked')).toBe('false');
    expect(radios[1].getAttribute('aria-checked')).toBe('true');
  });

  it('should update the field value when the user selects a radio', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getRadios(fixture)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.radioForm.plan().value()).toBe('pro');
  });

  it('should mark the field as touched on blur', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getRadios(fixture)[0].dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.radioForm.plan().touched()).toBe(true);
  });
});
