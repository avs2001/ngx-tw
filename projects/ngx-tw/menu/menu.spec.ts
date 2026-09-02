import { Component, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
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
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Test host components ──

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
  color: TwColor | undefined = undefined;
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective, MenuItemSubmenuIndicatorDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu [size]="size">
        <button twMenuItem type="button">
          <span>Submenu parent</span>
          <span twMenuItemSubmenuIcon class="submenu-icon-sized">›</span>
        </button>
      </tw-menu>
    </ng-template>
  `,
})
class SubmenuIndicatorSizedHost {
  size: TwSize = 'md';
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemCheckboxComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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
  changeDetection: ChangeDetectionStrategy.Eager,
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

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button twMenuItem type="button">Apple</button>
        <button twMenuItem type="button">Banana</button>
        <button twMenuItem type="button">Strawberry</button>
        <button twMenuItem type="button">Mango</button>
      </tw-menu>
    </ng-template>
  `,
})
class KeyboardMenuHost {}

@Component({
  imports: [MenuComponent, MenuTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu aria-label="Edit options" />
    </ng-template>
  `,
})
class LabelledMenuHost {}

@Component({
  imports: [MenuComponent, MenuTriggerDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <h3 id="menu-heading">File actions</h3>
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu aria-labelledby="menu-heading" />
    </ng-template>
  `,
})
class LabelledByMenuHost {}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemCheckboxComponent],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <button
          twMenuItemCheckbox
          type="button"
          [checked]="isChecked()"
          (checkedChange)="lastChange.set($event)"
        >Bold</button>
      </tw-menu>
    </ng-template>
  `,
})
class CheckedChangeCheckboxHost {
  readonly isChecked = signal(false);
  readonly lastChange = signal<boolean | null>(null);
}

@Component({
  imports: [MenuComponent, MenuTriggerDirective, MenuItemRadioComponent, MenuGroupDirective],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <button [twMenuTrigger]="menu" type="button">Open</button>
    <ng-template #menu>
      <tw-menu>
        <div twMenuGroup>
          <button
            twMenuItemRadio
            type="button"
            [checked]="selected() === 'left'"
            (checkedChange)="lastChange.set($event)"
          >Left</button>
          <button
            twMenuItemRadio
            type="button"
            [checked]="selected() === 'right'"
            (checkedChange)="lastChange.set($event)"
          >Right</button>
        </div>
      </tw-menu>
    </ng-template>
  `,
})
class CheckedChangeRadioHost {
  readonly selected = signal<'left' | 'right'>('left');
  readonly lastChange = signal<boolean | null>(null);
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

const KEY_CODES: Record<string, number> = {
  ArrowDown: 40,
  ArrowUp: 38,
  Home: 36,
  End: 35,
  Escape: 27,
  Enter: 13,
  Space: 32,
};

function dispatchKey(target: Element, key: string): void {
  // CDK's menu key handler reads `event.keyCode` (and FocusKeyManager type-aheads
  // read `event.key`); supply both so the keyboard path triggers in jsdom.
  const keyCode = KEY_CODES[key] ?? key.toUpperCase().charCodeAt(0);
  target.dispatchEvent(
    new KeyboardEvent('keydown', { key, code: key, keyCode, bubbles: true, cancelable: true }),
  );
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
    const colors: (TwColor | undefined)[] = [
      undefined,
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
      it(`should render color="${color ?? 'undefined'}" without errors`, () => {
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

    it('should expose aria-label on the panel when provided', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [LabelledMenuHost, OverlayModule],
      }).createComponent(LabelledMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(getMenuPanel()!.getAttribute('aria-label')).toBe('Edit options');
    });

    it('should expose aria-labelledby on the panel when provided', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [LabelledByMenuHost, OverlayModule],
      }).createComponent(LabelledByMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(getMenuPanel()!.getAttribute('aria-labelledby')).toBe('menu-heading');
      expect(getMenuPanel()!.getAttribute('aria-label')).toBeNull();
    });

