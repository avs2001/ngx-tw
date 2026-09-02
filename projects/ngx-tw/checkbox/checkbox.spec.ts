import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { FocusMonitor } from '@angular/cdk/a11y';
import { CheckboxComponent } from './checkbox';
import type { CheckboxLabelPosition, CheckboxVariant } from './checkbox';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from '@cdevhub/ngx-tw/form-field';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-checkbox
      [(checked)]="value"
      [(indeterminate)]="indeterminate"
      [color]="color()"
      [size]="size()"
      [variant]="variant()"
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
  indeterminate = signal(false);
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  variant = signal<CheckboxVariant>('solid');
  disabled = signal(false);
  required = signal(false);
  label = signal<string | undefined>('Accept terms');
  description = signal<string | undefined>(undefined);
  labelPosition = signal<CheckboxLabelPosition>('after');
  changeSpy = vi.fn();
  onChange(v: boolean): void {
    this.changeSpy(v);
  }
}

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-checkbox [(checked)]="checked">
      <span data-testid="projected-label">Projected label</span>
      <span slot="description" data-testid="projected-desc">Projected description</span>
      <svg slot="check-icon" data-testid="check-icon">check</svg>
      <svg slot="indeterminate-icon" data-testid="ind-icon">ind</svg>
    </tw-checkbox>
  `,
})
class ProjectionHost {
  checked = signal(true);
}

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox aria-label="Accept policy" />`,
})
class AriaLabelHost {}

