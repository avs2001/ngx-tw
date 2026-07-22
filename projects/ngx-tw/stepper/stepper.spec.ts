import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  provideTwStepperOptions,
  StepComponent,
  StepLabelDirective,
  StepperComponent,
  StepperIconDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  type StepperVariant,
} from './stepper';

// ── Test hosts ──

@Component({
  imports: [StepperComponent, StepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="One">Content one</tw-step>
      <tw-step label="Two">Content two</tw-step>
      <tw-step label="Three">Content three</tw-step>
    </tw-stepper>
  `,
})
class BasicHost {
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper
      [variant]="variant()"
      [color]="color()"
      [size]="size()"
      [orientation]="orientation()"
      [selectedIndex]="index()" (selectedIndexChange)="index.set($event)"
    >
      <tw-step label="Alpha">A</tw-step>
      <tw-step label="Beta">B</tw-step>
      <tw-step label="Gamma">C</tw-step>
    </tw-stepper>
  `,
})
class VariantHost {
  variant = signal<StepperVariant>('default');
  color = signal<TwColor>('primary');
  size = signal<TwSize>('md');
  orientation = signal<'horizontal' | 'vertical'>('horizontal');
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper linear [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="Required" [stepControl]="firstControl">Fill me</tw-step>
      <tw-step label="Next">Next content</tw-step>
      <tw-step label="Done">Done content</tw-step>
    </tw-stepper>
  `,
})
class LinearHost {
  firstControl = new FormControl('', Validators.required);
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [headerInteractive]="interactive()" [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="A">a</tw-step>
      <tw-step label="B">b</tw-step>
    </tw-stepper>
  `,
})
class InteractiveHost {
  interactive = signal(false);
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [showError]="showError()" [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="A" [hasError]="hasError()" errorMessage="Something broke">a</tw-step>
      <tw-step label="B">b</tw-step>
    </tw-stepper>
  `,
})
class ErrorHost {
  hasError = signal(true);
  showError = signal(true);
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent, StepperIconDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="First">
        <ng-template twStepperIcon state="number">
          <span data-testid="custom-number-icon">★</span>
        </ng-template>
        first content
      </tw-step>
      <tw-step label="Second">second content</tw-step>
    </tw-stepper>
  `,
})
class CustomIconHost {
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent, StepLabelDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step>
        <ng-template twStepLabel>
          <span data-testid="custom-label">Custom Label!</span>
        </ng-template>
        content
      </tw-step>
      <tw-step label="Plain">plain content</tw-step>
    </tw-stepper>
  `,
})
class CustomLabelHost {
  index = signal(0);
}

@Component({
  imports: [StepperComponent, StepComponent, StepperNextDirective, StepperPreviousDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-stepper [selectedIndex]="index()" (selectedIndexChange)="index.set($event)">
      <tw-step label="One">
        <button twStepperNext data-testid="next-1">Next</button>
      </tw-step>
      <tw-step label="Two">
        <button twStepperPrevious data-testid="prev-2">Back</button>
        <button twStepperNext data-testid="next-2">Next</button>
      </tw-step>
      <tw-step label="Three">Done</tw-step>
    </tw-stepper>
  `,
})
class NavButtonsHost {
  index = signal(0);
}

// ── Helpers ──

function getStepper<T>(fixture: ComponentFixture<T>): StepperComponent {
  const debugEl = fixture.debugElement.query(
    (el) => el.componentInstance instanceof StepperComponent,
  );
  return debugEl.componentInstance as StepperComponent;
}

function queryHeaders(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('button[cdkStepHeader]'),
  ) as HTMLButtonElement[];
}

function queryTablist(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
}

function queryPanel(fixture: ComponentFixture<unknown>): HTMLElement | null {
  return fixture.nativeElement.querySelector('[role="tabpanel"]');
}

// ── Specs ──

