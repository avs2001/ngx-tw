import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor } from '@angular/cdk/a11y';
import { SwitchComponent } from './switch';
import type { SwitchLabelPosition } from './switch';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [SwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-switch
      [(checked)]="value"
      [color]="color()"
      [size]="size()"
      [disabled]="disabled()"
      [required]="required()"
      [label]="label()"
      [description]="description()"
      [labelPosition]="labelPosition()"
      (change)="onChange($event)"
    />
  `,
})
class BasicHost {
  value = signal(false);
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  disabled = signal(false);
  required = signal(false);
  label = signal<string | undefined>('Enable notifications');
  description = signal<string | undefined>(undefined);
  labelPosition = signal<SwitchLabelPosition>('after');
  changeSpy = vi.fn();
  onChange(v: boolean): void {
    this.changeSpy(v);
  }
}

@Component({
  imports: [SwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-switch>
      <span data-testid="projected-label">Projected label</span>
      <span slot="description" data-testid="projected-desc">Projected description</span>
      <svg slot="on-icon" data-testid="on-icon">on</svg>
      <svg slot="off-icon" data-testid="off-icon">off</svg>
    </tw-switch>
  `,
})
class ProjectionHost {}

@Component({
  imports: [SwitchComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-switch aria-label="Toggle feature" />`,
})
class AriaLabelHost {}

@Component({
  imports: [SwitchComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-switch label="Reactive" [formControl]="control" />`,
})
class ReactiveHost {
  control = new FormControl<boolean>(false, { nonNullable: true });
}

@Component({
  imports: [SwitchComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-switch label="Required" [formControl]="control" />`,
})
class RequiredHost {
  control = new FormControl<boolean>(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });
}

@Component({
  imports: [SwitchComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-switch label="Template driven" [(ngModel)]="value" />`,
})
class TemplateDrivenHost {
  value = false;
}

@Component({
  imports: [SwitchComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-switch label="Signal" [formField]="switchForm.enabled" />`,
})
class SignalFormHost {
  protected readonly model = signal({ enabled: false });
  readonly switchForm = form(this.model);
}

// ── Helpers ───────────────────────────────────────────────────────

function getSwitch(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-switch')!;
}

function dispatchKey(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('SwitchComponent', () => {
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

  // ── Rendering ──

  describe('rendering', () => {
    it('should mount with default inputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture)).toBeTruthy();
    });

    it('should set role="switch" on the host', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('role')).toBe('switch');
    });

    it('should render aria-checked="false" by default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('false');
    });

    it('should render every color without errors', () => {
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
        expect(getSwitch(fixture)).toBeTruthy();
      }
    });

    it('should render every size without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const s of sizes) {
        host.size.set(s);
        fixture.detectChanges();
        expect(getSwitch(fixture)).toBeTruthy();
      }
    });

    it('should render the label input text', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).textContent).toContain('Enable notifications');
    });

    it('should render the description input text', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.description.set('Get notified of updates');
      fixture.detectChanges();
      expect(getSwitch(fixture).textContent).toContain('Get notified of updates');
    });
  });

  // ── Inputs ──

  describe('inputs', () => {
    it('should set aria-required when required is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('should omit aria-required when false', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).hasAttribute('aria-required')).toBe(false);
    });

    it('should set tabindex="0" by default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('tabindex')).toBe('0');
    });

    it('should set tabindex="-1" when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('tabindex')).toBe('-1');
    });

    it('should reverse flex direction when labelPosition is before', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.labelPosition.set('before');
      fixture.detectChanges();
      expect(getSwitch(fixture).className).toContain('flex-row-reverse');
    });
  });

  // ── Interactions ──

  describe('interactions', () => {
    it('should toggle state on click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      getSwitch(fixture).click();
      fixture.detectChanges();
      expect(host.value()).toBe(true);
      expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('true');
    });

    it('should emit change output on click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      getSwitch(fixture).click();
      fixture.detectChanges();
      expect(host.changeSpy).toHaveBeenCalledWith(true);
      getSwitch(fixture).click();
      fixture.detectChanges();
      expect(host.changeSpy).toHaveBeenCalledWith(false);
    });

    it('should toggle on Space key and prevent default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const el = getSwitch(fixture);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      el.dispatchEvent(event);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(true);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT toggle on Enter key — ARIA switch pattern is Space-only, matches tw-checkbox', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKey(getSwitch(fixture), 'Enter');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
    });

    it('should not toggle on other keys', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKey(getSwitch(fixture), 'a');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
    });

    it('should block click when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      getSwitch(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });

    it('should block keyboard when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      dispatchKey(getSwitch(fixture), ' ');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
    });

    it('should reflect programmatic parent updates', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      fixture.componentInstance.value.set(true);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('true');
    });
  });

  // ── Accessibility ──

  describe('accessibility', () => {
    it('should set aria-disabled when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('should reflect aria-label input to host attribute', () => {
      const fixture = TestBed.createComponent(AriaLabelHost);
      fixture.detectChanges();
      expect(getSwitch(fixture).getAttribute('aria-label')).toBe('Toggle feature');
    });

    it('should point aria-labelledby at the internal label when a visible label exists', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const el = getSwitch(fixture);
      const id = el.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${id}`)).toBeTruthy();
    });

    it('should assign a unique id per instance', () => {
      const f1 = TestBed.createComponent(BasicHost);
      const f2 = TestBed.createComponent(BasicHost);
      f1.detectChanges();
      f2.detectChanges();
      expect(getSwitch(f1).id).not.toBe(getSwitch(f2).id);
    });
  });

  // ── Content projection ──

  describe('content projection', () => {
    it('should render projected label content', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="projected-label"]')).toBeTruthy();
    });

    it('should render projected description content', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="projected-desc"]')).toBeTruthy();
    });

    it('should render projected on-icon and off-icon', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="on-icon"]')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('[data-testid="off-icon"]')).toBeTruthy();
    });
  });

  // ── FocusMonitor ──

  describe('FocusMonitor', () => {
    it('should monitor the host on init', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(focusMonitorSpy.monitor).toHaveBeenCalled();
    });

    it('should stop monitoring on destroy', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      fixture.destroy();
      expect(focusMonitorSpy.stopMonitoring).toHaveBeenCalled();
    });
  });
});

