import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor } from '@angular/cdk/a11y';
import { RadioComponent, RadioGroupComponent } from './radio';
import type { RadioOrientation, RadioVariant } from './radio';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

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

    it('navigates with both arrow pairs regardless of [orientation]', () => {
      // Documentation lock, not a regression guard: `orientation`'s JSDoc used
      // to claim it "drives the arrow-key model", which it never did — it only
      // reaches `aria-orientation` and the tv() layout variant. The behaviour
      // below is the APG-correct one (a radiogroup accepts both arrow pairs in
      // either layout) and is what the corrected JSDoc now promises, so it is
      // worth pinning. This passes before and after the doc fix by design.
      const fixture = TestBed.createComponent(GroupHost);
      fixture.componentInstance.orientation.set('horizontal');
      fixture.detectChanges();
      expect(getGroup(fixture).getAttribute('aria-orientation')).toBe('horizontal');

      dispatchKey(getGroup(fixture), 'ArrowDown');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');

      dispatchKey(getGroup(fixture), 'ArrowUp');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');

      dispatchKey(getGroup(fixture), 'ArrowRight');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('b');

      dispatchKey(getGroup(fixture), 'ArrowLeft');
      fixture.detectChanges();
      expect(fixture.componentInstance.selected()).toBe('a');
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

  it('should round-trip the value via template-driven [(ngModel)] (standalone CVA)', async () => {
    @Component({
      imports: [RadioComponent, FormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio [(ngModel)]="checked" label="Confirm" />`,
    })
    class TdHost {
      checked = false;
    }
    const fixture = TestBed.createComponent(TdHost);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();

    // Click — the CVA's onChange must propagate to the bound ngModel.
    fixture.nativeElement.querySelector('tw-radio').click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.checked).toBe(true);
  });

  it('should round-trip the value via reactive [formControl] (standalone CVA)', () => {
    @Component({
      imports: [RadioComponent, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio [formControl]="control" label="Confirm" />`,
    })
    class ReactiveStandaloneHost {
      control = new FormControl<boolean>(false);
    }
    const fixture = TestBed.createComponent(ReactiveStandaloneHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio');

    // Programmatic write through the control.
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(radio.getAttribute('aria-checked')).toBe('true');

    // setDisabledState should set aria-disabled.
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(radio.getAttribute('aria-disabled')).toBe('true');
  });

  // ── touched timing (FIX-6), standalone branch ──
  //
  // `RadioComponent.onActivate()` has a standalone `if (!this.parent)` branch with
  // its OWN CVA callbacks, separate from `RadioGroupComponent.selectValue()`. It
  // used to call `onTouched()` on selection too, so `touched` flipped with no
  // blur — the same divergence from `tw-slider` / `tw-input` the group had.
  // These two are the ONLY tests covering that branch: the group's timing tests
  // run through a grouped host and cannot reach it.
  it('does not mark a standalone radio touched when it is selected without a blur', () => {
    @Component({
      imports: [RadioComponent, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio [formControl]="control" label="Confirm" />`,
    })
    class ReactiveStandaloneHost {
      control = new FormControl<boolean>(false);
    }
    const fixture = TestBed.createComponent(ReactiveStandaloneHost);
    fixture.detectChanges();
    fixture.nativeElement.querySelector('tw-radio').click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
    expect(fixture.componentInstance.control.touched).toBe(false);
  });

  it('marks a standalone radio touched on blur, even with no selection change', () => {
    @Component({
      imports: [RadioComponent, ReactiveFormsModule],
      changeDetection: ChangeDetectionStrategy.OnPush,
      template: `<tw-radio [formControl]="control" label="Confirm" />`,
    })
    class ReactiveStandaloneHost {
      control = new FormControl<boolean>(false);
    }
    const fixture = TestBed.createComponent(ReactiveStandaloneHost);
    fixture.detectChanges();
    const radio = fixture.nativeElement.querySelector('tw-radio') as HTMLElement;
    radio.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(false);
    expect(fixture.componentInstance.control.touched).toBe(true);
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

describe('RadioGroup touched timing', () => {
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

  // ── touched timing (FIX-6) ──
  //
  // Angular's CVA contract registers `onTouched` as the BLUR notification.
  // This control used to call it from its CHANGE handler too, so `touched`
  // flipped with no blur — `tw-radio-group` behaved differently from `tw-slider` /
  // `tw-input` for a consumer staging error display on `touched` ("only show
  // the error once they leave the field"). Both halves are asserted through
  // REAL DOM events: a direct `onTouched()` call would pass regardless of what
  // the template does.

  it('does not mark the group touched when a radio is selected without a blur', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getRadios(fixture)[1].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('b');
    expect(fixture.componentInstance.control.touched).toBe(false);
  });

  it('does not mark the group touched when the already-selected radio is re-clicked', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getRadios(fixture)[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.touched).toBe(false);
  });

  it('marks the group touched when a child radio blurs, even with no selection change', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getRadios(fixture)[0].dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe('a');
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});

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

// ── Error state matcher ──

@Component({
  imports: [RadioGroupComponent, RadioComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group [formControl]="control" aria-label="Required">
      <tw-radio value="a" label="A" />
      <tw-radio value="b" label="B" />
    </tw-radio-group>
  `,
})
class RequiredGroupHost {
  control = new FormControl<string | null>(null, Validators.required);
}

describe('RadioGroupComponent errorState', () => {
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

  it('does not set aria-invalid before the control is touched', () => {
    const fixture = TestBed.createComponent(RequiredGroupHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(getGroup(fixture).getAttribute('aria-invalid')).toBe(null);
  });

  it('sets aria-invalid on the group host once the FormControl is touched + invalid', () => {
    const fixture = TestBed.createComponent(RequiredGroupHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getGroup(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('propagates errorState to child radios', () => {
    const fixture = TestBed.createComponent(RequiredGroupHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    const radios = getRadios(fixture);
    expect(radios[0].getAttribute('aria-invalid')).toBe('true');
    expect(radios[1].getAttribute('aria-invalid')).toBe('true');
  });

  it('clears aria-invalid once the user selects a radio and the control becomes valid', () => {
    const fixture = TestBed.createComponent(RequiredGroupHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getGroup(fixture).getAttribute('aria-invalid')).toBe('true');
    getRadios(fixture)[0].click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.valid).toBe(true);
    expect(getGroup(fixture).getAttribute('aria-invalid')).toBe(null);
  });

  // Guard for FIX-1/#3. `Validators.required` on the bound control must reach
  // `aria-required` without the consumer ALSO writing `[required]="true"`.
  // Regressing `required` back to a bare `input(false)` still passes every
  // other test in this file — and every signal-forms test, because
  // `cvaControlCreate` writes the `required` input directly rather than
  // reading validators. Only this pair fails.
  it('derives aria-required from Validators.required on the bound control', () => {
    const fixture = TestBed.createComponent(RequiredGroupHost);
    fixture.detectChanges();
    expect(getGroup(fixture).getAttribute('aria-required')).toBe('true');
  });

  it('leaves aria-required off when the bound control carries no required validator', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    expect(getGroup(fixture).hasAttribute('aria-required')).toBe(false);
  });
});

// ── Size axis ─────────────────────────────────────────────────────
//
// The radio's rendered row is `max(circleWrap min-h, label first-line leading)`, and the
// host is the interactive target (role, tabindex and click all sit on the root). Before the
// vertical-rhythm follow-up it measured 16 / 20 / 20 / 24 / 28px — `sm` and `md` rendered an
// identical row, so one of the five steps did nothing. It is now 16 / 20 / 24 / 28 / 32.
//
// jsdom performs no layout, so the row height itself cannot be read back. What these tests
// assert instead is the property that fix establishes: the two elements that determine the
// row resolve differently at every step of the axis. That fails the moment a step is
// collapsed again, which is the regression worth guarding.

@Component({
  imports: [RadioComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-radio [size]="size()" [label]="label()" value="a" aria-label="Sized" />`,
})
class SizeAxisHost {
  size = signal<TwSize>('md');
  label = signal<string | undefined>('Option A');
}

describe('RadioComponent size axis', () => {
  const focusMonitorSpy = {
    monitor: vi.fn(),
    stopMonitoring: vi.fn(),
  };

  const SIZES: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

  beforeEach(() => {
    vi.clearAllMocks();
    TestBed.configureTestingModule({
      providers: [{ provide: FocusMonitor, useValue: focusMonitorSpy }],
    });
  });

  /** `[circleWrap, label]` — the two elements the rendered row height comes from. */
  function rowElements(fixture: ComponentFixture<unknown>): [HTMLElement, HTMLElement] {
    const spans = [...getRadios(fixture)[0].children].filter(
      el => el.tagName === 'SPAN',
    ) as HTMLElement[];
    return [spans[0], spans[1].firstElementChild as HTMLElement];
  }

  function renderEachSize(
    fixture: ComponentFixture<SizeAxisHost>,
    pick: (fixture: ComponentFixture<unknown>) => string,
  ): string[] {
    return SIZES.map(size => {
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      return pick(fixture);
    });
  }

  it('should size the circle wrapper differently at every step', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);
    const rendered = renderEachSize(fixture, f => rowElements(f)[0].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should size the label line differently at every step', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);
    const rendered = renderEachSize(fixture, f => rowElements(f)[1].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should keep the steps distinct when no label is projected', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);
    fixture.componentInstance.label.set(undefined);
    const rendered = renderEachSize(fixture, f => rowElements(f)[0].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should render sm and md differently — the historical dead step', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);

    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    const [smCircleWrap, smLabel] = rowElements(fixture).map(el => el.className);

    fixture.componentInstance.size.set('md');
    fixture.detectChanges();
    const [mdCircleWrap, mdLabel] = rowElements(fixture).map(el => el.className);

    expect(mdCircleWrap).not.toBe(smCircleWrap);
    expect(mdLabel).not.toBe(smLabel);
  });

  // The next two are pre-existing invariants, not part of the row fix — circle (14/16/20/24/28)
  // and dot (6/8/10/12/14) were already five distinct steps and both pass on the code before
  // it. Pinned because the row scale is now driven by `circleWrap`, which makes it possible to
  // "simplify" the glyph onto the row without anything else failing.
  it('should keep the circle glyph on a five-step scale of its own, independent of the row', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);
    const rendered = renderEachSize(
      fixture,
      f => (rowElements(f)[0].firstElementChild as HTMLElement).className,
    );
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should keep the selection dot on a five-step scale of its own', () => {
    const fixture = TestBed.createComponent(SizeAxisHost);
    fixture.detectChanges();
    getRadios(fixture)[0].click();

    const rendered = renderEachSize(fixture, f => {
      // circleWrap > circle > dotWrap > dot
      const circle = rowElements(f)[0].firstElementChild!;
      return (circle.firstElementChild!.firstElementChild as HTMLElement).className;
    });

    expect(new Set(rendered).size).toBe(SIZES.length);
  });
});

// ── Output-channel split (F-6) ─────────────────────────────────────
//
// `RadioGroupComponent.value` and `RadioComponent.checked` are `model()`s, so
// Angular mints `valueChange` / `checkedChange` outputs that have no declaration
// site in radio.ts. Those are the ANY-CHANGE channels: they fire on a user
// gesture AND on a programmatic write through the CVA. The hand-written `change`
// outputs are the USER-GESTURE-ONLY channels. The third test pins the one
// asymmetry: inside a group, `RadioComponent.checked` is never written by the
// component (selection lives on the group and the rendered state reads
// `parent.value()`), so a grouped radio's `checkedChange` never fires at all.
//
// Non-vacuity: delete `this.value.set(...)` from `RadioGroupComponent.writeValue`
// and the first test's `valueChangeSpy` assertion fails; move
// `this.change.emit(typed)` out of `selectValue()` into `writeValue()` and its
// `changeSpy` assertion fails. Add a `this.checked.set(...)` to the grouped
// branch of `RadioComponent.onActivate()` and the third test fails.

@Component({
  imports: [RadioGroupComponent, RadioComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio-group
      [formControl]="control"
      aria-label="Split"
      (valueChange)="valueChangeSpy($event)"
      (change)="changeSpy($event)"
    >
      <tw-radio value="a" label="A" (checkedChange)="childCheckedChangeSpy($event)" />
      <tw-radio value="b" label="B" />
    </tw-radio-group>
  `,
})
class GroupOutputSplitHost {
  readonly control = new FormControl<string | null>(null);
  readonly valueChangeSpy = vi.fn();
  readonly changeSpy = vi.fn();
  readonly childCheckedChangeSpy = vi.fn();
}

@Component({
  imports: [RadioComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-radio
      label="Standalone split"
      [formControl]="control"
      (checkedChange)="checkedChangeSpy($event)"
      (change)="changeSpy($event)"
    />
  `,
})
class StandaloneOutputSplitHost {
  readonly control = new FormControl<boolean>(false, { nonNullable: true });
  readonly checkedChangeSpy = vi.fn();
  readonly changeSpy = vi.fn();
}

describe('RadioGroupComponent output-channel split', () => {
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

  function mount(): ComponentFixture<GroupOutputSplitHost> {
    const fixture = TestBed.createComponent(GroupOutputSplitHost);
    fixture.detectChanges();
    fixture.componentInstance.valueChangeSpy.mockClear();
    fixture.componentInstance.changeSpy.mockClear();
    fixture.componentInstance.childCheckedChangeSpy.mockClear();
    return fixture;
  }

  it('fires valueChange but NOT change for a programmatic FormControl.setValue', () => {
    const fixture = mount();
    const host = fixture.componentInstance;

    host.control.setValue('b');
    fixture.detectChanges();

    expect(host.valueChangeSpy).toHaveBeenCalledWith('b');
    expect(host.changeSpy).not.toHaveBeenCalled();
  });

  it('fires BOTH valueChange and change for a user gesture', () => {
    const fixture = mount();
    const host = fixture.componentInstance;

    getRadios(fixture)[1].click();
    fixture.detectChanges();

    expect(host.valueChangeSpy).toHaveBeenCalledWith('b');
    expect(host.changeSpy).toHaveBeenCalledWith('b');
  });

  it('never fires a grouped child radio checkedChange — the group owns selection', () => {
    const fixture = mount();
    const host = fixture.componentInstance;

    getRadios(fixture)[0].click();
    fixture.detectChanges();
    host.control.setValue('b');
    fixture.detectChanges();

    expect(host.childCheckedChangeSpy).not.toHaveBeenCalled();
    // ...while the group's own channels did fire for the gesture.
    expect(host.changeSpy).toHaveBeenCalledWith('a');
  });
});

describe('RadioComponent standalone output-channel split', () => {
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

  function mount(): ComponentFixture<StandaloneOutputSplitHost> {
    const fixture = TestBed.createComponent(StandaloneOutputSplitHost);
    fixture.detectChanges();
    fixture.componentInstance.checkedChangeSpy.mockClear();
    fixture.componentInstance.changeSpy.mockClear();
    return fixture;
  }

  it('fires checkedChange but NOT change for a programmatic FormControl.setValue', () => {
    const fixture = mount();
    const host = fixture.componentInstance;

    host.control.setValue(true);
    fixture.detectChanges();

    expect(host.checkedChangeSpy).toHaveBeenCalledWith(true);
    expect(host.changeSpy).not.toHaveBeenCalled();
  });

  it('fires BOTH checkedChange and change for a user gesture', () => {
    const fixture = mount();
    const host = fixture.componentInstance;

    getRadios(fixture)[0].click();
    fixture.detectChanges();

    expect(host.checkedChangeSpy).toHaveBeenCalledWith(true);
    expect(host.changeSpy).toHaveBeenCalledWith(true);
  });
});
