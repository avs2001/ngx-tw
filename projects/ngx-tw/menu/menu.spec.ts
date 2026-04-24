import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  MenuComponent,
  MenuTriggerDirective,
  ContextMenuTriggerDirective,
  MenuItemDirective,
  MenuItemCheckboxComponent,
  MenuItemRadioComponent,
  MenuGroupDirective,
  MenuItemIconDirective,
  MenuItemDescriptionDirective,
  MenuItemShortcutDirective,
  MenuItemSubmenuIndicatorDirective,
} from './menu';
import type { TwColor, TwSize } from 'ngx-tw/core';

// ── Test host components ──

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button">Profile</button>
        <button twMenuItem type="button">Settings</button>
      </tw-menu>
    </ng-template>
  `,
})
class BasicMenuHost {}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu [size]="size">
        <button twMenuItem type="button" [color]="color">Item</button>
      </tw-menu>
    </ng-template>
  `,
})
class StyledMenuHost {
  size: TwSize = 'md';
  color: 'default' | TwColor = 'default';
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button" [disabled]="disabled()" (triggered)="onTriggered()">
          Action
        </button>
      </tw-menu>
    </ng-template>
  `,
})
class DisabledMenuHost {
  readonly disabled = signal(false);
  onTriggered = vi.fn();
}

@Component({
  imports: [
    MenuComponent,
    MenuTriggerDirective,
    MenuItemDirective,
    MenuItemIconDirective,
    MenuItemDescriptionDirective,
    MenuItemShortcutDirective,
    MenuItemSubmenuIndicatorDirective,
  ],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button">
          <span twMenuItemIcon class="icon">★</span>
          <span>Label</span>
          <span twMenuItemDescription class="description">Secondary text</span>
          <span twMenuItemShortcut class="shortcut">⌘K</span>
          <span twMenuItemSubmenuIcon class="submenu-icon">›</span>
        </button>
      </tw-menu>
    </ng-template>
  `,
})
class ContentMenuHost {}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemCheckboxComponent],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItemCheckbox type="button" [checked]="isChecked()">Bold</button>
      </tw-menu>
    </ng-template>
  `,
})
class CheckboxMenuHost {
  readonly isChecked = signal(false);
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemRadioComponent, MenuGroupDirective],
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <div twMenuGroup>
          <button twMenuItemRadio type="button" [checked]="selected() === 'left'">Left</button>
          <button twMenuItemRadio type="button" [checked]="selected() === 'right'">Right</button>
        </div>
      </tw-menu>
    </ng-template>
  `,
})
class RadioMenuHost {
  readonly selected = signal<'left' | 'right'>('left');
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  template: `
    <button
      [twMenuTrigger]="menu"
      type="button"
      (opened)="onOpened()"
      (closed)="onClosed()"
    >
      Open
    </button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button">Item</button>
      </tw-menu>
    </ng-template>
  `,
})
class EventMenuHost {
  onOpened = vi.fn();
  onClosed = vi.fn();
}

@Component({
  imports: [ContextMenuTriggerDirective, MenuComponent, MenuItemDirective],
  template: `
    <div [twContextMenuTrigger]="menu" [disabled]="disabled()" class="context-target">
      Right-click here
    </div>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button">Copy</button>
      </tw-menu>
    </ng-template>
  `,
})
class ContextMenuHost {
  readonly disabled = signal(false);
}

// ── Helpers ──

function getTrigger(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('button, div.context-target')!;
}

function getMenuPanel(): HTMLElement | null {
  return document.querySelector('tw-menu');
}

function queryItems(selector = '[twMenuItem]'): HTMLElement[] {
  return Array.from(document.querySelectorAll(selector));
}

function openMenu(fixture: ComponentFixture<unknown>): void {
  const button = getTrigger(fixture) as HTMLButtonElement;
  button.click();
  fixture.detectChanges();
}

function openContextMenu(fixture: ComponentFixture<unknown>, x = 10, y = 10): void {
  const target = getTrigger(fixture);
  target.dispatchEvent(
    new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
  );
  fixture.detectChanges();
}

function cleanupOverlays(): void {
  document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
}

// ── Tests ──