@Component({
  imports: [CheckboxComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox label="Reactive" [formControl]="control" />`,
})
class ReactiveHost {
  control = new FormControl<boolean>(false, { nonNullable: true });
}

@Component({
  imports: [CheckboxComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox label="Template driven" [(ngModel)]="value" />`,
})
class TemplateDrivenHost {
  value = false;
}

@Component({
  imports: [CheckboxComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox label="Signal" [formField]="checkboxForm.accepted" />`,
})
class SignalFormHost {
  protected readonly model = signal({ accepted: false });
  readonly checkboxForm = form(this.model);
}

// ── Helpers ───────────────────────────────────────────────────────

function getCheckbox(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-checkbox')!;
}

function dispatchKey(el: HTMLElement, key: string): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  el.dispatchEvent(event);
  return event;
}

// ── Tests ─────────────────────────────────────────────────────────

describe('CheckboxComponent', () => {
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
      expect(getCheckbox(fixture)).toBeTruthy();
    });

    it('should set role="checkbox" on the host', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('role')).toBe('checkbox');
    });

    it('should render aria-checked="false" by default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('false');
    });

    it('should render every color without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.value.set(true);
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
        expect(getCheckbox(fixture)).toBeTruthy();
      }
    });

    it('should render every size without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
      for (const s of sizes) {
        host.size.set(s);
        fixture.detectChanges();
        expect(getCheckbox(fixture)).toBeTruthy();
      }
    });

    it('should render every variant without errors', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.value.set(true);
      const variants: CheckboxVariant[] = ['solid', 'outline'];
      for (const v of variants) {
        host.variant.set(v);
        fixture.detectChanges();
        expect(getCheckbox(fixture)).toBeTruthy();
      }
    });

    it('should render the label input text', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).textContent).toContain('Accept terms');
    });

    it('should render the description input text', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.description.set('Required to continue');
      fixture.detectChanges();
      expect(getCheckbox(fixture).textContent).toContain('Required to continue');
    });
  });

  // ── Inputs ──

  describe('inputs', () => {
    it('should set aria-required when required is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('should omit aria-required when false', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).hasAttribute('aria-required')).toBe(false);
    });

    it('should set tabindex="0" by default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('tabindex')).toBe('0');
    });

    it('should set tabindex="-1" when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('tabindex')).toBe('-1');
    });

    it('should reverse flex direction when labelPosition is before', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.labelPosition.set('before');
      fixture.detectChanges();
      expect(getCheckbox(fixture).className).toContain('flex-row-reverse');
    });
  });

  // ── Interactions ──

  describe('interactions', () => {
    it('should toggle state on click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(host.value()).toBe(true);
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
    });

    it('should emit change output on click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const host = fixture.componentInstance;
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(host.changeSpy).toHaveBeenCalledWith(true);
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(host.changeSpy).toHaveBeenCalledWith(false);
    });

    it('should toggle on Space key and prevent default', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const el = getCheckbox(fixture);
      const event = new KeyboardEvent('keydown', { key: ' ', bubbles: true, cancelable: true });
      const preventDefaultSpy = vi.spyOn(event, 'preventDefault');
      el.dispatchEvent(event);
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(true);
      expect(preventDefaultSpy).toHaveBeenCalled();
    });

    it('should NOT toggle on Enter key', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKey(getCheckbox(fixture), 'Enter');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });

    it('should not toggle on other keys', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKey(getCheckbox(fixture), 'a');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
    });

    it('should block click when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
      expect(fixture.componentInstance.changeSpy).not.toHaveBeenCalled();
    });

    it('should block keyboard when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      dispatchKey(getCheckbox(fixture), ' ');
      fixture.detectChanges();
      expect(fixture.componentInstance.value()).toBe(false);
    });

    it('should reflect programmatic parent updates', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      fixture.componentInstance.value.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
    });
  });

  // ── Indeterminate state ──

  describe('indeterminate state', () => {
    it('should set aria-checked="mixed" when indeterminate is true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.indeterminate.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('mixed');
    });

    it('should set data-indeterminate attribute on host', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.indeterminate.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('data-indeterminate')).toBe('true');
    });

    it('should clear indeterminate and set checked=true when user toggles from indeterminate', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.indeterminate.set(true);
      fixture.detectChanges();
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(host.value()).toBe(true);
      expect(host.indeterminate()).toBe(false);
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
    });

    it('should flip aria-checked to "false" on subsequent toggle', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const host = fixture.componentInstance;
      host.indeterminate.set(true);
      fixture.detectChanges();
      getCheckbox(fixture).click();
      fixture.detectChanges();
      getCheckbox(fixture).click();
      fixture.detectChanges();
      expect(host.value()).toBe(false);
      expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('false');
    });
  });

  // ── Accessibility ──

  describe('accessibility', () => {
    it('should set aria-disabled when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('should reflect aria-label input to host attribute', () => {
      const fixture = TestBed.createComponent(AriaLabelHost);
      fixture.detectChanges();
      expect(getCheckbox(fixture).getAttribute('aria-label')).toBe('Accept policy');
    });

    it('should point aria-labelledby at the internal label when a visible label exists', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const el = getCheckbox(fixture);
      const id = el.getAttribute('aria-labelledby');
      expect(id).toBeTruthy();
      expect(fixture.nativeElement.querySelector(`#${id}`)).toBeTruthy();
    });

    it('should assign a unique id per instance', () => {
      const f1 = TestBed.createComponent(BasicHost);
      const f2 = TestBed.createComponent(BasicHost);
      f1.detectChanges();
      f2.detectChanges();
      expect(getCheckbox(f1).id).not.toBe(getCheckbox(f2).id);
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

    it('should render projected check-icon when checked', () => {
      const fixture = TestBed.createComponent(ProjectionHost);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[data-testid="check-icon"]')).toBeTruthy();
    });

    it('should fall back to default check SVG when no check-icon is projected', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set(true);
      fixture.detectChanges();
      expect(getCheckbox(fixture).querySelector('svg')).toBeTruthy();
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

describe('CheckboxComponent CVA', () => {
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
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should update FormControl on user toggle', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
  });

  it('should reflect FormControl.setValue into the DOM', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue(true);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should block interaction when FormControl is disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-disabled')).toBe('true');
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(false);
  });

  it('should clear indeterminate when FormControl.setValue is called', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    const instance = fixture.debugElement.query(By.directive(CheckboxComponent))
      .componentInstance as CheckboxComponent;
    instance.indeterminate.set(true);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('mixed');
    fixture.componentInstance.control.setValue(false);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('false');
  });

  it('should work with template-driven ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
    getCheckbox(fixture).click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value).toBe(true);
  });
});

