import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, beforeEach } from 'vitest';
import type { TwColor } from 'ngx-tw/core';
import {
  AlertComponent,
  AlertIconDirective,
  AlertTitleDirective,
  AlertContentDirective,
  AlertActionsDirective,
} from './alert';
import type { AlertPoliteness, AlertVariant } from './alert';

// ── Test host components ──

@Component({
  imports: [AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-alert>Simple alert message</tw-alert>`,
})
class SimpleHost {}

@Component({
  imports: [
    AlertComponent,
    AlertIconDirective,
    AlertTitleDirective,
    AlertContentDirective,
    AlertActionsDirective,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-alert
      [variant]="variant()"
      [color]="color()"
      [dismissible]="dismissible()"
      [politeness]="politeness()"
      [dismissLabel]="dismissLabel()"
      (dismissed)="dismissCount.set(dismissCount() + 1)"
    >
      <svg twAlertIcon data-testid="icon">icon</svg>
      <span twAlertTitle data-testid="title">Alert Title</span>
      <span twAlertContent data-testid="content">Alert content text.</span>
      <div twAlertActions data-testid="actions">
        <button>Action</button>
      </div>
    </tw-alert>
  `,
})
class FullHost {
  variant = signal<AlertVariant>('soft');
  color = signal<TwColor>('info');
  dismissible = signal(false);
  politeness = signal<AlertPoliteness>('polite');
  dismissLabel = signal('Dismiss');
  dismissCount = signal(0);
}

@Component({
  imports: [AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-alert [dismissible]="true" (dismissed)="dismissCount.set(dismissCount() + 1)">
      Dismissible alert
    </tw-alert>
  `,
})
class DismissibleHost {
  dismissCount = signal(0);
}

@Component({
  imports: [AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-alert dismissible>Bare dismissible</tw-alert>`,
})
class BareDismissibleHost {}

@Component({
  imports: [AlertComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-alert class="bg-purple-500 rounded-none">Overridden</tw-alert>`,
})
class OverrideHost {}

// ── Tests ──

describe('AlertComponent', () => {
  describe('default render', () => {
    let fixture: ComponentFixture<SimpleHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SimpleHost],
      }).compileComponents();
      fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
    });

    it('should create without errors', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should render the alert element', () => {
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert).toBeTruthy();
    });

    it('should project simple text content', () => {
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.textContent).toContain('Simple alert message');
    });

    it('should apply soft info classes by default', () => {
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('rounded-lg');
      expect(alert.className).toContain('p-4');
      expect(alert.className).toContain('bg-info-soft');
    });

    it('should not render dismiss button by default', () => {
      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss).toBeNull();
    });
  });

  describe('variants', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
      fixture.detectChanges();
    });

    it('should render soft variant', () => {
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-info-soft');
    });

    it('should render outline variant', () => {
      fixture.componentInstance.variant.set('outline');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('border');
      expect(alert.className).toContain('border-info-border');
    });

    it('should render solid variant with the solid-fg slot token', () => {
      fixture.componentInstance.variant.set('solid');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-info-solid');
      expect(alert.className).toContain('text-info-solid-fg');
      // No raw shade picks — slot tokens own the pairing.
      expect(alert.className).not.toMatch(/bg-info-\d/);
      expect(alert.className).not.toMatch(/text-on-/);
    });

    it('should render each variant without errors', () => {
      for (const v of ['solid', 'outline', 'soft'] as AlertVariant[]) {
        fixture.componentInstance.variant.set(v);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('tw-alert')).toBeTruthy();
      }
    });
  });

  describe('color input', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
      fixture.detectChanges();
    });

    it('should apply error soft slot tokens', () => {
      fixture.componentInstance.color.set('error');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-error-soft');
      expect(alert.className).toContain('text-error-soft-fg-muted');
    });

    it('should apply success soft slot bg', () => {
      fixture.componentInstance.color.set('success');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-success-soft');
    });

    it('should apply neutral slot tokens (which alias surface/fg)', () => {
      fixture.componentInstance.color.set('neutral');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-neutral-soft');
      expect(alert.className).toContain('text-neutral-soft-fg-muted');
    });

    it('should apply warning solid variant with slot tokens', () => {
      fixture.componentInstance.variant.set('solid');
      fixture.componentInstance.color.set('warning');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-warning-solid');
      expect(alert.className).toContain('text-warning-solid-fg');
    });

    it('should apply success solid variant with slot tokens', () => {
      fixture.componentInstance.variant.set('solid');
      fixture.componentInstance.color.set('success');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-success-solid');
      expect(alert.className).toContain('text-success-solid-fg');
    });

    it('should render all color values without errors', () => {
      const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
      for (const c of colors) {
        fixture.componentInstance.color.set(c);
        fixture.detectChanges();
        expect(fixture.nativeElement.querySelector('tw-alert')).toBeTruthy();
      }
    });
  });

  describe('theme adaptation (slot-only, no dark: overrides)', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
      fixture.detectChanges();
    });

    it('should never emit `dark:` overrides — theme adaptation is owned by the slot tokens', () => {
      // Sweep every variant × color and assert no `dark:` utility is present.
      // The slot tokens (`bg-{role}-soft`, etc.) resolve to different values
      // per theme via CSS variables, so components no longer need `dark:`.
      const variants: AlertVariant[] = ['soft', 'outline', 'solid'];
      const colors: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
      for (const v of variants) {
        for (const c of colors) {
          fixture.componentInstance.variant.set(v);
          fixture.componentInstance.color.set(c);
          fixture.detectChanges();
          const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
          expect(alert.className, `variant=${v} color=${c}`).not.toMatch(/\bdark:/);
        }
      }
    });

    it('should consume only slot tokens for the soft info path', () => {
      fixture.componentInstance.variant.set('soft');
      fixture.componentInstance.color.set('info');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-info-soft');
      expect(alert.className).toContain('text-info-soft-fg-muted');
      // Title and content children carry the title-strength and body-muted slots.
      const title = fixture.nativeElement.querySelector('[twAlertTitle]');
      expect(title.className).toContain('text-info-soft-fg');
      const content = fixture.nativeElement.querySelector('[twAlertContent]');
      expect(content.className).toContain('text-info-soft-fg-muted');
    });

    it('should consume only slot tokens for the outline error path', () => {
      fixture.componentInstance.variant.set('outline');
      fixture.componentInstance.color.set('error');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('border-error-border');
      expect(alert.className).toContain('text-error-soft-fg-muted');
    });
  });

  describe('dismissible', () => {
    let fixture: ComponentFixture<DismissibleHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [DismissibleHost],
      }).compileComponents();
      fixture = TestBed.createComponent(DismissibleHost);
      fixture.detectChanges();
    });

    it('should render dismiss button when dismissible', () => {
      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss).toBeTruthy();
    });

    it('should size the dismiss button to size-6 (square-interactive xs)', () => {
      const dismiss: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss.className).toContain('size-6');
    });

    it('should add right padding when dismissible', () => {
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('pr-10');
    });

    it('should emit dismissed when dismiss button is clicked', () => {
      const dismiss: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      dismiss.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.dismissCount()).toBe(1);
    });

    it('should emit dismissed on each click', () => {
      const dismiss: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      dismiss.click();
      dismiss.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.dismissCount()).toBe(2);
    });
  });

  describe('dismissible booleanAttribute', () => {
    it('should treat bare `dismissible` attribute as true', async () => {
      await TestBed.configureTestingModule({
        imports: [BareDismissibleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(BareDismissibleHost);
      fixture.detectChanges();

      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss).toBeTruthy();
    });
  });

  describe('dismissLabel input', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
      fixture.componentInstance.dismissible.set(true);
      fixture.detectChanges();
    });

    it('should default the dismiss button aria-label to "Dismiss"', () => {
      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss).toBeTruthy();
    });

    it('should override the dismiss button aria-label when dismissLabel changes', () => {
      fixture.componentInstance.dismissLabel.set('Fermer');
      fixture.detectChanges();
      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Fermer"]');
      expect(dismiss).toBeTruthy();
      expect(fixture.nativeElement.querySelector('button[aria-label="Dismiss"]')).toBeNull();
    });
  });

  describe('content projection', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
      fixture.detectChanges();
    });

    it('should project icon directive', () => {
      const icon = fixture.nativeElement.querySelector('[twAlertIcon]');
      expect(icon).toBeTruthy();
    });

    it('should project title directive', () => {
      const title = fixture.nativeElement.querySelector('[twAlertTitle]');
      expect(title).toBeTruthy();
      expect(title.textContent).toContain('Alert Title');
    });

    it('should project content directive', () => {
      const content = fixture.nativeElement.querySelector('[twAlertContent]');
      expect(content).toBeTruthy();
      expect(content.textContent).toContain('Alert content text.');
    });

    it('should project actions directive', () => {
      const actions = fixture.nativeElement.querySelector('[twAlertActions]');
      expect(actions).toBeTruthy();
      expect(actions.textContent).toContain('Action');
    });

    it('should apply icon slot classes', () => {
      const icon = fixture.nativeElement.querySelector('[twAlertIcon]');
      const classes = icon.getAttribute('class') ?? '';
      expect(classes).toContain('size-5');
      expect(classes).toContain('shrink-0');
    });

    it('should apply title slot classes', () => {
      const title: HTMLElement = fixture.nativeElement.querySelector('[twAlertTitle]');
      expect(title.className).toContain('font-semibold');
    });

    it('should apply actions slot classes', () => {
      const actions: HTMLElement = fixture.nativeElement.querySelector('[twAlertActions]');
      expect(actions.className).toContain('flex');
      expect(actions.className).toContain('gap-2');
    });
  });

  describe('content without directives', () => {
    let fixture: ComponentFixture<SimpleHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [SimpleHost],
      }).compileComponents();
      fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
    });

    it('should not render icon column when no icon directive', () => {
      const icon = fixture.nativeElement.querySelector('[twAlertIcon]');
      expect(icon).toBeNull();
    });

    it('should render text content directly', () => {
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.textContent).toContain('Simple alert message');
    });
  });

  describe('role by politeness', () => {
    let fixture: ComponentFixture<FullHost>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [FullHost],
      }).compileComponents();
      fixture = TestBed.createComponent(FullHost);
    });

    it('should set role="status" for polite politeness (default)', () => {
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.getAttribute('role')).toBe('status');
    });

    it('should set role="alert" for assertive politeness', () => {
      fixture.componentInstance.politeness.set('assertive');
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.getAttribute('role')).toBe('alert');
    });

    it('should drop role entirely when politeness is off', () => {
      fixture.componentInstance.politeness.set('off');
      fixture.detectChanges();
      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.getAttribute('role')).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have aria-label on dismiss button', async () => {
      await TestBed.configureTestingModule({
        imports: [DismissibleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(DismissibleHost);
      fixture.detectChanges();

      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss).toBeTruthy();
      expect(dismiss.getAttribute('aria-label')).toBe('Dismiss');
    });

    it('should have type="button" on dismiss button', async () => {
      await TestBed.configureTestingModule({
        imports: [DismissibleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(DismissibleHost);
      fixture.detectChanges();

      const dismiss = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss.getAttribute('type')).toBe('button');
    });

    it('should expose a focus-visible outline on the dismiss button', async () => {
      await TestBed.configureTestingModule({
        imports: [DismissibleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(DismissibleHost);
      fixture.detectChanges();

      const dismiss: HTMLButtonElement = fixture.nativeElement.querySelector('button[aria-label="Dismiss"]');
      expect(dismiss.className).toContain('focus-visible:outline-2');
      expect(dismiss.className).toContain('focus-visible:outline-primary-500');
    });
  });

  describe('consumer classes', () => {
    it('should preserve consumer classes alongside internal classes', async () => {
      await TestBed.configureTestingModule({
        imports: [OverrideHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(OverrideHost);
      fixture.detectChanges();

      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-purple-500');
      expect(alert.className).toContain('rounded-none');
    });
  });
});
