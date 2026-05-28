import { Component, inject, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import { PopoverDirective, type PopoverPosition } from './popover';
import { PopoverCloseDirective } from './popover-close';
import { PopoverTitleDirective } from './popover-title';
import { POPOVER_DATA, POPOVER_REF } from './popover-tokens';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Test host components ──

@Component({
  imports: [PopoverDirective],
  template: `
    <button [twPopover]="content">Open</button>
    <ng-template #content>
      <p>Popover body</p>
    </ng-template>
  `,
})
class BasicPopoverHost {}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      [twPopoverSize]="size"
      [twPopoverPosition]="position"
      [twPopoverColor]="color"
    >
      Styled
    </button>
    <ng-template #content><p>Styled content</p></ng-template>
  `,
})
class StyledPopoverHost {
  size: TwSize = 'md';
  position: PopoverPosition = 'bottom';
  color: TwColor | undefined = undefined;
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      [twPopoverDisabled]="disabled()"
    >
      Disabled
    </button>
    <ng-template #content><p>Disabled content</p></ng-template>
  `,
})
class DisabledPopoverHost {
  readonly disabled = signal(false);
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      [(twPopoverOpen)]="isOpen"
    >
      Model
    </button>
    <ng-template #content><p>Model content</p></ng-template>
  `,
})
class ModelPopoverHost {
  isOpen = signal(false);
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      [twPopoverData]="userData"
    >
      Data
    </button>
    <ng-template #content let-data let-close="close">
      <p class="data-name">{{ data.name }}</p>
      <button class="close-btn" (click)="close()">Close</button>
    </ng-template>
  `,
})
class DataPopoverHost {
  userData = { name: 'Alice' };
}