// ── Signal forms ──

describe('CheckboxComponent touched timing', () => {
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
  // These four controls used to call it from their CHANGE handler too, so
  // `touched` flipped with no blur — `tw-checkbox` behaved differently from
  // `tw-slider` / `tw-input` for a consumer staging error display on `touched`
  // ("only show the error once they leave the field"). Both halves are
  // asserted through REAL DOM events: a direct `onTouched()` call would pass
  // regardless of what the template does.

  it('does not mark the control touched when the value changes without a blur', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(true);
    expect(fixture.componentInstance.control.touched).toBe(false);
  });

  it('marks the control touched on blur, even with no value change', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    getCheckbox(fixture).dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value).toBe(false);
    expect(fixture.componentInstance.control.touched).toBe(true);
  });
});

describe('CheckboxComponent signal forms', () => {
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
    fixture.componentInstance.checkboxForm.accepted().value.set(true);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('true');
  });

  it('should update the field value when the user toggles', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(fixture.componentInstance.checkboxForm.accepted().value()).toBe(true);
  });

  it('should mark the field as touched on blur', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    getCheckbox(fixture).dispatchEvent(new Event('blur'));
    fixture.detectChanges();
    expect(fixture.componentInstance.checkboxForm.accepted().touched()).toBe(true);
  });
});

// ── id input ─────────────────────────────────────────────────────

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox id="my-checkbox" label="Custom id" />`,
})
class CustomIdHost {}

describe('CheckboxComponent id input', () => {
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

  it('should round-trip the id attribute on the host', () => {
    const fixture = TestBed.createComponent(CustomIdHost);
    fixture.detectChanges();
    expect(getCheckbox(fixture).id).toBe('my-checkbox');
  });

  it('should derive aria-labelledby from the custom id', () => {
    const fixture = TestBed.createComponent(CustomIdHost);
    fixture.detectChanges();
    const labelledby = getCheckbox(fixture).getAttribute('aria-labelledby');
    expect(labelledby).toBe('my-checkbox-label');
    expect(fixture.nativeElement.querySelector('#my-checkbox-label')).toBeTruthy();
  });
});

// ── change-on-writeValue regression ──────────────────────────────

describe('CheckboxComponent change emission', () => {
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

  it('should NOT fire change when value is updated programmatically via writeValue', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const instance = fixture.debugElement.query(By.directive(CheckboxComponent))
      .componentInstance as CheckboxComponent;
    const changeSpy = vi.spyOn(instance.change, 'emit');
    instance.writeValue(true);
    fixture.detectChanges();
    expect(changeSpy).not.toHaveBeenCalled();
    instance.writeValue(false);
    fixture.detectChanges();
    expect(changeSpy).not.toHaveBeenCalled();
  });
});

// ── Dev-mode accessible-name warning ─────────────────────────────

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox />`,
})
class NoLabelHost {}

describe('CheckboxComponent accessible-name warning', () => {
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

  it('should warn in dev mode when no accessible name is provided', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(NoLabelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('[tw-checkbox] The checkbox has no accessible name'),
    );
    warnSpy.mockRestore();
  });

  it('should not warn when an aria-label is provided', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const fixture = TestBed.createComponent(AriaLabelHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const accessibleNameWarnings = warnSpy.mock.calls.filter((args) =>
      typeof args[0] === 'string' && args[0].includes('has no accessible name'),
    );
    expect(accessibleNameWarnings.length).toBe(0);
    warnSpy.mockRestore();
  });
});

// ── check-in animation class ─────────────────────────────────────

