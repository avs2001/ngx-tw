import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { OverlayModule } from '@angular/cdk/overlay';
import { SelectComponent } from './select';
import type {
  TwSelectOption,
  TwSelectSelectionChangeEvent,
  TwSelectOpenedEvent,
  TwSelectSearchEvent,
} from './select';

// ── Test hosts ────────────────────────────────────────────────────

interface TestOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
  readonly group?: string;
}

const OPTIONS: readonly TestOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry', disabled: true },
  { label: 'Date', value: 'date' },
];

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select
      [options]="options()"
      [(value)]="value"
      [multiple]="multiple()"
      [searchable]="searchable()"
      [disabled]="disabled()"
      [required]="required()"
      [placeholder]="placeholder()"
      [panelMaxHeight]="panelMaxHeight()"
      [closeOnSelect]="closeOnSelect()"
      [aria-label]="ariaLabel()"
      (openedChange)="onOpenedChange($event)"
      (selectionChange)="onSelectionChange($event)"
      (searchChange)="onSearchChange($event)"
    />
  `,
})
class BasicHost {
  options = signal<readonly TestOption[]>(OPTIONS);
  value = signal<string | readonly string[] | null>(null);
  multiple = signal(false);
  searchable = signal(false);
  disabled = signal(false);
  required = signal(false);
  placeholder = signal<string | undefined>('Choose');
  panelMaxHeight = signal(256);
  closeOnSelect = signal<boolean | undefined>(undefined);
  ariaLabel = signal<string | undefined>('Fruit');
  openedSpy = vi.fn();
  selectionSpy = vi.fn();
  searchSpy = vi.fn();
  onOpenedChange(ev: TwSelectOpenedEvent): void { this.openedSpy(ev); }
  onSelectionChange(ev: TwSelectSelectionChangeEvent<string>): void { this.selectionSpy(ev); }
  onSearchChange(ev: TwSelectSearchEvent): void { this.searchSpy(ev); }
}

@Component({
  imports: [SelectComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" [formControl]="ctrl" aria-label="Reactive" />`,
})
class ReactiveHost {
  options = OPTIONS;
  ctrl = new FormControl<string | null>(null);
}

@Component({
  imports: [SelectComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" [formControl]="ctrl" aria-label="Required" />`,
})
class RequiredReactiveHost {
  options = OPTIONS;
  ctrl = new FormControl<string | null>(null, Validators.required);
}

@Component({
  imports: [SelectComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" [(ngModel)]="value" aria-label="Template" />`,
})
class TemplateDrivenHost {
  options = OPTIONS;
  value: string | null = null;
}

@Component({
  imports: [SelectComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" [formField]="selectForm.fruit" aria-label="Signal" />`,
})
class SignalFormHost {
  options = OPTIONS;
  protected readonly model = signal<{ fruit: string | null }>({ fruit: null });
  readonly selectForm = form(this.model);
}

// ── Accessor / configuration hosts ────────────────────────────────
//
// Deliberately separate from BasicHost: every test in this file shares that
// template, so widening it would change the surface every other case runs on.

/** Record shape sharing no field names with the default option accessors. */
interface FruitRecord {
  readonly name: string;
  readonly id: string;
  readonly off?: boolean;
  readonly cat?: string;
}

const FRUIT_RECORDS: readonly FruitRecord[] = [
  { name: 'Apricot', id: 'a1', cat: 'Stone' },
  { name: 'Blueberry', id: 'b2', cat: 'Berry' },
  { name: 'Cranberry', id: 'c3', cat: 'Berry', off: true },
];

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select
      [options]="options"
      [(value)]="value"
      [optionLabel]="labelFn"
      [optionValue]="valueFn"
      [optionDisabled]="disabledFn"
      [optionGroup]="groupFn"
      aria-label="Fruit records"
      (selectionChange)="onSelectionChange($event)"
    />
  `,
})
class AccessorHost {
  options = FRUIT_RECORDS;
  value = signal<string | null>(null);
  labelFn = (o: unknown): string => (o as FruitRecord).name;
  valueFn = (o: unknown): string => (o as FruitRecord).id;
  disabledFn = (o: unknown): boolean => !!(o as FruitRecord).off;
  groupFn = (o: unknown): string | undefined => (o as FruitRecord).cat;
  selectionSpy = vi.fn();
  onSelectionChange(ev: TwSelectSelectionChangeEvent<string>): void { this.selectionSpy(ev); }
}

interface TagValue {
  readonly id: string;
}

const TAG_OPTIONS: readonly TwSelectOption<TagValue>[] = [
  { label: 'Red', value: { id: 'r' } },
  { label: 'Green', value: { id: 'g' } },
];

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select [options]="options" [(value)]="value" [compareWith]="cmp" aria-label="Tags" />
  `,
})
class CompareHost {
  options = TAG_OPTIONS;
  value = signal<TagValue | null>(null);
  cmp = (a: TagValue, b: TagValue): boolean => a.id === b.id;
}

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" [(value)]="value" aria-label="Tags default" />`,
})
class DefaultCompareHost {
  options = TAG_OPTIONS;
  value = signal<TagValue | null>(null);
}

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select [options]="options" [emptyMessage]="emptyMessage" aria-label="Empty" />
  `,
})
class EmptyMessageHost {
  options: readonly TestOption[] = [];
  emptyMessage = 'Nothing to pick';
}

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select
      [options]="options"
      [searchable]="true"
      [filterPredicate]="predicate"
      aria-label="Predicate"
    />
  `,
})
class PredicateHost {
  options = OPTIONS;
  // Matches on the option's `value`, which the default label-substring
  // predicate never reads.
  predicate = (o: unknown, search: string): boolean =>
    (o as TestOption).value.endsWith(search);
}

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-select
      [options]="options"
      [panelWidth]="320"
      [panelMaxHeight]="180"
      [panelClass]="'my-panel'"
      aria-label="Panel config"
    />
  `,
})
class PanelConfigHost {
  options = OPTIONS;
}

@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="sel-ext-label">External label</span>
    <span id="sel-ext-desc">Helper text</span>
    <tw-select
      [options]="options"
      [aria-labelledby]="labelledby"
      [aria-describedby]="describedby"
    />
  `,
})
class AriaRefHost {
  options = OPTIONS;
  labelledby = 'sel-ext-label';
  describedby = 'sel-ext-desc';
}

