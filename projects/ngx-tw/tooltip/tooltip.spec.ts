import { Component, signal, type TemplateRef, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import { TooltipDirective } from './tooltip';
import type { TwColor } from 'ngx-tw/core';
import type { TooltipPosition, TooltipSize } from './tooltip';

// ── Test host components ──

@Component({
  imports: [TooltipDirective],
  template: `<button twTooltip="Hello tooltip">Hover me</button>`,
})
class BasicTooltipHost {}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Styled"
      [twTooltipColor]="color"
      [twTooltipSize]="size"
      [twTooltipPosition]="position"
    >
      Styled
    </button>
  `,
})
class StyledTooltipHost {
  color: TwColor = 'neutral';
  size: TooltipSize = 'md';
  position: TooltipPosition = 'top';
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Disabled tip"
      [twTooltipDisabled]="disabled()"
    >
      Disabled
    </button>
  `,
})
class DisabledTooltipHost {
  readonly disabled = signal(false);
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Arrow test"
      [twTooltipArrow]="showArrow"
      [twTooltipShowDelay]="0"
    >
      Arrow
    </button>
  `,
})
class ArrowTooltipHost {
  showArrow = true;
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button [twTooltip]="tipTemplate" [twTooltipShowDelay]="0">Template</button>
    <ng-template #tipTemplate><strong>Rich</strong> content</ng-template>
  `,
})
class TemplateTooltipHost {
  readonly tipRef = viewChild<TemplateRef<void>>('tipTemplate');
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Programmatic"
      #tip="twTooltip"
      [twTooltipShowDelay]="0"
      [twTooltipHideDelay]="0"
    >
      Toggle
    </button>
  `,
})
class ProgrammaticTooltipHost {
  readonly tip = viewChild.required<TooltipDirective>('tip');
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Events"
      [twTooltipShowDelay]="0"
      [twTooltipHideDelay]="0"
      (twTooltipShown)="onShown()"
      (twTooltipHidden)="onHidden()"
    >
      Events
    </button>
  `,
})
class EventTooltipHost {
  onShown = vi.fn();
  onHidden = vi.fn();
}

@Component({
  imports: [TooltipDirective],
  template: `
    <button
      twTooltip="Delay test"
      [twTooltipShowDelay]="500"
      [twTooltipHideDelay]="300"
    >
      Delay
    </button>
  `,
})
class DelayTooltipHost {}

// ── Helpers ──

function getOverlayTooltip(): HTMLElement | null {
  return document.querySelector('tw-tooltip-overlay');
}

function getTooltipPanel(): HTMLElement | null {
  return document.querySelector('tw-tooltip-overlay div');
}

function getTrigger(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button')!;
}

function hoverTrigger(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture);
  button.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
}

function leaveTrigger(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture);
  button.dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
}

function focusTrigger(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture);
  button.dispatchEvent(new FocusEvent('focusin', { bubbles: true }));
}

function blurTrigger(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture);
  button.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
}

function pressEscape(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture);
  button.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
}

// ── Tests ──