describe('CheckboxComponent check-in animation', () => {
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

  it('should render an icon span with the check-in enter animation when transitioning to checked', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    fixture.componentInstance.value.set(true);
    fixture.detectChanges();
    // We assert via the rendered icon span — Angular's `animate.enter` compiles
    // the class either onto the host or via a runtime hook that jsdom does not
    // execute, so we verify the icon container exists when checked is true.
    const icon = fixture.nativeElement.querySelector('tw-checkbox svg');
    expect(icon).toBeTruthy();
    // And the parent box span carries the active solid color, proving the
    // checked render path executed.
    const box = fixture.nativeElement.querySelector('tw-checkbox > span > span') as HTMLElement;
    expect(box.className).toMatch(/bg-(primary|secondary|accent|info|success|warning|error)-[56]00|bg-fg/);
  });

  it('should render the indeterminate icon span when transitioning to mixed', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    fixture.componentInstance.indeterminate.set(true);
    fixture.detectChanges();
    const icon = fixture.nativeElement.querySelector('tw-checkbox svg');
    expect(icon).toBeTruthy();
    expect(getCheckbox(fixture).getAttribute('aria-checked')).toBe('mixed');
  });
});

// ── Color × Variant combinatorial ────────────────────────────────

describe('CheckboxComponent color × variant combinatorial', () => {
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
  const variants: CheckboxVariant[] = ['solid', 'outline'];

  const SOLID_BG_HINT: Record<TwColor, string> = {
    primary: 'bg-primary-600',
    secondary: 'bg-secondary-600',
    accent: 'bg-accent-600',
    neutral: 'bg-fg',
    info: 'bg-info-600',
    success: 'bg-success-600',
    warning: 'bg-warning-500',
    error: 'bg-error-600',
  };

  const OUTLINE_BORDER_HINT: Record<TwColor, string> = {
    primary: 'border-primary-600',
    secondary: 'border-secondary-600',
    accent: 'border-accent-600',
    neutral: 'border-fg',
    info: 'border-info-600',
    success: 'border-success-600',
    warning: 'border-warning-500',
    error: 'border-error-600',
  };

  const SOLID_ICON_HINT: Record<TwColor, string> = {
    primary: 'text-on-primary',
    secondary: 'text-on-secondary',
    accent: 'text-on-accent',
    neutral: 'text-on-neutral',
    info: 'text-on-info',
    success: 'text-on-success',
    warning: 'text-on-warning',
    error: 'text-on-error',
  };

  const OUTLINE_ICON_HINT: Record<TwColor, string> = {
    primary: 'text-primary-600',
    secondary: 'text-secondary-600',
    accent: 'text-accent-600',
    neutral: 'text-fg',
    info: 'text-info-600',
    success: 'text-success-600',
    warning: 'text-warning-600',
    error: 'text-error-600',
  };

  for (const v of variants) {
    for (const c of colors) {
      it(`should render ${v} × ${c} with the right tokens when checked`, () => {
        const fixture = TestBed.createComponent(BasicHost);
        const host = fixture.componentInstance;
        host.variant.set(v);
        host.color.set(c);
        host.value.set(true);
        fixture.detectChanges();
        const box = fixture.nativeElement.querySelector('tw-checkbox > span > span') as HTMLElement;
        if (v === 'solid') {
          expect(box.className).toContain(SOLID_BG_HINT[c]);
        } else {
          expect(box.className).toContain(OUTLINE_BORDER_HINT[c]);
        }
        const iconColorSpan = fixture.nativeElement.querySelector(
          'tw-checkbox .inline-flex.items-center.justify-center.text-on-' + c +
            ', tw-checkbox .inline-flex.items-center.justify-center.text-' + c + '-600' +
            ', tw-checkbox .inline-flex.items-center.justify-center.text-fg' +
            ', tw-checkbox .inline-flex.items-center.justify-center.text-warning-600',
        );
        // Fall back to checking the rendered classes by walking all icon spans.
        const allInlineFlexes = Array.from(
          fixture.nativeElement.querySelectorAll('tw-checkbox span'),
        ) as HTMLElement[];
        const expectedIconToken =
          v === 'solid' ? SOLID_ICON_HINT[c] : OUTLINE_ICON_HINT[c];
        const hasExpected = allInlineFlexes.some((el) =>
          el.className.includes(expectedIconToken),
        );
        expect(hasExpected).toBe(true);
      });
    }
  }
});

