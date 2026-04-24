import { Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { OverlayModule } from '@angular/cdk/overlay';
import {
  CommandPaletteComponent,
  CommandPaletteEmptyDirective,
  CommandPaletteFooterDirective,
  CommandPaletteGroupDirective,
  CommandPaletteItemDirective,
} from './command-palette';
import type { CommandPaletteFilterFn, CommandPaletteItem } from './command-palette-tokens';
import type { TwSize } from 'ngx-tw/core';

// ── Constants ──

const CLOSE_ANIMATION_MS = 150;

// ── Test host components ──

@Component({
  imports: [CommandPaletteComponent, CommandPaletteItemDirective],
  template: `
    <tw-command-palette
      [(open)]="isOpen"
      [size]="size"
      (itemSelected)="onSelected($event)"
    >
      <tw-command-palette-item id="new" label="New file" (activated)="onActivated('new')">
        New file
      </tw-command-palette-item>
      <tw-command-palette-item id="open" label="Open" (activated)="onActivated('open')">
        Open
      </tw-command-palette-item>
      <tw-command-palette-item id="settings" label="Settings" [disabled]="settingsDisabled">
        Settings
      </tw-command-palette-item>
    </tw-command-palette>
  `,
})
class BasicPaletteHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  size: TwSize = 'md';
  settingsDisabled = true;
  onActivated = vi.fn();
  onSelected = vi.fn();
}

@Component({
  imports: [CommandPaletteComponent],
  template: `
    <tw-command-palette [(open)]="isOpen" [commands]="commands" (itemSelected)="onSelected($event)" />
  `,
})
class DataDrivenPaletteHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  commands: CommandPaletteItem[] = [
    { id: 'cut', label: 'Cut', keywords: ['clipboard'] },
    { id: 'copy', label: 'Copy', keywords: ['clipboard'] },
    { id: 'paste', label: 'Paste', keywords: ['clipboard'] },
  ];
  onSelected = vi.fn();
}

@Component({
  imports: [CommandPaletteComponent],
  template: `
    <tw-command-palette
      [(open)]="isOpen"
      [commands]="commands"
      [filterFn]="filterFn"
    />
  `,
})
class CustomFilterHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  commands: CommandPaletteItem[] = [
    { id: 'a', label: 'Alpha' },
    { id: 'b', label: 'Beta' },
    { id: 'c', label: 'Gamma' },
  ];
  filterFn: CommandPaletteFilterFn = (items, q) => {
    if (!q) return items;
    return items.filter((it) => it.id === q);
  };
}

@Component({
  imports: [CommandPaletteComponent, CommandPaletteItemDirective],
  template: `
    <tw-command-palette [(open)]="isOpen" [closeOnSelect]="closeOnSelect">
      <tw-command-palette-item id="one" label="One">One</tw-command-palette-item>
      <tw-command-palette-item id="two" label="Two">Two</tw-command-palette-item>
    </tw-command-palette>
  `,
})
class CloseOnSelectHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  closeOnSelect = true;
}

@Component({
  imports: [CommandPaletteComponent, CommandPaletteItemDirective],
  template: `
    <tw-command-palette
      [(open)]="isOpen"
      [closeOnEscape]="closeOnEscape"
      [closeOnBackdropClick]="closeOnBackdrop"
    >
      <tw-command-palette-item id="a" label="Alpha">Alpha</tw-command-palette-item>
    </tw-command-palette>
  `,
})
class CloseFlagsHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  closeOnEscape = true;
  closeOnBackdrop = true;
}

@Component({
  imports: [CommandPaletteComponent, CommandPaletteEmptyDirective],
  template: `
    <tw-command-palette [(open)]="isOpen" [commands]="commands">
      <ng-template twCommandPaletteEmpty let-q>
        <span class="custom-empty">Nothing for "{{ q }}"</span>
      </ng-template>
    </tw-command-palette>
  `,
})
class EmptyTemplateHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  commands: CommandPaletteItem[] = [{ id: 'x', label: 'Xenon' }];
}

@Component({
  imports: [CommandPaletteComponent, CommandPaletteFooterDirective],
  template: `
    <tw-command-palette [(open)]="isOpen" [commands]="commands">
      <ng-template twCommandPaletteFooter>
        <span class="custom-footer">Footer content</span>
      </ng-template>
    </tw-command-palette>
  `,
})
class FooterTemplateHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
  commands: CommandPaletteItem[] = [{ id: 'x', label: 'Xenon' }];
}