@Component({
  imports: [PopoverDirective, PopoverCloseDirective],
  template: `
    <button [twPopover]="content">Open</button>
    <ng-template #content>
      <p>Content</p>
      <button twPopoverClose class="close-directive-btn">Cancel</button>
    </ng-template>
  `,
})
class CloseDirectivePopoverHost {}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      #pop="twPopover"
      (twPopoverOpened)="onOpened()"
      (twPopoverClosed)="onClosed()"
    >
      Events
    </button>
    <ng-template #content><p>Event content</p></ng-template>
  `,
})
class EventPopoverHost {
  readonly pop = viewChild.required<PopoverDirective>('pop');
  onOpened = vi.fn();
  onClosed = vi.fn();
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      [twPopoverArrow]="showArrow"
    >
      Arrow
    </button>
    <ng-template #content><p>Arrow content</p></ng-template>
  `,
})
class ArrowPopoverHost {
  showArrow = true;
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      twPopoverTriggerOn="focus"
    >
      Focus
    </button>
    <ng-template #content><p>Focus content</p></ng-template>
  `,
})
class FocusTriggerPopoverHost {}

@Component({
  imports: [PopoverDirective],
  template: `
    <button [twPopover]="CompContent" [twPopoverData]="42">Component</button>
  `,
})
class ComponentContentPopoverHost {
  CompContent = PopoverContentComponent;
}

@Component({
  template: `<p class="injected-data">{{ data }}</p>`,
})
class PopoverContentComponent {
  readonly data = inject(POPOVER_DATA);
  readonly popoverRef = inject(POPOVER_REF);
}

@Component({
  imports: [PopoverDirective],
  template: `
    <button
      [twPopover]="content"
      twPopoverBackdrop="none"
      [twPopoverCloseOnEscape]="false"
    >
      No close
    </button>
    <ng-template #content><p>Persistent</p></ng-template>
  `,
})
class NoClosePopoverHost {}

@Component({
  imports: [PopoverDirective, PopoverTitleDirective],
  template: `
    <button [twPopover]="content">Open</button>
    <ng-template #content>
      <h3 twPopoverTitle id="settings-title">Settings</h3>
      <p>Body</p>
    </ng-template>
  `,
})
class TitlePopoverHost {}

@Component({
  imports: [PopoverDirective, PopoverTitleDirective],
  template: `
    <button
      [twPopover]="content"
      twPopoverAriaLabel="Explicit label"
    >Open</button>
    <ng-template #content>
      <h3 twPopoverTitle id="overridden">Heading</h3>
    </ng-template>
  `,
})
class AriaLabelOverridePopoverHost {}

@Component({
  imports: [PopoverDirective],
  template: `
    <button id="other-target">Other</button>
    <button id="trigger" [twPopover]="content" #pop="twPopover">Open</button>
    <ng-template #content><p>Body</p></ng-template>
  `,
})
class FocusElsewherePopoverHost {
  readonly pop = viewChild.required<PopoverDirective>('pop');
}

// ── Constants ──

const CLOSE_ANIMATION_MS = 150;

// ── Helpers ──

function getOverlayPopover(): HTMLElement | null {
  return document.querySelector('tw-popover-overlay');
}

function getTrigger(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('button')!;
}

function clickTrigger(fixture: ComponentFixture<unknown>): void {
  getTrigger(fixture).dispatchEvent(new MouseEvent('click', { bubbles: true }));
}

function focusTrigger(fixture: ComponentFixture<unknown>): void {
  getTrigger(fixture).dispatchEvent(new FocusEvent('focus', { bubbles: true }));
}

function pressEscapeOn(el: HTMLElement): void {
  el.dispatchEvent(
    new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
  );
}

function clickBackdrop(): void {
  const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement | null;
  backdrop?.click();
}

/** Advance timers past the close animation and trigger change detection. */
function flushClose(fixture: ComponentFixture<unknown>): void {
  vi.advanceTimersByTime(CLOSE_ANIMATION_MS);
  fixture.detectChanges();
}

// ── Tests ──

describe('PopoverDirective', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document
      .querySelectorAll('.cdk-overlay-container')
      .forEach((el) => (el.innerHTML = ''));
  });

  describe('rendering', () => {
    it('should create the directive without errors', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();
      expect(getTrigger(fixture)).toBeTruthy();
    });

    it('should show popover on click', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const popover = getOverlayPopover();
      expect(popover).toBeTruthy();
      expect(popover!.textContent).toContain('Popover body');
    });

    it('should hide popover on second click (toggle)', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      clickTrigger(fixture);
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledPopoverHost, OverlayModule],
        }).createComponent(StyledPopoverHost);
        fixture.componentInstance.size = size;
        fixture.detectChanges();

        clickTrigger(fixture);
        fixture.detectChanges();

        expect(getOverlayPopover()).toBeTruthy();
      });
    }
  });

  describe('positions', () => {
    const positions: PopoverPosition[] = [
      'top', 'bottom', 'left', 'right',
      'top-start', 'top-end', 'bottom-start', 'bottom-end',
    ];

    for (const pos of positions) {
      it(`should render at position="${pos}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledPopoverHost, OverlayModule],
        }).createComponent(StyledPopoverHost);
        fixture.componentInstance.position = pos;
        fixture.detectChanges();

        clickTrigger(fixture);
        fixture.detectChanges();

        expect(getOverlayPopover()).toBeTruthy();
      });
    }
  });

  describe('color accent', () => {
    it('should not have accent border by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [StyledPopoverHost, OverlayModule],
      }).createComponent(StyledPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const popover = getOverlayPopover();
      expect(popover).toBeTruthy();
      const panel = popover!.querySelector(':scope > div > div');
      expect(panel?.className).not.toContain('border-t-2');
    });

    it('should add accent border when color is set', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [StyledPopoverHost, OverlayModule],
      }).createComponent(StyledPopoverHost);
      fixture.componentInstance.color = 'warning';
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const popover = getOverlayPopover();
      expect(popover).toBeTruthy();
      const panel = popover!.querySelector(':scope > div > div');
      expect(panel?.className).toContain('border-t-2');
      expect(panel?.className).toContain('border-t-warning-500');
    });
  });

  describe('disabled', () => {
    it('should not show popover when disabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledPopoverHost, OverlayModule],
      }).createComponent(DisabledPopoverHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()).toBeNull();
    });

    it('should close popover when disabled changes to true while open', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledPopoverHost, OverlayModule],
      }).createComponent(DisabledPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('model binding', () => {
    it('should open popover when model is set to true', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ModelPopoverHost, OverlayModule],
      }).createComponent(ModelPopoverHost);
      fixture.detectChanges();

      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();

      expect(getOverlayPopover()).toBeTruthy();
    });

    it('should set model to false when popover closes', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ModelPopoverHost, OverlayModule],
      }).createComponent(ModelPopoverHost);
      fixture.detectChanges();

      fixture.componentInstance.isOpen.set(true);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      clickBackdrop();
      fixture.detectChanges();
      flushClose(fixture);

      expect(fixture.componentInstance.isOpen()).toBe(false);
    });
  });

  describe('template context', () => {
    it('should pass data to template via $implicit', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataPopoverHost, OverlayModule],
      }).createComponent(DataPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const nameEl = document.querySelector('.data-name');
      expect(nameEl).toBeTruthy();
      expect(nameEl!.textContent).toContain('Alice');
    });

    it('should provide close function in template context', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataPopoverHost, OverlayModule],
      }).createComponent(DataPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      const closeBtn = document.querySelector('.close-btn') as HTMLElement;
      closeBtn.click();
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('PopoverCloseDirective', () => {
    it('should close popover when clicked', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseDirectivePopoverHost, OverlayModule],
      }).createComponent(CloseDirectivePopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      const closeBtn = document.querySelector('.close-directive-btn') as HTMLElement;
      closeBtn.click();
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('component content', () => {
    it('should render component content with injected data', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ComponentContentPopoverHost, OverlayModule],
      }).createComponent(ComponentContentPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const dataEl = document.querySelector('.injected-data');
      expect(dataEl).toBeTruthy();
      expect(dataEl!.textContent).toContain('42');
    });
  });

  describe('arrow', () => {
    it('should show arrow by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ArrowPopoverHost, OverlayModule],
      }).createComponent(ArrowPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const popover = getOverlayPopover();
      expect(popover).toBeTruthy();
      expect(popover!.querySelector('.rotate-45')).toBeTruthy();
    });

    it('should hide arrow when twPopoverArrow is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ArrowPopoverHost, OverlayModule],
      }).createComponent(ArrowPopoverHost);
      fixture.componentInstance.showArrow = false;
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const popover = getOverlayPopover();
      expect(popover).toBeTruthy();
      expect(popover!.querySelector('.rotate-45')).toBeNull();
    });
  });

  describe('trigger modes', () => {
    it('should open on focus when triggerOn is "focus"', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [FocusTriggerPopoverHost, OverlayModule],
      }).createComponent(FocusTriggerPopoverHost);
      fixture.detectChanges();

      focusTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()).toBeTruthy();
    });

    it('should not open on click when triggerOn is "focus"', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [FocusTriggerPopoverHost, OverlayModule],
      }).createComponent(FocusTriggerPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('keyboard', () => {
    it('should close popover on Escape key from trigger', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      pressEscapeOn(getTrigger(fixture));
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });

    it('should not close on Escape when closeOnEscape is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [NoClosePopoverHost, OverlayModule],
      }).createComponent(NoClosePopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      pressEscapeOn(getTrigger(fixture));
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeTruthy();
    });
  });

  describe('backdrop', () => {
    it('should close on backdrop click with transparent backdrop', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      clickBackdrop();
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });

    it('should return focus to trigger on backdrop click', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      clickBackdrop();
      fixture.detectChanges();

      // Focus returns immediately (before animation completes)
      expect(document.activeElement).toBe(getTrigger(fixture));
    });
  });

  describe('accessibility', () => {
    it('should set aria-haspopup="dialog" on trigger', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-haspopup')).toBe('dialog');
    });

    it('should set aria-expanded on trigger', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-expanded')).toBe('false');

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('should have role="dialog" on the overlay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()!.getAttribute('role')).toBe('dialog');
    });

    it('should have a unique id on the overlay', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const id = getOverlayPopover()!.getAttribute('id');
      expect(id).toBeTruthy();
      expect(id).toMatch(/^tw-popover-\d+$/);
    });

    it('should set aria-controls to overlay id when open', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      expect(getTrigger(fixture).getAttribute('aria-controls')).toBeNull();

      clickTrigger(fixture);
      fixture.detectChanges();

      const overlayId = getOverlayPopover()!.getAttribute('id');
      expect(getTrigger(fixture).getAttribute('aria-controls')).toBe(overlayId);
    });

    it('should set aria-modal="true" when focus is trapped (default)', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()!.getAttribute('aria-modal')).toBe('true');
    });

    it('should not set aria-modal when twPopoverTrapFocus=false', () => {
      @Component({
        imports: [PopoverDirective],
        template: `
          <button [twPopover]="content" [twPopoverTrapFocus]="false">Open</button>
          <ng-template #content><p>Body</p></ng-template>
        `,
      })
      class NoTrapHost {}

      const fixture = TestBed.configureTestingModule({
        imports: [NoTrapHost, OverlayModule],
      }).createComponent(NoTrapHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(getOverlayPopover()!.hasAttribute('aria-modal')).toBe(false);
    });

    it('should expose aria-labelledby for projected PopoverTitleDirective', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [TitlePopoverHost, OverlayModule],
      }).createComponent(TitlePopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const heading = document.getElementById('settings-title');
      expect(heading).toBeTruthy();
      expect(getOverlayPopover()!.getAttribute('aria-labelledby')).toBe(
        'settings-title',
      );
    });

    it('should prefer twPopoverAriaLabel over labelledby queue', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [AriaLabelOverridePopoverHost, OverlayModule],
      }).createComponent(AriaLabelOverridePopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      const overlay = getOverlayPopover()!;
      expect(overlay.getAttribute('aria-label')).toBe('Explicit label');
      expect(overlay.getAttribute('aria-labelledby')).toBeNull();
    });
  });

  describe('outputs', () => {
    it('should emit twPopoverOpened when popover appears', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventPopoverHost, OverlayModule],
      }).createComponent(EventPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      expect(fixture.componentInstance.onOpened).toHaveBeenCalledOnce();
    });

    it('should emit twPopoverClosed after close animation', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventPopoverHost, OverlayModule],
      }).createComponent(EventPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      clickBackdrop();
      fixture.detectChanges();

      // Not emitted yet during animation window
      expect(fixture.componentInstance.onClosed).not.toHaveBeenCalled();

      flushClose(fixture);
      expect(fixture.componentInstance.onClosed).toHaveBeenCalledOnce();
    });
  });

  describe('programmatic control', () => {
    it('should open via open()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventPopoverHost, OverlayModule],
      }).createComponent(EventPopoverHost);
      fixture.detectChanges();

      fixture.componentInstance.pop().open();
      fixture.detectChanges();

      expect(getOverlayPopover()).toBeTruthy();
    });

    it('should close via close()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventPopoverHost, OverlayModule],
      }).createComponent(EventPopoverHost);
      fixture.detectChanges();

      fixture.componentInstance.pop().open();
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      fixture.componentInstance.pop().close();
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });

    it('should toggle via toggle()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventPopoverHost, OverlayModule],
      }).createComponent(EventPopoverHost);
      fixture.detectChanges();

      fixture.componentInstance.pop().toggle();
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      fixture.componentInstance.pop().toggle();
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();
    });
  });

  describe('overlay reuse', () => {
    it('should reuse the same overlay across open/close cycles', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      // First open
      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();
      const panelsBefore = document.querySelectorAll('.tw-popover-panel').length;

      // Close
      clickTrigger(fixture);
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlayPopover()).toBeNull();

      // Second open — should reuse overlay, not create new one
      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();
      const panelsAfter = document.querySelectorAll('.tw-popover-panel').length;

      expect(panelsAfter).toBe(panelsBefore);
    });
  });

  describe('focus management', () => {
    it('should return focus to trigger on Escape', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();

      pressEscapeOn(getTrigger(fixture));
      fixture.detectChanges();

      expect(document.activeElement).toBe(getTrigger(fixture));
    });

    it('should not return focus when consumer has moved focus to another element', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [FocusElsewherePopoverHost, OverlayModule],
      }).createComponent(FocusElsewherePopoverHost);
      fixture.detectChanges();

      const trigger = fixture.nativeElement.querySelector('#trigger') as HTMLButtonElement;
      const other = fixture.nativeElement.querySelector('#other-target') as HTMLButtonElement;

      trigger.click();
      fixture.detectChanges();

      // Move focus to another element BEFORE closing.
      other.focus();
      expect(document.activeElement).toBe(other);

      fixture.componentInstance.pop().close();
      fixture.detectChanges();
      flushClose(fixture);

      // Focus must remain on the consumer's chosen element, not bounce back.
      expect(document.activeElement).toBe(other);
    });
  });

  describe('cleanup', () => {
    it('should remove popover from DOM when directive is destroyed', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPopoverHost, OverlayModule],
      }).createComponent(BasicPopoverHost);
      fixture.detectChanges();

      clickTrigger(fixture);
      fixture.detectChanges();
      expect(getOverlayPopover()).toBeTruthy();

      fixture.destroy();
      expect(getOverlayPopover()).toBeNull();
    });
  });
});
