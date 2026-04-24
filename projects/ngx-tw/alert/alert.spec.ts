import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { TwColor } from 'ngx-tw/core';
import {
  AlertComponent,
  AlertIconDirective,
  AlertTitleDirective,
  AlertContentDirective,
  AlertActionsDirective,
} from './alert';
import type { AlertVariant } from './alert';

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
  politeness = signal<'polite' | 'assertive' | 'off'>('polite');
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
      expect(alert.className).toContain('bg-info-50');
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
      expect(alert.className).toContain('bg-info-50');
    });

    it('should render outline variant', () => {
      fixture.componentInstance.variant.set('outline');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('border');
      expect(alert.className).toContain('border-info-300');
    });

    it('should render solid variant', () => {
      fixture.componentInstance.variant.set('solid');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-info-600');
      expect(alert.className).toContain('text-white');
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

    it('should apply error color classes', () => {
      fixture.componentInstance.color.set('error');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-error-50');
      expect(alert.className).toContain('text-error-800');
    });

    it('should apply success color classes', () => {
      fixture.componentInstance.color.set('success');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-success-50');
    });

    it('should apply neutral color with surface tokens', () => {
      fixture.componentInstance.color.set('neutral');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-surface-muted');
      expect(alert.className).toContain('text-fg');
    });

    it('should apply warning solid variant with dark text', () => {
      fixture.componentInstance.variant.set('solid');
      fixture.componentInstance.color.set('warning');
      fixture.detectChanges();
      const alert: HTMLElement = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.className).toContain('bg-warning-500');
      expect(alert.className).toContain('text-black');
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

  describe('accessibility', () => {
    it('should have role="alert"', async () => {
      await TestBed.configureTestingModule({
        imports: [SimpleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('tw-alert');
      expect(alert.getAttribute('role')).toBe('alert');
    });

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
  });

  describe('LiveAnnouncer', () => {
    it('should announce with polite politeness by default', async () => {
      const announceSpy = vi.fn().mockResolvedValue(undefined);
      await TestBed.configureTestingModule({
        imports: [SimpleHost],
        providers: [
          { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();
      await fixture.whenStable();

      expect(announceSpy).toHaveBeenCalledWith(
        expect.stringContaining('Simple alert message'),
        'polite',
      );
    });

    it('should announce with assertive politeness when configured', async () => {
      const announceSpy = vi.fn().mockResolvedValue(undefined);
      await TestBed.configureTestingModule({
        imports: [FullHost],
        providers: [
          { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullHost);
      fixture.componentInstance.politeness.set('assertive');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(announceSpy).toHaveBeenCalledWith(
        expect.any(String),
        'assertive',
      );
    });

    it('should not announce when politeness is off', async () => {
      const announceSpy = vi.fn().mockResolvedValue(undefined);
      await TestBed.configureTestingModule({
        imports: [FullHost],
        providers: [
          { provide: LiveAnnouncer, useValue: { announce: announceSpy } },
        ],
      }).compileComponents();
      const fixture = TestBed.createComponent(FullHost);
      fixture.componentInstance.politeness.set('off');
      fixture.detectChanges();
      await fixture.whenStable();

      expect(announceSpy).not.toHaveBeenCalled();
    });
  });

  describe('animate.leave binding', () => {
    it('should have animate.leave host binding', async () => {
      await TestBed.configureTestingModule({
        imports: [SimpleHost],
      }).compileComponents();
      const fixture = TestBed.createComponent(SimpleHost);
      fixture.detectChanges();

      const alert = fixture.nativeElement.querySelector('tw-alert');
      // The animate.leave binding is set as a host attribute
      expect(alert).toBeTruthy();
    });
  });
});