    it('should leave both aria-label and aria-labelledby unset by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(getMenuPanel()!.getAttribute('aria-label')).toBeNull();
      expect(getMenuPanel()!.getAttribute('aria-labelledby')).toBeNull();
    });
  });

  describe('keyboard navigation', () => {
    it('should advance focus to the next item on ArrowDown', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const panel = getMenuPanel()!;
      // CDK opens the menu with the first item already active; ArrowDown moves to the next.
      dispatchKey(panel, 'ArrowDown');
      fixture.detectChanges();

      const items = queryItems();
      expect(document.activeElement).toBe(items[1]);
    });

    it('should retreat focus to the previous item on ArrowUp', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const panel = getMenuPanel()!;
      dispatchKey(panel, 'ArrowDown');
      fixture.detectChanges();
      dispatchKey(panel, 'ArrowUp');
      fixture.detectChanges();

      const items = queryItems();
      expect(document.activeElement).toBe(items[0]);
    });

    it('should move focus to the last item on End', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const panel = getMenuPanel()!;
      dispatchKey(panel, 'End');
      fixture.detectChanges();

      const items = queryItems();
      expect(document.activeElement).toBe(items[items.length - 1]);
    });

    it('should move focus to the first item on Home', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const panel = getMenuPanel()!;
      // Jump to the end first so Home actually moves focus.
      dispatchKey(panel, 'End');
      fixture.detectChanges();
      dispatchKey(panel, 'Home');
      fixture.detectChanges();

      const items = queryItems();
      expect(document.activeElement).toBe(items[0]);
    });

    it('should close the menu on Escape', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      expect(getMenuPanel()).toBeTruthy();

      const panel = getMenuPanel()!;
      dispatchKey(panel, 'Escape');
      fixture.detectChanges();

      expect(getMenuPanel()).toBeNull();
    });

    it('should type-ahead to the first item starting with the typed letter', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [KeyboardMenuHost, OverlayModule],
      }).createComponent(KeyboardMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const panel = getMenuPanel()!;
      dispatchKey(panel, 's');
      // CDK's typeahead debounce is 200ms — wait it out then flush change detection.
      await new Promise((resolve) => setTimeout(resolve, 250));
      fixture.detectChanges();

      const items = queryItems();
      // "Strawberry" is items[2]
      expect(document.activeElement).toBe(items[2]);
    });
  });

  describe('focus-style carve-out', () => {
    it('should style items with the menu-item focus carve-out (no outline ring)', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicMenuHost, OverlayModule],
      }).createComponent(BasicMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = queryItems()[0];
      const className = item.className;
      // Per CLAUDE.md menu-item carve-out: items use focus-visible:bg-surface-muted
      // INSTEAD of the canonical outline ring.
      expect(className).toMatch(/focus-visible:bg-surface-muted/);
      expect(className).not.toMatch(/focus-visible:outline-2/);
    });
  });

  describe('checkedChange output', () => {
    it('should emit the new checked value when a checkbox item is activated', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckedChangeCheckboxHost, OverlayModule],
      }).createComponent(CheckedChangeCheckboxHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = document.querySelector('[twMenuItemCheckbox]') as HTMLButtonElement;
      item.click();
      fixture.detectChanges();

      // CDK toggles `checked` on trigger; checkedChange should reflect the new value.
      expect(fixture.componentInstance.lastChange()).toBe(true);
    });

    it('should emit the new checked value when a radio item is activated', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CheckedChangeRadioHost, OverlayModule],
      }).createComponent(CheckedChangeRadioHost);
      fixture.detectChanges();

      openMenu(fixture);
      const items = Array.from(document.querySelectorAll('[twMenuItemRadio]')) as HTMLButtonElement[];
      // Click the unselected "Right" radio.
      items[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.lastChange()).toBe(true);
    });
  });

  describe('disabled propagation to CDK', () => {
    it('should disable the underlying CDK menu item when [disabled] toggles', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledMenuHost, OverlayModule],
      }).createComponent(DisabledMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const item = queryItems()[0] as HTMLButtonElement;
      item.click();
      fixture.detectChanges();
      expect(fixture.componentInstance.onTriggered).toHaveBeenCalledOnce();

      // Toggle disabled at runtime; the local signal must propagate to CDK's behavior.
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      item.click();
      fixture.detectChanges();

      // Still one call — the disabled toggle blocked the second activation.
      expect(fixture.componentInstance.onTriggered).toHaveBeenCalledOnce();
    });

    it('should layer `cursor-not-allowed` onto disabled items', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DisabledMenuHost, OverlayModule],
      }).createComponent(DisabledMenuHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();

      openMenu(fixture);
      const item = queryItems()[0];
      // The disabled variant carries `cursor-not-allowed` so a programmatically-focused
      // disabled item still communicates its state alongside `pointer-events-none`.
      expect(item.className).toMatch(/cursor-not-allowed/);
      expect(item.className).toMatch(/pointer-events-none/);
      expect(item.className).toMatch(/opacity-50/);
    });
  });

  describe('submenu indicator scaling', () => {
    it('should scale the trailing submenu indicator with menu size', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [ContentMenuHost, OverlayModule],
      }).createComponent(ContentMenuHost);
      fixture.detectChanges();

      openMenu(fixture);
      const indicator = document.querySelector('.submenu-icon');
      expect(indicator).toBeTruthy();
      // Default size is `md` → `size-5` per CLAUDE.md's glyph sub-scale
      // (3/4/5/6/8). Was `size-4` while menu shipped a flatter 3/4/4/5/5 ramp.
      expect(indicator!.className).toMatch(/size-5/);
    });

    it('should render `size-3` for xs-density menus', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [SubmenuIndicatorSizedHost, OverlayModule],
      }).createComponent(SubmenuIndicatorSizedHost);
      fixture.componentInstance.size = 'xs';
      fixture.detectChanges();

      openMenu(fixture);
      const indicator = document.querySelector('.submenu-icon-sized');
      expect(indicator).toBeTruthy();
      expect(indicator!.className).toMatch(/size-3(?!\.)/);
    });

    it('should render `size-6` for xl-density menus', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [SubmenuIndicatorSizedHost, OverlayModule],
      }).createComponent(SubmenuIndicatorSizedHost);
      fixture.componentInstance.size = 'xl';
      fixture.detectChanges();

      openMenu(fixture);
      const indicator = document.querySelector('.submenu-icon-sized');
      expect(indicator).toBeTruthy();
      expect(indicator!.className).toMatch(/size-6/);
    });

    // The scale renders 3 / 4 / 5 / 6 / 6 — four distinct values across five
    // steps. Before the glyph-scale correction it was 4/4/4/5/5, collapsing
    // xs/sm/md onto one value: three dead steps, which is the defect this
    // guards against.
    //
    // `xl` reusing `lg`'s 24px is deliberate, not a surviving dead step. A
    // 32px glyph plus `py-2.5` measures 52px against menu's `min-h-12` (48px)
    // floor, so the floor would stop binding for glyph-bearing rows only and
    // an xl menu would render ragged 52/48px rows. See the justification on
    // `menuItemIconVariants`. Assert 4, and if a future change raises the row
    // floor so a 32px glyph fits, raise this to 5 in the same commit.
    it('renders a distinct submenu-indicator size for every step', () => {
      const seen = new Set<string>();
      for (const size of ['xs', 'sm', 'md', 'lg', 'xl'] as const) {
        const fixture = TestBed.configureTestingModule({
          imports: [SubmenuIndicatorSizedHost, OverlayModule],
        }).createComponent(SubmenuIndicatorSizedHost);
        fixture.componentInstance.size = size;
        fixture.detectChanges();
        openMenu(fixture);
        const indicator = document.querySelector('.submenu-icon-sized');
        // Anchored so a future half-step (`size-3.5`) cannot register as a
        // partial match on `size-3`.
        const match = /(^|\s)(size-[\d.]+)(\s|$)/.exec(indicator!.className);
        expect(match).toBeTruthy();
        seen.add(match![2]);
        document.querySelectorAll('.cdk-overlay-container').forEach((el) => {
          el.innerHTML = '';
        });
        TestBed.resetTestingModule();
      }
      expect(seen.size).toBe(4);
    });
  });
});