// ── form-field interop ───────────────────────────────────────────

@Component({
  imports: [
    CheckboxComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formGroup">
      <tw-form-field>
        <label twLabel>Accept terms</label>
        <tw-checkbox formControlName="terms" />
        <span twHint>Required to continue</span>
        <span twError>You must accept the terms</span>
      </tw-form-field>
    </form>
  `,
})
class FormFieldHost {
  readonly formGroup = new FormGroup({
    terms: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });
}

describe('CheckboxComponent inside tw-form-field', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should register with the form-field as the control', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const ff = fixture.debugElement.query(By.directive(FormFieldComponent))
      .componentInstance as FormFieldComponent;
    expect(ff.control()).toBeTruthy();
    expect(ff.control()?.controlType).toBe('checkbox');
  });

  it('should associate the label "for" attribute with the checkbox id', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label[twLabel]') as HTMLLabelElement;
    const checkbox = getCheckbox(fixture);
    expect(label.getAttribute('for')).toBe(checkbox.id);
  });

  it('should merge the hint id into aria-describedby', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const hint = fixture.nativeElement.querySelector('[twHint]') as HTMLElement;
    const describedBy = getCheckbox(fixture).getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toContain(hint.id);
  });

  it('should flip aria-invalid="true" and switch describedby to error once touched + invalid', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.formGroup.controls.terms;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-invalid')).toBe('true');
    const error = fixture.nativeElement.querySelector('[twError]') as HTMLElement;
    const describedBy = getCheckbox(fixture).getAttribute('aria-describedby') ?? '';
    expect(describedBy.split(' ')).toContain(error.id);
  });

  it('should report required=true when the bound control has Validators.requiredTrue', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-required')).toBe('true');
  });

  // SC 4.1.2 regression guard. `<tw-checkbox>` is a custom element, so the
  // field's `<label for>` resolves to nothing — `aria-labelledby` is the ONLY
  // route from the visible label to the control. Before `setLabelledByIds` was
  // overridden this pointed at the checkbox's own label span, which is empty in
  // this arrangement, leaving the control with no accessible name at all.
  it('should point aria-labelledby at the projected form-field label', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label[twLabel]') as HTMLLabelElement;
    const labelledBy = getCheckbox(fixture).getAttribute('aria-labelledby') ?? '';
    expect(labelledBy.split(' ')).toContain(label.id);
  });

  it('should resolve aria-labelledby to the visible label text', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const ids = (getCheckbox(fixture).getAttribute('aria-labelledby') ?? '').split(' ');
    const name = ids
      .map((id) => fixture.nativeElement.querySelector(`#${id}`)?.textContent?.trim() ?? '')
      .join(' ')
      .trim();
    expect(name).toBe('Accept terms');
  });
});

// ── form-field interop: [twError match="…"] ──────────────────────
//
// Guard for FIX-1/#2. `FormFieldComponent.activeErrorKeys` is built from
// `control()?.errors?.()`, an OPTIONAL member of `FormFieldControl`. While the
// checkbox omitted it the key set was permanently empty, so every `match`ed
// error carried `class="hidden"` forever — in all three form strategies, and
// including error codes the control itself produces. Deleting the `errors`
// computed from `checkbox.ts` still passes every other test in this file.