describe('StepperComponent', () => {
  describe('Rendering', () => {
    it('renders without errors with defaults', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(queryHeaders(fixture)).toHaveLength(3);
      expect(queryTablist(fixture)).toBeTruthy();
    });

    it('renders a panel for the selected step', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const panel = queryPanel(fixture);
      expect(panel).toBeTruthy();
      expect(panel?.textContent).toContain('Content one');
    });

    it('renders each variant without error', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      for (const v of ['default', 'dot', 'simple'] as StepperVariant[]) {
        fixture.componentInstance.variant.set(v);
        fixture.detectChanges();
        expect(queryHeaders(fixture)).toHaveLength(3);
      }
    });

    it('renders each color without error', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
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
        fixture.componentInstance.color.set(c);
        fixture.detectChanges();
        expect(queryHeaders(fixture)).toHaveLength(3);
      }
    });

    it('renders each size without error', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      for (const s of ['xs', 'sm', 'md', 'lg', 'xl'] as TwSize[]) {
        fixture.componentInstance.size.set(s);
        fixture.detectChanges();
        expect(queryHeaders(fixture)).toHaveLength(3);
      }
    });

    it('renders both orientations', () => {
      const fixture = TestBed.createComponent(VariantHost);
      fixture.detectChanges();
      fixture.componentInstance.orientation.set('vertical');
      fixture.detectChanges();
      expect(queryTablist(fixture).getAttribute('aria-orientation')).toBe('vertical');
      fixture.componentInstance.orientation.set('horizontal');
      fixture.detectChanges();
      expect(queryTablist(fixture).getAttribute('aria-orientation')).toBe('horizontal');
    });
  });

  describe('Selection', () => {
    it('updates selectedIndex on header click', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const headers = queryHeaders(fixture);
      headers[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(1);
    });

    it('reflects external selectedIndex changes in the DOM', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      fixture.componentInstance.index.set(2);
      fixture.detectChanges();
      const selected = queryHeaders(fixture).find(
        (h) => h.getAttribute('aria-selected') === 'true',
      );
      expect(selected?.textContent).toContain('Three');
      expect(queryPanel(fixture)?.textContent).toContain('Content three');
    });

    it('emits selectionChange with the StepperSelectionEvent payload', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const stepper = getStepper(fixture);
      fixture.detectChanges();

      const spy = vi.fn();
      stepper.selectionChange.subscribe(spy);

      queryHeaders(fixture)[1].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledTimes(1);
      const event = spy.mock.calls[0][0];
      expect(event.selectedIndex).toBe(1);
      expect(event.previouslySelectedIndex).toBe(0);
    });

    it('next() advances, previous() goes back', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const stepper = getStepper(fixture);
      fixture.detectChanges();
      stepper.next();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(1);
      stepper.previous();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(0);
    });
  });

  describe('Linear mode', () => {
    it('blocks next() when stepControl is invalid', () => {
      const fixture = TestBed.createComponent(LinearHost);
      const stepper = getStepper(fixture);
      fixture.detectChanges();
      stepper.next();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(0);
    });

    it('allows next() once stepControl becomes valid', () => {
      const fixture = TestBed.createComponent(LinearHost);
      const stepper = getStepper(fixture);
      fixture.detectChanges();
      fixture.componentInstance.firstControl.setValue('hello');
      fixture.detectChanges();
      stepper.next();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(1);
    });

    it('marks future steps as aria-disabled when not navigable', () => {
      const fixture = TestBed.createComponent(LinearHost);
      fixture.detectChanges();
      const headers = queryHeaders(fixture);
      expect(headers[2].getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('headerInteractive', () => {
    it('prevents header click selection when false', () => {
      const fixture = TestBed.createComponent(InteractiveHost);
      fixture.detectChanges();
      queryHeaders(fixture)[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(0);
    });

    it('allows header click selection when true', () => {
      const fixture = TestBed.createComponent(InteractiveHost);
      fixture.componentInstance.interactive.set(true);
      fixture.detectChanges();
      queryHeaders(fixture)[1].click();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(1);
    });
  });

  describe('Error state', () => {
    it('sets aria-invalid on a step with hasError when showError is true', () => {
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.detectChanges();
      expect(queryHeaders(fixture)[0].getAttribute('aria-invalid')).toBe('true');
    });

    it('does not mark aria-invalid when showError is false', () => {
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.componentInstance.showError.set(false);
      fixture.detectChanges();
      expect(queryHeaders(fixture)[0].getAttribute('aria-invalid')).toBeNull();
    });

    it('exposes errorMessage to screen readers via sr-only', () => {
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.detectChanges();
      const srOnly = queryHeaders(fixture)[0].querySelector('.sr-only');
      expect(srOnly?.textContent?.trim()).toBe('Something broke');
    });

    it('is suppressed by provideTwStepperOptions({ showError: false })', () => {
      TestBed.resetTestingModule();
      TestBed.configureTestingModule({
        providers: [provideTwStepperOptions({ showError: false })],
      });
      const fixture = TestBed.createComponent(ErrorHost);
      fixture.detectChanges();
      expect(queryHeaders(fixture)[0].getAttribute('aria-invalid')).toBeNull();
    });
  });

  describe('Content projection', () => {
    it('renders a custom icon template for a matching state', () => {
      const fixture = TestBed.createComponent(CustomIconHost);
      fixture.detectChanges();
      expect(
        fixture.nativeElement.querySelector('[data-testid="custom-number-icon"]'),
      ).toBeTruthy();
    });

    it('renders a custom label template in place of the string label', () => {
      const fixture = TestBed.createComponent(CustomLabelHost);
      fixture.detectChanges();
      const customLabel = fixture.nativeElement.querySelector(
        '[data-testid="custom-label"]',
      );
      expect(customLabel).toBeTruthy();
      expect(customLabel.textContent).toBe('Custom Label!');
    });
  });

  describe('Next / Previous directives', () => {
    it('advances when a [twStepperNext] button is clicked', () => {
      const fixture = TestBed.createComponent(NavButtonsHost);
      fixture.detectChanges();
      const nextBtn = fixture.nativeElement.querySelector(
        '[data-testid="next-1"]',
      ) as HTMLButtonElement;
      nextBtn.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(1);
    });

    it('goes back when a [twStepperPrevious] button is clicked', () => {
      const fixture = TestBed.createComponent(NavButtonsHost);
      fixture.componentInstance.index.set(1);
      fixture.detectChanges();
      const prevBtn = fixture.nativeElement.querySelector(
        '[data-testid="prev-2"]',
      ) as HTMLButtonElement;
      prevBtn.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.index()).toBe(0);
    });
  });

  describe('Accessibility', () => {
    it('sets role=tablist and aria-orientation on the header strip', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const tablist = queryTablist(fixture);
      expect(tablist.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('sets role=tab and aria-selected on headers', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const headers = queryHeaders(fixture);
      expect(headers[0].getAttribute('role')).toBe('tab');
      expect(headers[0].getAttribute('aria-selected')).toBe('true');
      expect(headers[1].getAttribute('aria-selected')).toBe('false');
    });

    it('sets aria-current="step" on the selected header only', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const headers = queryHeaders(fixture);
      expect(headers[0].getAttribute('aria-current')).toBe('step');
      expect(headers[1].getAttribute('aria-current')).toBeNull();
    });

    it('wires aria-controls / aria-labelledby between header and panel', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const header = queryHeaders(fixture)[0];
      const panel = queryPanel(fixture);
      expect(header.getAttribute('aria-controls')).toBe(panel?.id);
      expect(panel?.getAttribute('aria-labelledby')).toBe(header.id);
    });

    it('gives the panel role=tabpanel and tabindex=0', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const panel = queryPanel(fixture);
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.getAttribute('tabindex')).toBe('0');
    });

    it('applies a focus-visible outline ring to the focusable panel', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const panel = queryPanel(fixture);
      const cls = panel?.className ?? '';
      expect(cls).toContain('focus-visible:outline-2');
      expect(cls).toContain('focus-visible:outline-offset-2');
      expect(cls).toContain('focus-visible:outline-primary-500');
    });

    it('announces the selected step via LiveAnnouncer', () => {
      const fixture = TestBed.createComponent(BasicHost);
      const announcer = TestBed.inject(LiveAnnouncer);
      const spy = vi.spyOn(announcer, 'announce');
      fixture.detectChanges();

      queryHeaders(fixture)[1].click();
      fixture.detectChanges();

      expect(spy).toHaveBeenCalledWith('Two, step 2 of 3');
    });
  });

  describe('keyboard / roving tabindex', () => {
    it('keeps exactly one step header in the tab order', async () => {
      // `role="tab"` elements must form a single tab stop with arrow-key
      // traversal inside (WAI-ARIA APG tabs pattern). Without a roving
      // tabindex every header is individually tabbable, so crossing a 6-step
      // wizard costs a keyboard user 6 Tab presses and conformance audits flag
      // the tablist. CdkStepHeader supplies `role` only — the tabindex is the
      // host's job.
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('button[role="tab"]'),
      ) as HTMLElement[];
      expect(headers.length).toBeGreaterThan(1);

      const tabbable = headers.filter((h) => h.getAttribute('tabindex') === '0');
      expect(tabbable.length).toBe(1);
      expect(headers.every((h) => h.getAttribute('tabindex') !== null)).toBe(true);
    });

    it('moves the tab stop to the selected step', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const headers = () =>
        Array.from(fixture.nativeElement.querySelectorAll('button[role="tab"]')) as HTMLElement[];
      expect(headers()[0].getAttribute('tabindex')).toBe('0');

      headers()[1].click();
      fixture.detectChanges();
      await fixture.whenStable();

      expect(headers()[1].getAttribute('tabindex')).toBe('0');
      expect(headers()[0].getAttribute('tabindex')).toBe('-1');
    });

    it('Home and End jump to the first and last header', async () => {
      // Guards the view-query override specifically. CdkStepper declares
      // `_stepHeader` as a CONTENT query, but tw-stepper renders its headers in
      // its own template — so before the override the FocusKeyManager had zero
      // items and every one of these keys was a no-op. A test that only checked
      // "focus did not move" would have passed against that broken state, so
      // these assert the destination.
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('button[role="tab"]'),
      ) as HTMLElement[];
      const tablist = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
      const press = (key: string, keyCode: number) => {
        tablist.dispatchEvent(
          new KeyboardEvent('keydown', { key, keyCode, bubbles: true, cancelable: true }),
        );
        fixture.detectChanges();
      };

      headers[0].focus();
      press('End', 35);
      expect(document.activeElement).toBe(headers[headers.length - 1]);
      expect(headers[headers.length - 1].getAttribute('tabindex')).toBe('0');

      press('Home', 36);
      expect(document.activeElement).toBe(headers[0]);
      expect(headers[0].getAttribute('tabindex')).toBe('0');
    });

    it('ArrowRight moves focus to the next header without changing selection', async () => {
      // Delegated to CdkStepper's FocusKeyManager. The wiring (the tablist
      // keydown binding + cdkStepHeader on each button) is otherwise untested —
      // removing the binding would fail no spec.
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      await fixture.whenStable();

      const headers = Array.from(
        fixture.nativeElement.querySelectorAll('button[role="tab"]'),
      ) as HTMLElement[];
      headers[0].focus();

      const tablist = fixture.nativeElement.querySelector('[role="tablist"]') as HTMLElement;
      // `keyCode` is required: CDK's ListKeyManager reads it, and jsdom leaves
      // it at 0 when only `key` is supplied.
      tablist.dispatchEvent(
        new KeyboardEvent('keydown', {
          key: 'ArrowRight',
          keyCode: 39,
          bubbles: true,
          cancelable: true,
        }),
      );
      fixture.detectChanges();
      await fixture.whenStable();

      expect(document.activeElement).toBe(headers[1]);
      // Focus moves; selection does not (APG: arrow keys traverse, Enter/Space
      // activates). The tab stop follows focus.
      expect(headers[1].getAttribute('aria-selected')).toBe('false');
      expect(headers[1].getAttribute('tabindex')).toBe('0');
      expect(headers[0].getAttribute('tabindex')).toBe('-1');
    });
  });


});