describe('Menu', () => {
  afterEach(() => {
    cleanupOverlays();
  });

  describe('rendering', () => {
    it('should create the trigger without errors', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();
      expect(getTrigger(fixture)).toBeTruthy();
      expect(getMenuPanel()).toBeNull();
    });

    it('should open the menu on trigger click', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();

      openMenu(fixture);

      const panel = getMenuPanel();
      expect(panel).toBeTruthy();
      expect(panel!.getAttribute('role')).toBe('menu');
      expect(queryItems().length).toBe(2);
    });
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

    for (const size of sizes) {
      it(`should render size="${size}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [StyledMenuHost, OverlayModule],
        }).createComponent(StyledMenuHost);
        fixture.componentInstance.size = size;
        fixture.detectChanges();

        openMenu(fixture);
        expect(getMenuPanel()).toBeTruthy();
      });
    }
  });

  describe('item colors', () => {
    const colors: ('default' | TwColor)[] = [
      'default',
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
          imports: [StyledMenuHost, OverlayModule],
        }).createComponent(StyledMenuHost);
        fixture.componentInstance.color = color;
        fixture.detectChanges();

        openMenu(fixture);
        expect(queryItems().length).toBe(1);
      });
    }
  });

  describe('disabled item', () => {
    it('should not emit triggered when item is disabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledMenuHost, OverlayModule],
      }).createComponent(DisabledMenuHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      openMenu(fixture);
      const item = queryItems()[0] as HTMLButtonElement;
      item.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.onTriggered).not.toHaveBeenCalled();
    });

    it('should emit triggered when item is enabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledMenuHost, OverlayModule],
      }).createComponent(DisabledMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = queryItems()[0] as HTMLButtonElement;
      item.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.onTriggered).toHaveBeenCalledOnce();
    });
  });

  describe('content directives', () => {
    it('should render projected icon, description, shortcut, and submenu indicator', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ContentMenuHost, OverlayModule],
      }).createComponent(ContentMenuHost);
      fixture.detectChanges();

      openMenu(fixture);

      expect(document.querySelector('.icon')).toBeTruthy();
      expect(document.querySelector('.description')).toBeTruthy();
      expect(document.querySelector('.shortcut')).toBeTruthy();
      expect(document.querySelector('.submenu-icon')).toBeTruthy();
    });
  });

  describe('checkbox item', () => {
    it('should render with role="menuitemcheckbox"', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckboxMenuHost, OverlayModule],
      }).createComponent(CheckboxMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = document.querySelector('[twMenuItemCheckbox]');
      expect(item).toBeTruthy();
      expect(item!.getAttribute('role')).toBe('menuitemcheckbox');
    });

    it('should reflect checked state via aria-checked', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckboxMenuHost, OverlayModule],
      }).createComponent(CheckboxMenuHost);
      fixture.componentInstance.isChecked.set(true);
      fixture.detectChanges();

      openMenu(fixture);
      const item = document.querySelector('[twMenuItemCheckbox]');
      expect(item!.getAttribute('aria-checked')).toBe('true');
    });

    it('should not render indicator when unchecked', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckboxMenuHost, OverlayModule],
      }).createComponent(CheckboxMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = document.querySelector('[twMenuItemCheckbox]');
      expect(item!.querySelector('svg')).toBeNull();
    });

    it('should render indicator when checked', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckboxMenuHost, OverlayModule],
      }).createComponent(CheckboxMenuHost);
      fixture.componentInstance.isChecked.set(true);
      fixture.detectChanges();

      openMenu(fixture);
      const item = document.querySelector('[twMenuItemCheckbox]');
      expect(item!.querySelector('svg')).toBeTruthy();
    });
  });

  describe('radio item', () => {
    it('should render with role="menuitemradio"', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [RadioMenuHost, OverlayModule],
      }).createComponent(RadioMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const items = document.querySelectorAll('[twMenuItemRadio]');
      expect(items.length).toBe(2);
      for (const item of Array.from(items)) {
        expect(item.getAttribute('role')).toBe('menuitemradio');
      }
    });

    it('should reflect the selected radio via aria-checked', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [RadioMenuHost, OverlayModule],
      }).createComponent(RadioMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const items = Array.from(document.querySelectorAll('[twMenuItemRadio]'));
      expect(items[0].getAttribute('aria-checked')).toBe('true');
      expect(items[1].getAttribute('aria-checked')).toBe('false');
    });

    it('should render group with role="group"', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [RadioMenuHost, OverlayModule],
      }).createComponent(RadioMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(document.querySelector('[twMenuGroup]')!.getAttribute('role')).toBe('group');
    });
  });

  describe('trigger outputs', () => {
    it('should emit opened when the menu opens', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventMenuHost, OverlayModule],
      }).createComponent(EventMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(fixture.componentInstance.onOpened).toHaveBeenCalledOnce();
    });

    it('should emit closed when the menu closes', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EventMenuHost, OverlayModule],
      }).createComponent(EventMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      // Re-click the trigger to toggle closed.
      openMenu(fixture);
      expect(fixture.componentInstance.onClosed).toHaveBeenCalled();
    });
  });

  describe('context menu trigger', () => {
    it('should open on contextmenu event', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ContextMenuHost, OverlayModule],
      }).createComponent(ContextMenuHost);
      fixture.detectChanges();

      openContextMenu(fixture);
      expect(getMenuPanel()).toBeTruthy();
    });

    it('should not open when disabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ContextMenuHost, OverlayModule],
      }).createComponent(ContextMenuHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      openContextMenu(fixture);
      expect(getMenuPanel()).toBeNull();
    });
  });

  describe('accessibility', () => {
    it('should set role="menu" on the panel', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(getMenuPanel()!.getAttribute('role')).toBe('menu');
    });

    it('should set role="menuitem" on action items', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      for (const item of queryItems()) {
        expect(item.getAttribute('role')).toBe('menuitem');
      }
    });
  });
});