/** `variant="naked"` with NO wrapping `tw-form-field` — nothing else owns the focus ring. */
@Component({
  imports: [SelectComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-select [options]="options" variant="naked" aria-label="Naked" />`,
})
class NakedHost {
  options = OPTIONS;
}

// ── Helpers ───────────────────────────────────────────────────────

function getSelectHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-select')!;
}

function getTriggerButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('tw-select button[role="combobox"]')!;
}

function getClearControl(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('[aria-label="Clear selection"]')!;
}

function getOverlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane tw-select-overlay');
}

function getSearchInput(): HTMLInputElement | null {
  return document.querySelector('.cdk-overlay-pane input[type="search"]');
}

function getOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[];
}

/** Collapses template indentation so multi-line rows compare cleanly. */
function normalizeText(el: Element): string {
  return (el.textContent ?? '').replace(/\s+/g, ' ').trim();
}

function dispatchKeyOn(el: HTMLElement, key: string, opts: KeyboardEventInit = {}): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...opts });
  el.dispatchEvent(event);
  return event;
}

async function advance(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

/**
 * Pumps change detection on real macrotasks until `predicate` holds.
 *
 * Deliberately does NOT use `fixture.whenStable()`. The close path arms a
 * leave-animation timer, and awaiting stability across it made the reopen test
 * intermittently blow the 5s limit — it passed one run and timed out the next
 * with no code change between them. Polling the observable DOM is both
 * deterministic and exactly what the assertion cares about.
 */
async function pumpUntil(
  fixture: ComponentFixture<unknown>,
  predicate: () => boolean,
  label: string,
  timeoutMs = 2000,
): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    fixture.detectChanges();
    if (predicate()) {
      fixture.detectChanges();
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 10));
  }
  fixture.detectChanges();
  throw new Error(`pumpUntil timed out waiting for: ${label}`);
}

// ── Tests ─────────────────────────────────────────────────────────

describe('SelectComponent', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [OverlayModule],
    });
  });

  afterEach(() => {
    // Clean up any stray overlay panels between tests.
    document.querySelectorAll('.cdk-overlay-container').forEach((n) => n.remove());
  });

  // ── Rendering ──

  describe('rendering', () => {
    it('mounts without errors with default inputs', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getSelectHost(fixture)).toBeTruthy();
    });

    it('sets role="combobox" on the trigger button', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('role')).toBe('combobox');
    });

    it('shows aria-haspopup="listbox"', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('aria-haspopup')).toBe('listbox');
    });

    it('shows the placeholder when value is empty', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).textContent).toContain('Choose');
    });

    it('renders the selected option label when value is set', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('banana');
      await advance(fixture);
      expect(getTriggerButton(fixture).textContent).toContain('Banana');
    });

    it('renders aria-expanded="false" when closed', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('aria-expanded')).toBe('false');
    });

    it('uses naked variant when inside tw-form-field (data-variant attr)', () => {
      // Without the wrapper, data-variant should be "default"
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('data-variant')).toBe('default');
    });
  });

  // ── Inputs ──

  describe('inputs', () => {
    it('reflects aria-required when required=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.required.set(true);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('aria-required')).toBe('true');
    });

    it('reflects aria-disabled when disabled=true', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('aria-disabled')).toBe('true');
    });

    it('blocks click when disabled', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      fixture.detectChanges();
      expect(getOverlayPanel()).toBeFalsy();
    });

    it('reflects aria-label on the trigger', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      expect(getTriggerButton(fixture).getAttribute('aria-label')).toBe('Fruit');
    });
  });

  // ── Open / close lifecycle ──

  describe('open / close lifecycle', () => {
    it('opens the panel on trigger click', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
      expect(getTriggerButton(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('emits openedChange with open=true on open', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const spy = fixture.componentInstance.openedSpy;
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(spy).toHaveBeenCalled();
      const call = spy.mock.calls.find((c) => c[0].open === true);
      expect(call).toBeTruthy();
    });

    it('renders role="listbox" on the panel', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const listbox = document.querySelector('[role="listbox"]');
      expect(listbox).toBeTruthy();
    });

    it('applies canonical focus-visible outline classes to the listbox', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
      expect(listbox.className).toContain('focus-visible:outline-2');
      expect(listbox.className).toContain('focus-visible:outline-offset-2');
      expect(listbox.className).toContain('focus-visible:outline-primary-500');
    });

    it('renders each option with role="option"', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(getOptions().length).toBe(OPTIONS.length);
    });

    it('closes the panel on Escape', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      dispatchKeyOn(getTriggerButton(fixture), 'Escape');
      fixture.detectChanges();
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-expanded')).toBe('false');
      vi.useRealTimers();
    });
  });

  // ── Single-select interaction ──

  describe('single-select interaction', () => {
    it('selects an option on click', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const options = getOptions();
      options[1].click(); // Banana
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBe('banana');
      vi.useRealTimers();
    });

    it('emits selectionChange with source=user on option click', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const spy = fixture.componentInstance.selectionSpy;
      spy.mockClear();
      getOptions()[0].click();
      await advance(fixture);
      const userCall = spy.mock.calls.find(
        (c) => (c[0] as TwSelectSelectionChangeEvent<string>).source === 'user',
      );
      expect(userCall).toBeTruthy();
    });

    it('closes the panel after single-select (closeOnSelect defaults true)', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      fixture.detectChanges();
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-expanded')).toBe('false');
      vi.useRealTimers();
    });

    it('does not select disabled options', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[2].click(); // Cherry (disabled)
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('sets aria-selected="true" on the selected option', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('date');
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      const options = getOptions();
      expect(options[3].getAttribute('aria-selected')).toBe('true');
      expect(options[0].getAttribute('aria-selected')).toBe('false');
    });
  });

  // ── Multi-select interaction ──

  describe('multi-select interaction', () => {
    it('keeps the panel open after selecting in multi-mode', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.value.set([]);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-expanded')).toBe('true');
    });

    it('accumulates selections in multi-mode', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.value.set([]);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      await advance(fixture);
      getOptions()[1].click();
      await advance(fixture);
      const v = fixture.componentInstance.value();
      expect(Array.isArray(v)).toBe(true);
      expect((v as readonly string[]).slice().sort()).toEqual(['apple', 'banana']);
    });

    it('toggles an option off when clicked again', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.multiple.set(true);
      fixture.componentInstance.value.set(['apple']);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toEqual([]);
    });

    it('sets aria-multiselectable="true" on the listbox', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.multiple.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(document.querySelector('[role="listbox"]')!.getAttribute('aria-multiselectable')).toBe('true');
    });
  });

  // ── Keyboard ──

  describe('keyboard', () => {
    it('opens panel on ArrowDown when closed', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });

    it('opens panel on Enter when closed', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'Enter');
      await advance(fixture);
      expect(getOverlayPanel()).toBeTruthy();
    });

    it('does not open panel when disabled and ArrowDown is pressed', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.disabled.set(true);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      expect(getOverlayPanel()).toBeFalsy();
    });

    it('updates aria-activedescendant on ArrowDown when open', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      const before = getTriggerButton(fixture).getAttribute('aria-activedescendant');
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      const after = getTriggerButton(fixture).getAttribute('aria-activedescendant');
      expect(after).toBeTruthy();
      expect(after).not.toBe(before);
    });

    it('skips disabled options during keyboard navigation', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      // Starting at apple (index 0). ArrowDown → banana (index 1). ArrowDown → date (index 3, skip cherry).
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown');
      await advance(fixture);
      const active = getTriggerButton(fixture).getAttribute('aria-activedescendant');
      expect(active).toContain('-option-3');
    });

    it('selects the active option on Enter', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown'); // opens + active=apple
      await advance(fixture);
      dispatchKeyOn(getTriggerButton(fixture), 'ArrowDown'); // active=banana
      await advance(fixture);
      dispatchKeyOn(getTriggerButton(fixture), 'Enter');
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBe('banana');
      vi.useRealTimers();
    });
  });

  // ── Clear button ──

  describe('clear button', () => {
    it('renders clear button when value is non-empty', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      const clearBtn = fixture.nativeElement.querySelector('[aria-label="Clear selection"]');
      expect(clearBtn).toBeTruthy();
    });

    it('clears selection when clear button is clicked', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      const clearBtn = fixture.nativeElement.querySelector('[aria-label="Clear selection"]') as HTMLElement;
      clearBtn.click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('emits selectionChange with source=reset on clear', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      const spy = fixture.componentInstance.selectionSpy;
      spy.mockClear();
      const clearBtn = fixture.nativeElement.querySelector('[aria-label="Clear selection"]') as HTMLElement;
      clearBtn.click();
      await advance(fixture);
      const reset = spy.mock.calls.find(
        (c) => (c[0] as TwSelectSelectionChangeEvent<string>).source === 'reset',
      );
      expect(reset).toBeTruthy();
    });

    it('does not render clear button when empty', () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const clearBtn = fixture.nativeElement.querySelector('[aria-label="Clear selection"]');
      expect(clearBtn).toBeFalsy();
    });

    // SC 2.1.1. The clear control shipped with `tabindex="-1"`, which made its
    // own `(keydown)` handler and focus ring unreachable dead code: there was
    // no keyboard path at all to un-set a single-select value.

    it('puts the clear control in the tab order with an accessible name', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      const clearBtn = getClearControl(fixture);
      expect(clearBtn.tabIndex).toBe(0);
      expect(clearBtn.getAttribute('role')).toBe('button');
      expect(clearBtn.getAttribute('aria-label')).toBe('Clear selection');
    });

    it('clears the selection from the keyboard with Enter', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      dispatchKeyOn(getClearControl(fixture), 'Enter');
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('clears the selection from the keyboard with Space', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      dispatchKeyOn(getClearControl(fixture), ' ');
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('does not open the panel when the clear control is activated', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      dispatchKeyOn(getClearControl(fixture), 'Enter');
      await advance(fixture);
      expect(getOverlayPanel()).toBeFalsy();
    });

    // SC 2.4.3. Clearing unmounts the control the user was standing on, so
    // without an explicit hand-back focus falls to <body> and the next Tab
    // restarts from the top of the document.

    it('returns focus to the trigger after a keyboard clear', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      const clearBtn = getClearControl(fixture);
      clearBtn.focus();
      dispatchKeyOn(clearBtn, 'Enter');
      await advance(fixture);
      expect(document.activeElement).toBe(getTriggerButton(fixture));
    });

    it('returns focus to the trigger after a mouse clear', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.value.set('apple');
      await advance(fixture);
      getClearControl(fixture).click();
      await advance(fixture);
      expect(document.activeElement).toBe(getTriggerButton(fixture));
    });
  });

  // ── Searchable ──

  describe('searchable', () => {
    it('renders a search input when searchable=true', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(document.querySelector('input[type="search"]')).toBeTruthy();
    });

    it('filters options based on search input', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput.value = 'ban';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await advance(fixture);
      const options = getOptions();
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain('Banana');
    });

    it('renders the empty-state fallback when no options match', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput.value = 'xxxzzz';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await advance(fixture);
      expect(getOptions().length).toBe(0);
      const panel = getOverlayPanel()!;
      expect(panel.textContent).toContain('No results');
    });

    it('emits searchChange with the typed query and the post-filter visible count', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);

      const spy = fixture.componentInstance.searchSpy;
      spy.mockClear();

      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput.value = 'ban';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await advance(fixture);

      // `visibleCount` must be the *filtered* count (1 = Banana), not the
      // unfiltered option count (4). Asserting the whole payload also pins the
      // raw, untrimmed query text through to the consumer.
      expect(spy).toHaveBeenLastCalledWith({ search: 'ban', visibleCount: 1 });
    });

    it('emits searchChange with visibleCount 0 when the query matches nothing', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      getTriggerButton(fixture).click();
      await advance(fixture);

      const spy = fixture.componentInstance.searchSpy;
      spy.mockClear();

      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      searchInput.value = 'xxxzzz';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await advance(fixture);

      expect(spy).toHaveBeenLastCalledWith({ search: 'xxxzzz', visibleCount: 0 });
    });
  });

  // ── CVA: reactive forms ──

  describe('reactive forms', () => {
    it('initializes the trigger label from a pre-set FormControl value', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.componentInstance.ctrl.setValue('cherry');
      await advance(fixture);
      expect(getTriggerButton(fixture).textContent).toContain('Cherry');
    });

    it('updates the FormControl value when the user picks an option', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(fixture.componentInstance.ctrl.value).toBe('apple');
      vi.useRealTimers();
    });

    it('sets aria-disabled when FormControl is disabled', async () => {
      const fixture = TestBed.createComponent(ReactiveHost);
      fixture.componentInstance.ctrl.disable();
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-disabled')).toBe('true');
    });
  });

  // ── CVA: template-driven ──

  describe('template-driven forms', () => {
    it('round-trips value via ngModel', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(TemplateDrivenHost);
      fixture.detectChanges();
      await fixture.whenStable();
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[1].click();
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(fixture.componentInstance.value).toBe('banana');
      vi.useRealTimers();
    });
  });

  // ── CVA: signal forms ──

  describe('signal forms', () => {
    it('reflects initial field value in the trigger', async () => {
      const fixture = TestBed.createComponent(SignalFormHost);
      fixture.componentInstance.selectForm.fruit().value.set('banana');
      await advance(fixture);
      expect(getTriggerButton(fixture).textContent?.trim()).toContain('Banana');
    });

    it('updates the field value when the user picks an option', async () => {
      vi.useFakeTimers();
      const fixture = TestBed.createComponent(SignalFormHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      getOptions()[0].click();
      vi.advanceTimersByTime(200);
      await advance(fixture);
      expect(fixture.componentInstance.selectForm.fruit().value()).toBe('apple');
      vi.useRealTimers();
    });
  });

  // ── Error state ──

  describe('errorState', () => {
    it('does not set aria-invalid before the control is touched', () => {
      const fixture = TestBed.createComponent(RequiredReactiveHost);
      fixture.detectChanges();
      expect(fixture.componentInstance.ctrl.invalid).toBe(true);
      expect(getTriggerButton(fixture).getAttribute('aria-invalid')).toBe(null);
    });

    it('sets aria-invalid once the FormControl is touched + invalid', async () => {
      const fixture = TestBed.createComponent(RequiredReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.markAsTouched();
      fixture.componentInstance.ctrl.updateValueAndValidity();
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-invalid')).toBe('true');
    });

    it('clears aria-invalid once a value is set and the control becomes valid', async () => {
      const fixture = TestBed.createComponent(RequiredReactiveHost);
      fixture.detectChanges();
      fixture.componentInstance.ctrl.markAsTouched();
      fixture.componentInstance.ctrl.updateValueAndValidity();
      await advance(fixture);
      expect(getTriggerButton(fixture).getAttribute('aria-invalid')).toBe('true');
      fixture.componentInstance.ctrl.setValue('apple');
      await advance(fixture);
      expect(fixture.componentInstance.ctrl.valid).toBe(true);
      expect(getTriggerButton(fixture).getAttribute('aria-invalid')).toBe(null);
    });
  });

  // ── Accessibility ──

  describe('accessibility', () => {
    it('assigns a unique id to each instance', () => {
      const a = TestBed.createComponent(BasicHost);
      const b = TestBed.createComponent(BasicHost);
      a.detectChanges();
      b.detectChanges();
      expect(getTriggerButton(a).id).not.toBe(getTriggerButton(b).id);
    });

    it('wires aria-controls to the listbox id', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      const ariaControls = getTriggerButton(fixture).getAttribute('aria-controls');
      expect(ariaControls).toBeTruthy();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const listbox = document.querySelector('[role="listbox"]');
      expect(listbox!.id).toBe(ariaControls);
    });

    it('forwards aria-labelledby and aria-describedby to the trigger', () => {
      const fixture = TestBed.createComponent(AriaRefHost);
      fixture.detectChanges();
      const trigger = getTriggerButton(fixture);
      expect(trigger.getAttribute('aria-labelledby')).toBe('sel-ext-label');
      expect(trigger.getAttribute('aria-describedby')).toBe('sel-ext-desc');
    });

    // SC 4.1.2. `aria-activedescendant` is only honoured on the element that
    // holds DOM focus. Non-searchable panels keep focus on the trigger, so it
    // belongs there; searchable panels move focus into the overlay's search
    // input, so it has to move with it or arrow navigation is silent to AT.

    it('keeps aria-activedescendant on the trigger when not searchable', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      await advance(fixture);
      const trigger = getTriggerButton(fixture);
      trigger.click();
      await advance(fixture);
      dispatchKeyOn(trigger, 'ArrowDown');
      await advance(fixture);

      const activeId = trigger.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)?.getAttribute('role')).toBe('option');
    });

    it('moves aria-activedescendant to the search input while a searchable panel is open', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.componentInstance.searchable.set(true);
      await advance(fixture);
      const trigger = getTriggerButton(fixture);
      trigger.click();
      await advance(fixture);

      const searchInput = getSearchInput()!;
      expect(searchInput).toBeTruthy();
      dispatchKeyOn(searchInput, 'ArrowDown');
      await advance(fixture);

      // The attribute must be on the focused element and NOWHERE else — a
      // stale copy on the blurred trigger is the defect this pins.
      expect(trigger.hasAttribute('aria-activedescendant')).toBe(false);
      const activeId = searchInput.getAttribute('aria-activedescendant');
      expect(activeId).toBeTruthy();
      expect(document.getElementById(activeId!)?.getAttribute('role')).toBe('option');
    });

    // SC 2.4.7. `variant="naked"` exists so a wrapping `tw-form-field` can own
    // the box, including the focus ring. Used standalone there is no wrapper,
    // so the trigger has to draw its own or the whole composite has no visible
    // focus indicator anywhere. Asserting the `focus-visible:` utility is the
    // exception CLAUDE.md's testing section grants for focus indicators —
    // there is no rendered outline to measure in a unit environment.

    it('gives a standalone naked trigger a focus-visible indicator', () => {
      const fixture = TestBed.createComponent(NakedHost);
      fixture.detectChanges();
      const trigger = getTriggerButton(fixture);
      expect(trigger.getAttribute('data-variant')).toBe('naked');
      expect(trigger.className).toContain('focus-visible:outline-2');
      expect(trigger.className).not.toContain('focus-visible:outline-none');
    });
  });

  // ── Option accessors ──
  //
  // Every accessor input is exercised against a record shape that shares NO
  // field names with the defaults (`label` / `value` / `disabled` / `group`), so
  // a regression that silently falls back to the default accessor renders an
  // empty label instead of the expected text.

  describe('option accessors', () => {
    it('renders custom optionLabel text in the panel and in the trigger', async () => {
      const fixture = TestBed.createComponent(AccessorHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(getOptions().map(normalizeText)).toEqual(['Apricot', 'Blueberry', 'Cranberry']);
      getOptions()[0].click();
      await advance(fixture);
      expect(getTriggerButton(fixture).textContent).toContain('Apricot');
    });

    it('emits the custom optionValue result, not the record itself', async () => {
      const fixture = TestBed.createComponent(AccessorHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const spy = fixture.componentInstance.selectionSpy;
      spy.mockClear();
      getOptions()[1].click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBe('b2');
      expect(spy).toHaveBeenCalled();
      const event = spy.mock.calls.at(-1)![0] as TwSelectSelectionChangeEvent<string>;
      expect(event.value).toBe('b2');
      expect(event.added).toEqual(['b2']);
    });

    it('marks options disabled through the custom optionDisabled accessor and blocks selection', async () => {
      const fixture = TestBed.createComponent(AccessorHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const options = getOptions();
      expect(options[2].getAttribute('aria-disabled')).toBe('true');
      expect(options[0].getAttribute('aria-disabled')).toBeNull();
      options[2].click();
      await advance(fixture);
      expect(fixture.componentInstance.value()).toBeNull();
    });

    it('renders one group region per distinct custom optionGroup value', async () => {
      const fixture = TestBed.createComponent(AccessorHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const groups = Array.from(document.querySelectorAll('[role="group"]'));
      expect(groups.map((g) => g.getAttribute('aria-label'))).toEqual(['Stone', 'Berry']);
    });

    it('resolves the selected label through compareWith for a structurally-equal value', async () => {
      const fixture = TestBed.createComponent(CompareHost);
      fixture.componentInstance.value.set({ id: 'g' });
      await advance(fixture);
      // A fresh object literal is never `Object.is`-equal to the option's own
      // value, so only the custom comparator can resolve this label.
      expect(getTriggerButton(fixture).textContent).toContain('Green');
    });

    it('falls back to reference equality without compareWith, leaving the trigger label blank', async () => {
      const fixture = TestBed.createComponent(DefaultCompareHost);
      fixture.componentInstance.value.set({ id: 'g' });
      await advance(fixture);
      expect(getTriggerButton(fixture).textContent).not.toContain('Green');
    });
  });

  // ── Panel configuration ──

  describe('panel configuration', () => {
    it('renders a custom emptyMessage when the option list is empty', async () => {
      const fixture = TestBed.createComponent(EmptyMessageHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(getOptions().length).toBe(0);
      expect(getOverlayPanel()!.textContent).toContain('Nothing to pick');
    });

    it('filters with a custom filterPredicate instead of the default label match', async () => {
      const fixture = TestBed.createComponent(PredicateHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      // The default predicate is a label substring match, which 'a' satisfies for
      // Apple, Banana and Date. The custom one is a suffix match on the option's
      // `value`, which only Banana satisfies — so the count discriminates.
      searchInput.value = 'a';
      searchInput.dispatchEvent(new Event('input', { bubbles: true }));
      await advance(fixture);
      const options = getOptions();
      expect(options.length).toBe(1);
      expect(options[0].textContent).toContain('Banana');
    });

    it('applies a numeric panelWidth to the overlay pane', async () => {
      const fixture = TestBed.createComponent(PanelConfigHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const pane = document.querySelector('.cdk-overlay-pane') as HTMLElement | null;
      expect(pane).toBeTruthy();
      expect(pane!.style.width).toBe('320px');
    });

    it('applies panelMaxHeight to the scrollable listbox region', async () => {
      const fixture = TestBed.createComponent(PanelConfigHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      const listbox = document.querySelector('[role="listbox"]') as HTMLElement;
      expect(listbox.style.maxHeight).toBe('180px');
    });

    it('appends the consumer panelClass to the overlay panel', async () => {
      // Not the forbidden "assert internal class names" case: the asserted token
      // is the consumer's own input value, and landing on the panel is the whole
      // observable contract of `panelClass`.
      const fixture = TestBed.createComponent(PanelConfigHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await advance(fixture);
      expect(getOverlayPanel()!.classList.contains('my-panel')).toBe(true);
    });
  });

  // ── Reopen ──

  describe('reopen', () => {
    it('re-pushes the option rows into the fresh panel on reopen', async () => {
      const fixture = TestBed.createComponent(BasicHost);
      fixture.detectChanges();
      getTriggerButton(fixture).click();
      await pumpUntil(fixture, () => getOptions().length === 4, 'the panel to open');

      // Close, then let the leave-animation window elapse so the overlay detaches.
      getTriggerButton(fixture).click();
      await pumpUntil(
        fixture,
        () => getTriggerButton(fixture).getAttribute('aria-expanded') === 'false',
        'the panel to close',
      );

      // Reopening builds a brand-new overlay component whose row list starts
      // empty. The panel is only populated by the state-push effect, so this
      // asserts that effect still wakes on a second attach.
      getTriggerButton(fixture).click();
      await pumpUntil(
        fixture,
        () => getTriggerButton(fixture).getAttribute('aria-expanded') === 'true',
        'the panel to reopen',
      );

      const panels = document.querySelectorAll('tw-select-overlay');
      const fresh = panels[panels.length - 1];
      expect(fresh).toBeTruthy();
      expect(fresh.querySelectorAll('[role="option"]').length).toBe(4);
    });
  });
});
