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

// ── Helpers ───────────────────────────────────────────────────────

function getSelectHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-select')!;
}

function getTriggerButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return fixture.nativeElement.querySelector('tw-select button[role="combobox"]')!;
}

function getOverlayPanel(): HTMLElement | null {
  return document.querySelector('.cdk-overlay-pane tw-select-overlay');
}

function getOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('[role="option"]')) as HTMLElement[];
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
  });
});