// ── ControlValueAccessor ──

describe('SwitchComponent CVA', () => {
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

  it('should initialize from reactive FormControl value', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should update FormControl on user toggle', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getSwitch(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('should reflect FormControl.setValue into the DOM', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should block interaction when FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-disabled')).toBe('true');
    getSwitch(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(false);
  });

  it('should work with template-driven ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
    getSwitch(fixture).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe(true);
  });
});

// ── Signal forms ──

describe('SwitchComponent signal forms', () => {
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
    fixture.componentInstance.switchForm.enabled().value.set(true);
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should update the field value when the user toggles', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getSwitch(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.switchForm.enabled().value()).toBe(true);
  });

  it('should mark the field as touched on blur', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getSwitch(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.switchForm.enabled().touched()).toBe(true);
  });
});

// ── Error state matcher ──

describe('SwitchComponent errorState', () => {
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
    const fixture = TestBed.createComponent(RequiredHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(getSwitch(fixture).getAttribute('aria-invalid')).toBe(null);
  });

  it('sets aria-invalid once the bound FormControl is touched + invalid', () => {
    const fixture = TestBed.createComponent(RequiredHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('clears aria-invalid once the user toggles and the control becomes valid', () => {
    const fixture = TestBed.createComponent(RequiredHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getSwitch(fixture).getAttribute('aria-invalid')).toBe('true');
    getSwitch(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.valid).toBe(true);
    expect(getSwitch(fixture).getAttribute('aria-invalid')).toBe(null);
  });
});