@Component({
  imports: [CommandPaletteComponent, CommandPaletteItemDirective, CommandPaletteGroupDirective],
  template: `
    <tw-command-palette [(open)]="isOpen">
      <div twCommandPaletteGroup label="File">
        <tw-command-palette-item id="save" label="Save">Save</tw-command-palette-item>
      </div>
      <div twCommandPaletteGroup label="Edit">
        <tw-command-palette-item id="undo" label="Undo">Undo</tw-command-palette-item>
      </div>
    </tw-command-palette>
  `,
})
class GroupedPaletteHost {
  readonly palette = viewChild.required(CommandPaletteComponent);
  isOpen = signal(false);
}

// ── Helpers ──

function getOverlay(): HTMLElement | null {
  return document.querySelector('tw-command-palette-overlay');
}

function getSearchInput(): HTMLInputElement | null {
  return document.querySelector('tw-command-palette-overlay [role="combobox"]');
}

function getItems(): HTMLElement[] {
  return Array.from(document.querySelectorAll('tw-command-palette-overlay [role="option"]'));
}

function getListbox(): HTMLElement | null {
  return document.querySelector('tw-command-palette-overlay [role="listbox"]');
}

function getDialog(): HTMLElement | null {
  return document.querySelector('tw-command-palette-overlay [role="dialog"]');
}

function typeInSearch(value: string): void {
  const input = getSearchInput()!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true }));
}