@Component({
  imports: [
    CheckboxComponent,
    FormFieldComponent,
    LabelDirective,
    ErrorDirective,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form [formGroup]="formGroup">
      <tw-form-field>
        <label twLabel>Accept terms</label>
        <tw-checkbox formControlName="terms" />
        <span twError match="required" data-testid="matched">You must accept the terms</span>
        <span twError match="somethingElse" data-testid="unmatched">Not this one</span>
      </tw-form-field>
    </form>
  `,
})
class MatchedErrorHost {
  readonly formGroup = new FormGroup({
    terms: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });
}

describe('CheckboxComponent [twError match]', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  /**
   * "Visible" = present in the DOM AND not carrying `ErrorDirective`'s
   * `hidden` class. Both halves matter: `match` filtering works by toggling
   * `hidden`, but the form-field also drops the whole subscript row once it
   * leaves the error state, so a cleared error disappears rather than hides.
   */
  function errorVisible(fixture: ComponentFixture<unknown>, testid: string): boolean {
    const el = fixture.nativeElement.querySelector(
      `[data-testid="${testid}"]`,
    ) as HTMLElement | null;
    return !!el && !el.classList.contains('hidden');
  }

  it('shows a match-targeted error once the control reports that key', () => {
    const fixture = TestBed.createComponent(MatchedErrorHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.formGroup.controls.terms;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    fixture.detectChanges();
    expect(ctrl.errors).toEqual({ required: true });
    expect(errorVisible(fixture, 'matched')).toBe(true);
  });

  it('keeps a non-matching error hidden', () => {
    const fixture = TestBed.createComponent(MatchedErrorHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.formGroup.controls.terms;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    fixture.detectChanges();
    expect(errorVisible(fixture, 'unmatched')).toBe(false);
  });

  it('re-hides the matched error once the validator clears', () => {
    const fixture = TestBed.createComponent(MatchedErrorHost);
    fixture.detectChanges();
    const ctrl = fixture.componentInstance.formGroup.controls.terms;
    ctrl.markAsTouched();
    ctrl.updateValueAndValidity();
    fixture.detectChanges();
    expect(errorVisible(fixture, 'matched')).toBe(true);
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(ctrl.errors).toBe(null);
    expect(errorVisible(fixture, 'matched')).toBe(false);
  });
});

// ── form-field interop: consumer aria-labelledby ─────────────────

@Component({
  imports: [CheckboxComponent, FormFieldComponent, LabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="external-note">and the addendum</span>
    <tw-form-field>
      <label twLabel>Accept terms</label>
      <tw-checkbox aria-labelledby="external-note" />
    </tw-form-field>
  `,
})
class FormFieldExternalLabelHost {}

describe('CheckboxComponent inside tw-form-field with a consumer aria-labelledby', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  // The form-field merges `userAriaLabelledby` into the ids it pushes down, so
  // a consumer reference must survive alongside the projected label rather than
  // being replaced by it.
  it('should keep both the projected label id and the consumer-supplied id', () => {
    const fixture = TestBed.createComponent(FormFieldExternalLabelHost);
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('label[twLabel]') as HTMLLabelElement;
    const ids = (getCheckbox(fixture).getAttribute('aria-labelledby') ?? '').split(' ');
    expect(ids).toContain(label.id);
    expect(ids).toContain('external-note');
  });
});

// ── ErrorStateMatcher / errorState ───────────────────────────────

