import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { By } from '@angular/platform-browser';
import { FocusMonitor } from '@angular/cdk/a11y';
import { CheckboxComponent } from './checkbox';
import type { CheckboxLabelPosition, CheckboxVariant } from './checkbox';
import type { TwColor, TwSize } from 'ngx-tw/core';

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