function dispatchKey(key: string): void {
  const target = getSearchInput() ?? document.body;
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

function clickBackdrop(): void {
  const backdrop = document.querySelector('.cdk-overlay-backdrop') as HTMLElement | null;
  backdrop?.click();
}

function flushClose(fixture: ComponentFixture<unknown>): void {
  vi.advanceTimersByTime(CLOSE_ANIMATION_MS);
  fixture.detectChanges();
}

function openPalette(fixture: ComponentFixture<{ isOpen: { set(v: boolean): void } }>): void {
  fixture.componentInstance.isOpen.set(true);
  fixture.detectChanges();
}

// ── Tests ──

describe('CommandPaletteComponent', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    document.querySelectorAll('.cdk-overlay-container').forEach((el) => (el.innerHTML = ''));
  });

  describe('rendering', () => {
    it('creates without errors', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();
      expect(fixture.componentInstance.palette()).toBeTruthy();
    });

    it('renders nothing in the overlay when closed', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();
      expect(getOverlay()).toBeNull();
    });

    it('mounts overlay with panel and search input when opened', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      expect(getOverlay()).toBeTruthy();
      expect(getSearchInput()).toBeTruthy();
      expect(getDialog()).toBeTruthy();
    });
  });

  describe('sizes', () => {
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const size of sizes) {
      it(`renders size="${size}" without errors`, () => {
        const fixture = TestBed.configureTestingModule({
          imports: [BasicPaletteHost, OverlayModule],
        }).createComponent(BasicPaletteHost);
        fixture.componentInstance.size = size;
        fixture.detectChanges();

        openPalette(fixture);

        expect(getOverlay()).toBeTruthy();
      });
    }
  });

  describe('declarative items', () => {
    it('renders all projected items in the list', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const items = getItems();
      expect(items).toHaveLength(3);
    });
  });

  describe('data-driven items', () => {
    it('renders items from the commands input', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataDrivenPaletteHost, OverlayModule],
      }).createComponent(DataDrivenPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const items = getItems();
      expect(items).toHaveLength(3);
      expect(items.map((el) => el.id)).toEqual(['cut', 'copy', 'paste']);
    });
  });

  describe('filtering', () => {
    it('filters items by label case-insensitively', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataDrivenPaletteHost, OverlayModule],
      }).createComponent(DataDrivenPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      typeInSearch('COPY');
      fixture.detectChanges();

      const items = getItems();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('copy');
    });

    it('matches keywords as well as label', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataDrivenPaletteHost, OverlayModule],
      }).createComponent(DataDrivenPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      typeInSearch('clipboard');
      fixture.detectChanges();

      expect(getItems()).toHaveLength(3);
    });

    it('uses custom filter function when provided', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CustomFilterHost, OverlayModule],
      }).createComponent(CustomFilterHost);
      fixture.detectChanges();

      openPalette(fixture);
      typeInSearch('b');
      fixture.detectChanges();

      const items = getItems();
      expect(items).toHaveLength(1);
      expect(items[0].id).toBe('b');
    });
  });

  describe('keyboard navigation', () => {
    it('moves active descendant with ArrowDown', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('new');

      dispatchKey('ArrowDown');
      fixture.detectChanges();
      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('open');
    });

    it('wraps at end with ArrowDown', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      // settings is disabled; navigation skips it, so from 'open' ArrowDown should wrap to 'new'
      dispatchKey('ArrowDown'); // new → open
      fixture.detectChanges();
      dispatchKey('ArrowDown'); // open → new (wrap, skipping disabled settings)
      fixture.detectChanges();
      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('new');
    });

    it('moves active with ArrowUp and wraps to last enabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      dispatchKey('ArrowUp');
      fixture.detectChanges();
      // starts at new, ArrowUp wraps backward, skipping disabled settings → open
      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('open');
    });

    it('jumps to first enabled item on Home', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('ArrowDown');
      fixture.detectChanges();
      dispatchKey('Home');
      fixture.detectChanges();
      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('new');
    });

    it('jumps to last enabled item on End', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.componentInstance.settingsDisabled = false;
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('End');
      fixture.detectChanges();
      expect(getSearchInput()!.getAttribute('aria-activedescendant')).toBe('settings');
    });
  });

  describe('selection', () => {
    it('activates the active item on Enter, firing itemSelected', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('Enter');
      fixture.detectChanges();

      expect(fixture.componentInstance.onSelected).toHaveBeenCalledOnce();
      expect(fixture.componentInstance.onSelected.mock.calls[0][0].id).toBe('new');
      expect(fixture.componentInstance.onActivated).toHaveBeenCalledWith('new');
    });

    it('activates the item on click', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      const items = getItems();
      items[1].click();
      fixture.detectChanges();

      expect(fixture.componentInstance.onSelected).toHaveBeenCalledOnce();
      expect(fixture.componentInstance.onSelected.mock.calls[0][0].id).toBe('open');
    });

    it('does not activate disabled items', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      const settingsItem = getItems().find((el) => el.id === 'settings')!;
      settingsItem.click();
      fixture.detectChanges();

      expect(fixture.componentInstance.onSelected).not.toHaveBeenCalled();
    });

    it('closes after select when closeOnSelect is true', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseOnSelectHost, OverlayModule],
      }).createComponent(CloseOnSelectHost);
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('Enter');
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlay()).toBeNull();
    });

    it('stays open after select when closeOnSelect is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseOnSelectHost, OverlayModule],
      }).createComponent(CloseOnSelectHost);
      fixture.componentInstance.closeOnSelect = false;
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('Enter');
      fixture.detectChanges();

      expect(getOverlay()).toBeTruthy();
    });
  });

  describe('close behavior', () => {
    it('closes on Escape by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseFlagsHost, OverlayModule],
      }).createComponent(CloseFlagsHost);
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('Escape');
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlay()).toBeNull();
    });

    it('does not close on Escape when closeOnEscape is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseFlagsHost, OverlayModule],
      }).createComponent(CloseFlagsHost);
      fixture.componentInstance.closeOnEscape = false;
      fixture.detectChanges();

      openPalette(fixture);
      dispatchKey('Escape');
      fixture.detectChanges();

      expect(getOverlay()).toBeTruthy();
    });

    it('closes on backdrop click by default', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseFlagsHost, OverlayModule],
      }).createComponent(CloseFlagsHost);
      fixture.detectChanges();

      openPalette(fixture);
      clickBackdrop();
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlay()).toBeNull();
    });

    it('does not close on backdrop click when closeOnBackdropClick is false', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [CloseFlagsHost, OverlayModule],
      }).createComponent(CloseFlagsHost);
      fixture.componentInstance.closeOnBackdrop = false;
      fixture.detectChanges();

      openPalette(fixture);
      clickBackdrop();
      fixture.detectChanges();

      expect(getOverlay()).toBeTruthy();
    });
  });

  describe('model binding', () => {
    it('opens when parent sets open to true', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      expect(getOverlay()).toBeTruthy();
    });

    it('sets open back to false when the palette closes', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      clickBackdrop();
      fixture.detectChanges();
      flushClose(fixture);

      expect(fixture.componentInstance.isOpen()).toBe(false);
    });
  });

  describe('ARIA', () => {
    it('sets role="dialog" and aria-modal on the panel', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const dialog = getDialog()!;
      expect(dialog.getAttribute('role')).toBe('dialog');
      expect(dialog.getAttribute('aria-modal')).toBe('true');
      expect(dialog.getAttribute('aria-label')).toBe('Command palette');
    });

    it('sets role="combobox" on the search input with aria-controls and aria-activedescendant', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const input = getSearchInput()!;
      expect(input.getAttribute('role')).toBe('combobox');
      expect(input.getAttribute('aria-expanded')).toBe('true');
      expect(input.getAttribute('aria-controls')).toBe(getListbox()!.id);
      expect(input.getAttribute('aria-activedescendant')).toBe('new');
    });

    it('marks options with role="option" and aria-selected', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const items = getItems();
      for (const item of items) {
        expect(item.getAttribute('role')).toBe('option');
      }
      const active = items.find((el) => el.id === 'new')!;
      expect(active.getAttribute('aria-selected')).toBe('true');
    });

    it('marks disabled items with aria-disabled', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const settings = getItems().find((el) => el.id === 'settings')!;
      expect(settings.getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('focus management', () => {
    it('focuses the search input on open', async () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      // queueMicrotask needs a flush — timers advance processes them.
      await Promise.resolve();
      fixture.detectChanges();

      expect(document.activeElement).toBe(getSearchInput());
    });

    it('returns focus to the previously focused element on close', async () => {
      const trigger = document.createElement('button');
      document.body.appendChild(trigger);
      trigger.focus();

      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      await Promise.resolve();
      fixture.detectChanges();

      clickBackdrop();
      fixture.detectChanges();

      expect(document.activeElement).toBe(trigger);
      document.body.removeChild(trigger);
    });
  });

  describe('empty state', () => {
    it('renders the built-in fallback when no commands match', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [DataDrivenPaletteHost, OverlayModule],
      }).createComponent(DataDrivenPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      typeInSearch('nothingmatches');
      fixture.detectChanges();

      expect(getItems()).toHaveLength(0);
      const overlay = getOverlay()!;
      expect(overlay.textContent).toContain('No results found');
    });

    it('renders a projected empty template when provided', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [EmptyTemplateHost, OverlayModule],
      }).createComponent(EmptyTemplateHost);
      fixture.detectChanges();

      openPalette(fixture);
      typeInSearch('nomatch');
      fixture.detectChanges();

      const custom = document.querySelector('.custom-empty');
      expect(custom).toBeTruthy();
      expect(custom!.textContent).toContain('nomatch');
    });
  });

  describe('footer', () => {
    it('renders the projected footer template', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [FooterTemplateHost, OverlayModule],
      }).createComponent(FooterTemplateHost);
      fixture.detectChanges();

      openPalette(fixture);

      expect(document.querySelector('.custom-footer')).toBeTruthy();
    });
  });

  describe('groups', () => {
    it('inherits group label from surrounding twCommandPaletteGroup', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [GroupedPaletteHost, OverlayModule],
      }).createComponent(GroupedPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);

      const headers = Array.from(
        document.querySelectorAll('tw-command-palette-overlay [role="presentation"]'),
      ).map((el) => el.textContent?.trim());
      expect(headers).toEqual(['File', 'Edit']);
    });
  });

  describe('overlay reuse', () => {
    it('does not create a second overlay panel on re-open', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      expect(getOverlay()).toBeTruthy();
      const firstCount = document.querySelectorAll('.tw-command-palette-panel').length;

      fixture.componentInstance.isOpen.set(false);
      fixture.detectChanges();
      flushClose(fixture);

      openPalette(fixture);
      const secondCount = document.querySelectorAll('.tw-command-palette-panel').length;
      expect(secondCount).toBe(firstCount);
    });
  });

  describe('programmatic control', () => {
    it('opens via show()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      fixture.componentInstance.palette().show();
      fixture.detectChanges();

      expect(getOverlay()).toBeTruthy();
    });

    it('closes via hide()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      fixture.componentInstance.palette().show();
      fixture.detectChanges();
      fixture.componentInstance.palette().hide();
      fixture.detectChanges();
      flushClose(fixture);

      expect(getOverlay()).toBeNull();
    });

    it('toggles via toggle()', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      fixture.componentInstance.palette().toggle();
      fixture.detectChanges();
      expect(getOverlay()).toBeTruthy();

      fixture.componentInstance.palette().toggle();
      fixture.detectChanges();
      flushClose(fixture);
      expect(getOverlay()).toBeNull();
    });
  });

  describe('outputs', () => {
    it('emits opened after the palette is attached', () => {
      const onOpened = vi.fn();
      const onClosed = vi.fn();

      @Component({
        imports: [CommandPaletteComponent],
        template: `
          <tw-command-palette
            [(open)]="isOpen"
            (opened)="openedSpy()"
            (closed)="closedSpy()"
          />
        `,
      })
      class EventHost {
        readonly palette = viewChild.required(CommandPaletteComponent);
        isOpen = signal(false);
        openedSpy = onOpened;
        closedSpy = onClosed;
      }

      const fixture = TestBed.configureTestingModule({
        imports: [EventHost, OverlayModule],
      }).createComponent(EventHost);
      fixture.detectChanges();

      openPalette(fixture);

      expect(onOpened).toHaveBeenCalledOnce();
      expect(onClosed).not.toHaveBeenCalled();

      fixture.componentInstance.isOpen.set(false);
      fixture.detectChanges();
      flushClose(fixture);

      expect(onClosed).toHaveBeenCalledOnce();
    });
  });

  describe('cleanup', () => {
    it('removes the overlay when the host component is destroyed', () => {
      const fixture = TestBed.configureTestingModule({
        imports: [BasicPaletteHost, OverlayModule],
      }).createComponent(BasicPaletteHost);
      fixture.detectChanges();

      openPalette(fixture);
      expect(getOverlay()).toBeTruthy();

      fixture.destroy();
      expect(getOverlay()).toBeNull();
    });
  });
});