@Component({
  imports: [CheckboxComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox label="Reactive required" [formControl]="control" />`,
})
class ReactiveRequiredHost {
  readonly control = new FormControl<boolean>(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });
}

describe('CheckboxComponent error state', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should not be in error state while pristine even when invalid', () => {
    const fixture = TestBed.createComponent(ReactiveRequiredHost);
    fixture.detectChanges();
    expect(fixture.componentInstance.control.invalid).toBe(true);
    expect(getCheckbox(fixture).hasAttribute('aria-invalid')).toBe(false);
  });

  it('should flip aria-invalid="true" once touched + invalid', () => {
    const fixture = TestBed.createComponent(ReactiveRequiredHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-invalid')).toBe('true');
  });

  it('should swap the box border to error-500 when not active and in error state', () => {
    const fixture = TestBed.createComponent(ReactiveRequiredHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    const box = fixture.nativeElement.querySelector('tw-checkbox > span > span') as HTMLElement;
    expect(box.className).toContain('border-error-500');
  });

  it('should clear aria-invalid after the user fixes the value', () => {
    const fixture = TestBed.createComponent(ReactiveRequiredHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-invalid')).toBe('true');
    getCheckbox(fixture).click();
    fixture.detectChanges();
    expect(getCheckbox(fixture).hasAttribute('aria-invalid')).toBe(false);
  });
});

// ── Hidden native input for form submission ──────────────────────

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <form #f>
      <tw-checkbox name="terms" [checked]="true" label="Accept" />
    </form>
  `,
})
class NativeFormHost {}

describe('CheckboxComponent hidden native input', () => {
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

  it('should render a hidden (display:none) input[type=checkbox] inside the host', () => {
    const fixture = TestBed.createComponent(NativeFormHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('tw-checkbox input[type=checkbox]') as HTMLInputElement;
    expect(input).toBeTruthy();
    // `hidden` (display:none), not `sr-only`: a non-rendered control is excluded
    // from the focus order, so axe's `nested-interactive` rule does not flag it
    // inside the `role="checkbox"` host — while it still submits in a native
    // <form> (the entry-list algorithm excludes only `disabled`, not hidden).
    expect(input.hidden).toBe(true);
    expect(input.getAttribute('aria-hidden')).toBe('true');
  });

  it('should mirror name, checked, and disabled onto the hidden input', () => {
    const fixture = TestBed.createComponent(NativeFormHost);
    fixture.detectChanges();
    const input = fixture.nativeElement.querySelector('tw-checkbox input[type=checkbox]') as HTMLInputElement;
    expect(input.name).toBe('terms');
    expect(input.checked).toBe(true);
    expect(input.disabled).toBe(false);
  });

  it('should include the checkbox in the form FormData on submit', () => {
    const fixture = TestBed.createComponent(NativeFormHost);
    fixture.detectChanges();
    const formEl = fixture.nativeElement.querySelector('form') as HTMLFormElement;
    const data = new FormData(formEl);
    expect(data.get('terms')).toBe('on');
  });
});

// ── Mixed label/description API precedence ───────────────────────

@Component({
  imports: [CheckboxComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-checkbox label="Input label" description="Input description">
      <span data-testid="custom-label">Projected label</span>
      <span slot="description" data-testid="custom-desc">Projected description</span>
    </tw-checkbox>
  `,
})
class MixedHost {}

describe('CheckboxComponent label/description precedence', () => {
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

  it('should render projected label and hide the input label text', () => {
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    const labelText = fixture.nativeElement.querySelector('tw-checkbox')!.textContent ?? '';
    expect(labelText).toContain('Projected label');
    expect(labelText).not.toContain('Input label');
  });

  it('should render projected description and hide the input description text', () => {
    const fixture = TestBed.createComponent(MixedHost);
    fixture.detectChanges();
    const labelText = fixture.nativeElement.querySelector('tw-checkbox')!.textContent ?? '';
    expect(labelText).toContain('Projected description');
    expect(labelText).not.toContain('Input description');
  });
});

// ── focused() signal ─────────────────────────────────────────────

describe('CheckboxComponent focused signal', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should expose focused() signal that flips on focus/blur', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const instance = fixture.debugElement.query(By.directive(CheckboxComponent))
      .componentInstance as CheckboxComponent;
    const el = getCheckbox(fixture);
    expect(instance.focused()).toBe(false);
    el.focus();
    el.dispatchEvent(new FocusEvent('focus'));
    fixture.detectChanges();
    expect(instance.focused()).toBe(true);
    el.blur();
    el.dispatchEvent(new FocusEvent('blur'));
    fixture.detectChanges();
    expect(instance.focused()).toBe(false);
  });
});

// ── Signal-forms required validator ──────────────────────────────

@Component({
  imports: [CheckboxComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-checkbox label="Signal required" [formField]="signalForm.accepted" />`,
})
class SignalRequiredHost {
  protected readonly model = signal({ accepted: false });
  readonly signalForm = form(this.model, (p) => {
    required(p.accepted);
  });
}

describe('CheckboxComponent signal-forms required', () => {
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

  it('should report aria-required="true" from a signal-forms required rule', () => {
    const fixture = TestBed.createComponent(SignalRequiredHost);
    fixture.detectChanges();
    expect(getCheckbox(fixture).getAttribute('aria-required')).toBe('true');
  });
});

// ── Size axis ─────────────────────────────────────────────────────
//
// The checkbox's rendered row is `max(boxWrap min-h, label first-line leading)`, and the
// host is the interactive target (role, tabindex and click all sit on the root). Before the
// vertical-rhythm follow-up it measured 16 / 20 / 20 / 24 / 28px — `sm` and `md` rendered an
// identical row, so one of the five steps did nothing. It is now 16 / 20 / 24 / 28 / 32.
//
// jsdom performs no layout, so the row height itself cannot be read back. What these tests
// assert instead is the property that fix establishes: the two elements that determine the
// row resolve differently at every step of the axis. That fails the moment a step is
// collapsed again, which is the regression worth guarding.

describe('CheckboxComponent size axis', () => {
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

  /** `[boxWrap, label]` — the two elements whose box the rendered row height comes from. */
  function rowElements(fixture: ComponentFixture<unknown>): [HTMLElement, HTMLElement] {
    const spans = [...getCheckbox(fixture).children].filter(
      el => el.tagName === 'SPAN',
    ) as HTMLElement[];
    return [spans[0], spans[1].firstElementChild as HTMLElement];
  }

  function renderEachSize(
    fixture: ComponentFixture<BasicHost>,
    pick: (fixture: ComponentFixture<unknown>) => string,
  ): string[] {
    return SIZES.map(size => {
      fixture.componentInstance.size.set(size);
      fixture.detectChanges();
      return pick(fixture);
    });
  }

  it('should size the box wrapper differently at every step', () => {
    const fixture = TestBed.createComponent(BasicHost);
    const rendered = renderEachSize(fixture, f => rowElements(f)[0].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should size the label line differently at every step', () => {
    const fixture = TestBed.createComponent(BasicHost);
    const rendered = renderEachSize(fixture, f => rowElements(f)[1].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should keep the steps distinct when no label is projected', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.label.set(undefined);
    const rendered = renderEachSize(fixture, f => rowElements(f)[0].className);
    expect(new Set(rendered).size).toBe(SIZES.length);
  });

  it('should render sm and md differently — the historical dead step', () => {
    const fixture = TestBed.createComponent(BasicHost);

    fixture.componentInstance.size.set('sm');
    fixture.detectChanges();
    const [smBoxWrap, smLabel] = rowElements(fixture).map(el => el.className);

    fixture.componentInstance.size.set('md');
    fixture.detectChanges();
    const [mdBoxWrap, mdLabel] = rowElements(fixture).map(el => el.className);

    expect(mdBoxWrap).not.toBe(smBoxWrap);
    expect(mdLabel).not.toBe(smLabel);
  });

  // Pre-existing invariant, not part of the row fix — the box glyph was already
  // 14/16/20/24/28 and this passes on the code before it. Pinned because the row scale is now
  // driven by `boxWrap`, which makes it possible to "simplify" the glyph onto the row without
  // anything else failing.
  it('should keep the box glyph on a five-step scale of its own, independent of the row', () => {
    const fixture = TestBed.createComponent(BasicHost);
    const rendered = renderEachSize(
      fixture,
      f => (rowElements(f)[0].firstElementChild as HTMLElement).className,
    );
    expect(new Set(rendered).size).toBe(SIZES.length);
  });
});