describe('TooltipDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    // Clean up any leftover overlays
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  describe('rendering', () => {
    it('should create the directive without errors', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();
      expect(getTrigger(fixture)).toBeTruthy();
    });

    it('should show tooltip on mouseenter after default delay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      expect(getOverlayTooltip()).toBeNull();

      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();
      expect(getOverlayTooltip()!.textContent).toContain('Hello tooltip');
    });

    it('should hide tooltip on mouseleave', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      leaveTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('colors', () => {
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

    for (const color of colors) {
      it(`should render color="${color}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledTooltipHost, OverlayModule],
        }).createComponent(StyledTooltipHost);
        fixture.componentInstance.color = color;
        fixture.detectChanges();

        hoverTrigger(fixture);
        vi.advanceTimersByTime(200);
        fixture.detectChanges();

        const tooltip = getOverlayTooltip();
        expect(tooltip).toBeTruthy();
        expect(tooltip!.getAttribute('role')).toBe('tooltip');
      });
    }
  });

  describe('sizes', () => {
    const sizes: TooltipSize[] = ['sm', 'md', 'lg'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledTooltipHost, OverlayModule],
        }).createComponent(StyledTooltipHost);
        fixture.componentInstance.size = size;
        fixture.detectChanges();

        hoverTrigger(fixture);
        vi.advanceTimersByTime(200);
        fixture.detectChanges();

        expect(getOverlayTooltip()).toBeTruthy();
      });
    }
  });

  describe('positions', () => {
    const positions: TooltipPosition[] = [
      'top',
      'bottom',
      'left',
      'right',
      'top-start',
      'top-end',
      'bottom-start',
      'bottom-end',
    ];

    for (const pos of positions) {
      it(`should render at position="${pos}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledTooltipHost, OverlayModule],
        }).createComponent(StyledTooltipHost);
        fixture.componentInstance.position = pos;
        fixture.detectChanges();

        hoverTrigger(fixture);
        vi.advanceTimersByTime(200);
        fixture.detectChanges();

        expect(getOverlayTooltip()).toBeTruthy();
      });
    }
  });

  describe('delays', () => {
    it('should respect custom show delay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DelayTooltipHost, OverlayModule],
      }).createComponent(DelayTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();

      vi.advanceTimersByTime(300);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();
    });

    it('should respect custom hide delay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DelayTooltipHost, OverlayModule],
      }).createComponent(DelayTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(500);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      leaveTrigger(fixture);
      vi.advanceTimersByTime(100);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('disabled', () => {
    it('should not show tooltip when disabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledTooltipHost, OverlayModule],
      }).createComponent(DisabledTooltipHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(getOverlayTooltip()).toBeNull();
    });

    it('should hide tooltip when disabled changes to true while visible', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledTooltipHost, OverlayModule],
      }).createComponent(DisabledTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('arrow', () => {
    it('should show arrow by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ArrowTooltipHost, OverlayModule],
      }).createComponent(ArrowTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      const tooltip = getOverlayTooltip();
      expect(tooltip).toBeTruthy();
      // Arrow is a div with rotate-45 class inside the panel
      const arrowEl = tooltip!.querySelector('.rotate-45');
      expect(arrowEl).toBeTruthy();
    });

    it('should hide arrow when twTooltipArrow is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ArrowTooltipHost, OverlayModule],
      }).createComponent(ArrowTooltipHost);
      fixture.componentInstance.showArrow = false;
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      const tooltip = getOverlayTooltip();
      expect(tooltip).toBeTruthy();
      expect(tooltip!.querySelector('.rotate-45')).toBeNull();
    });
  });

  describe('template content', () => {
    it('should render TemplateRef content', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TemplateTooltipHost, OverlayModule],
      }).createComponent(TemplateTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      const tooltip = getOverlayTooltip();
      expect(tooltip).toBeTruthy();
      expect(tooltip!.querySelector('strong')).toBeTruthy();
      expect(tooltip!.textContent).toContain('Rich');
      expect(tooltip!.textContent).toContain('content');
    });
  });

  describe('keyboard', () => {
    it('should hide tooltip on Escape key', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      pressEscape(fixture);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('focus', () => {
    it('should show tooltip on focusin', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      focusTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(getOverlayTooltip()).toBeTruthy();
    });

    it('should hide tooltip on focusout', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      focusTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      blurTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should have role="tooltip" on the overlay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      expect(getOverlayTooltip()!.getAttribute('role')).toBe('tooltip');
    });

    it('should set aria-describedby on trigger when tooltip is visible', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      const button = getTrigger(fixture);
      expect(button.hasAttribute('aria-describedby')).toBe(false);

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      const tooltipId = getOverlayTooltip()!.getAttribute('id');
      expect(button.getAttribute('aria-describedby')).toBe(tooltipId);
    });

    it('should remove aria-describedby when tooltip is hidden', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getTrigger(fixture).hasAttribute('aria-describedby')).toBe(true);

      leaveTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getTrigger(fixture).hasAttribute('aria-describedby')).toBe(false);
    });

    it('should have a unique id on the tooltip overlay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();

      const id = getOverlayTooltip()!.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^tw-tooltip-\d+$/);
    });
  });

  describe('outputs', () => {
    it('should emit twTooltipShown when tooltip appears', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventTooltipHost, OverlayModule],
      }).createComponent(EventTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      expect(fixture.componentInstance.onShown).toHaveBeenCalledOnce();
    });

    it('should emit twTooltipHidden when tooltip disappears', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventTooltipHost, OverlayModule],
      }).createComponent(EventTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      leaveTrigger(fixture);
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      expect(fixture.componentInstance.onHidden).toHaveBeenCalledOnce();
    });
  });

  describe('programmatic control', () => {
    it('should show tooltip via show()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ProgrammaticTooltipHost, OverlayModule],
      }).createComponent(ProgrammaticTooltipHost);
      fixture.detectChanges();

      fixture.componentInstance.tip().show();
      vi.advanceTimersByTime(0);
      fixture.detectChanges();

      expect(getOverlayTooltip()).toBeTruthy();
      expect(getOverlayTooltip()!.textContent).toContain('Programmatic');
    });

    it('should hide tooltip via hide()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ProgrammaticTooltipHost, OverlayModule],
      }).createComponent(ProgrammaticTooltipHost);
      fixture.detectChanges();

      fixture.componentInstance.tip().show();
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      fixture.componentInstance.tip().hide();
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });

    it('should toggle tooltip via toggle()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ProgrammaticTooltipHost, OverlayModule],
      }).createComponent(ProgrammaticTooltipHost);
      fixture.detectChanges();

      fixture.componentInstance.tip().toggle();
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      fixture.componentInstance.tip().toggle();
      vi.advanceTimersByTime(0);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeNull();
    });
  });

  describe('cleanup', () => {
    it('should remove tooltip from DOM when directive is destroyed', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicTooltipHost, OverlayModule],
      }).createComponent(BasicTooltipHost);
      fixture.detectChanges();

      hoverTrigger(fixture);
      vi.advanceTimersByTime(200);
      fixture.detectChanges();
      expect(getOverlayTooltip()).toBeTruthy();

      fixture.destroy();
      expect(getOverlayTooltip()).toBeNull();
    });
  });
});
