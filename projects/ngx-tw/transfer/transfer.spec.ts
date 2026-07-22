import { Component, signal, viewChild, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  TransferComponent,
  TransferItemDefDirective,
  type TwTransferMovedEvent,
} from './transfer';

interface Person {
  id: string;
  name: string;
}

const PEOPLE: Person[] = [
  { id: 'a', name: 'Ada' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Cara' },
  { id: 'd', name: 'Dan' },
];

const keyFn = (p: Person): string => p.id;
const labelFn = (p: Person): string => p.name;

// ── Default test host ──────────────────────────────────────────────────

@Component({
  imports: [TransferComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-transfer
      aria-label="People"
      [data]="data()"
      [keyFn]="keyFn"
      [labelFn]="labelFn"
      [display]="display()"
      [behavior]="behavior()"
      [labels]="labels()"
      [disabled]="disabled()"
      [(ngModel)]="model"
      (valueChange)="onValueChange($event)"
      (moved)="onMoved($event)"
    />
  `,
})
class HostComponent {
  readonly transfer = viewChild.required(TransferComponent);
  readonly data = signal<Person[]>(PEOPLE);
  readonly display = signal<Record<string, unknown>>({});
  readonly behavior = signal<Record<string, unknown>>({});
  readonly labels = signal<Record<string, unknown>>({});
  readonly disabled = signal(false);
  model: readonly string[] = [];
  keyFn = keyFn;
  labelFn = labelFn;
  lastValue: readonly string[] | null = null;
  lastMoved: TwTransferMovedEvent<string> | null = null;
  onValueChange(v: readonly string[]): void {
    this.lastValue = v;
  }
  onMoved(e: TwTransferMovedEvent<string>): void {
    this.lastMoved = e;
  }
}

// ── Reactive-form host ──────────────────────────────────────────────────

@Component({
  imports: [TransferComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-transfer
      aria-label="People"
      [data]="data"
      [keyFn]="keyFn"
      [labelFn]="labelFn"
      [formControl]="control"
    />
  `,
})
class ReactiveHostComponent {
  readonly transfer = viewChild.required(TransferComponent);
  data = PEOPLE;
  keyFn = keyFn;
  labelFn = labelFn;
  control = new FormControl<readonly string[]>([], { nonNullable: true });
}

// ── Projection host ─────────────────────────────────────────────────────

@Component({
  imports: [TransferComponent, TransferItemDefDirective, FormsModule],
  changeDetection: ChangeDetectionStrategy.Eager,
  template: `
    <tw-transfer aria-label="People" [data]="data" [keyFn]="keyFn" [labelFn]="labelFn" [(ngModel)]="model">
      <ng-template twTransferItem let-item let-checked="checked" let-side="side">
        <span class="custom" [attr.data-side]="side" [attr.data-checked]="checked">{{ $any(item).name }} · {{ side }}</span>
      </ng-template>
    </tw-transfer>
  `,
})
class ProjectionHostComponent {
  data = PEOPLE;
  keyFn = keyFn;
  labelFn = labelFn;
  model: readonly string[] = ['b'];
}

// ── Helpers ─────────────────────────────────────────────────────────────

function listboxes(fixture: ComponentFixture<unknown>): HTMLElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('[role="listbox"]'),
  ) as HTMLElement[];
}

function optionsOf(listbox: HTMLElement): HTMLElement[] {
  return Array.from(
    listbox.querySelectorAll('[role="option"]'),
  ) as HTMLElement[];
}

function moveButtons(fixture: ComponentFixture<unknown>): HTMLButtonElement[] {
  return Array.from(
    fixture.nativeElement.querySelectorAll('button'),
  ) as HTMLButtonElement[];
}

async function settle(fixture: ComponentFixture<unknown>): Promise<void> {
  fixture.detectChanges();
  await fixture.whenStable();
  fixture.detectChanges();
}

describe('TransferComponent', () => {
  describe('with template-driven host', () => {
    let fixture: ComponentFixture<HostComponent>;
    let host: HostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(HostComponent);
      host = fixture.componentInstance;
      await settle(fixture);
    });

    it('renders all items on the source side by default; the empty target shows its empty text', () => {
      // An empty panel renders no listbox (an empty role="listbox" is invalid ARIA).
      const boxes = listboxes(fixture);
      expect(boxes.length).toBe(1);
      expect(optionsOf(boxes[0]).length).toBe(PEOPLE.length);
      expect(fixture.nativeElement.textContent).toContain('No items');
    });

    it('renders an empty state (and no listbox) when a panel has no items', async () => {
      host.data.set([]);
      await settle(fixture);
      expect(listboxes(fixture).length).toBe(0);
      expect(fixture.nativeElement.textContent).toContain('No items');
    });

    it('ticking source options sets aria-selected', async () => {
      const [source] = listboxes(fixture);
      const opt = optionsOf(source)[0];
      opt.click();
      await settle(fixture);
      expect(opt.getAttribute('aria-selected')).toBe('true');
    });

    it('moves checked source items to target, clears checks, updates value, emits', async () => {
      const [source] = listboxes(fixture);
      optionsOf(source)[0].click(); // Ada
      optionsOf(source)[1].click(); // Bob
      await settle(fixture);

      // First move button is source → target.
      const moveToTarget = moveButtons(fixture)[0];
      expect(moveToTarget.disabled).toBe(false);
      moveToTarget.click();
      await settle(fixture);

      const [source2, target2] = listboxes(fixture);
      expect(optionsOf(target2).map((o) => o.textContent?.trim()).sort()).toEqual(['Ada', 'Bob']);
      expect(optionsOf(source2).length).toBe(2);
      expect(host.model).toEqual(['a', 'b']);
      expect(host.lastValue).toEqual(['a', 'b']);
      expect(host.lastMoved).toEqual({ keys: ['a', 'b'], direction: 'toTarget' });

      // Source checked set cleared → the move button is disabled again.
      expect(moveButtons(fixture)[0].disabled).toBe(true);
    });

    it('moves checked target items back to source (← reverse)', async () => {
      // Seed the target through the UI (forward move) to avoid reassigning ngModel.
      const [source] = listboxes(fixture);
      optionsOf(source)[0].click(); // Ada
      optionsOf(source)[1].click(); // Bob
      await settle(fixture);
      moveButtons(fixture)[0].click();
      await settle(fixture);
      expect(host.model).toEqual(['a', 'b']);

      const [, target] = listboxes(fixture);
      optionsOf(target)[0].click(); // Ada (target order: a, b)
      await settle(fixture);
      moveButtons(fixture)[1].click(); // ← reverse
      await settle(fixture);
      expect(host.model).toEqual(['b']);
      expect(host.lastMoved?.direction).toBe('toSource');
    });

    it('hides the ← button under behavior.oneWay', async () => {
      host.behavior.set({ oneWay: true });
      await settle(fixture);
      expect(moveButtons(fixture).length).toBe(1);
    });

    it('select-all is tri-state and checks all enabled visible items', async () => {
      // tw-checkbox exposes state on its role="checkbox" host via aria-checked.
      const selectAllHost = () =>
        fixture.nativeElement.querySelector('[role="checkbox"]') as HTMLElement;
      const selectAllInput = () =>
        fixture.nativeElement.querySelector(
          'input[type="checkbox"]',
        ) as HTMLInputElement;

      expect(selectAllHost().getAttribute('aria-checked')).toBe('false');

      // Select all → every enabled visible option becomes selected.
      selectAllInput().click();
      await settle(fixture);
      expect(selectAllHost().getAttribute('aria-checked')).toBe('true');
      expect(
        optionsOf(listboxes(fixture)[0]).every(
          (o) => o.getAttribute('aria-selected') === 'true',
        ),
      ).toBe(true);

      // Unchecking one option → tri-state goes to 'mixed' (indeterminate).
      optionsOf(listboxes(fixture)[0])[0].click();
      await settle(fixture);
      expect(selectAllHost().getAttribute('aria-checked')).toBe('mixed');
    });

    it('search filters rendered options (removed from the DOM) and scopes moves', async () => {
      host.display.set({ showSearch: true });
      await settle(fixture);
      const searchInputs = Array.from(
        fixture.nativeElement.querySelectorAll('input[type="text"]'),
      ) as HTMLInputElement[];
      const sourceSearch = searchInputs[0];
      sourceSearch.value = 'a'; // matches Ada, Cara, Dan
      sourceSearch.dispatchEvent(new Event('input'));
      await settle(fixture);
      const labels = optionsOf(listboxes(fixture)[0]).map((o) => o.textContent?.trim());
      expect(labels).toEqual(['Ada', 'Cara', 'Dan']);
      expect(labels).not.toContain('Bob'); // removed from DOM, not hidden
    });

    it('drops a checked item once a filter removes its option from the DOM', async () => {
      // The checked set is pruned to the rendered keys: a key checked then filtered
      // out is dropped permanently (matches the requirements doc; keeps the
      // controlled cdkListbox value always ⊆ rendered options).
      host.display.set({ showSearch: true });
      await settle(fixture);
      const sourceSearch = () =>
        fixture.nativeElement.querySelectorAll('input[type="text"]')[0] as HTMLInputElement;

      optionsOf(listboxes(fixture)[0])[0].click(); // check Ada
      await settle(fixture);
      expect(fixture.componentInstance.transfer().sourceChecked()).toEqual(['a']);

      // Filter every source item out → the panel renders no listbox at all, and
      // the checked key is pruned from the set.
      sourceSearch().value = 'zzz';
      sourceSearch().dispatchEvent(new Event('input'));
      await settle(fixture);
      expect(listboxes(fixture).length).toBe(0);
      expect(fixture.componentInstance.transfer().sourceChecked()).toEqual([]);

      // Clear the filter → the source listbox returns; Ada is no longer checked.
      sourceSearch().value = '';
      sourceSearch().dispatchEvent(new Event('input'));
      await settle(fixture);
      const ada = optionsOf(listboxes(fixture)[0]).find((o) =>
        o.textContent?.includes('Ada'),
      )!;
      expect(ada.getAttribute('aria-selected')).toBe('false');
    });

    it('excludes disabled items from rendering interaction and moves', async () => {
      host.behavior.set({ disabledItem: (p: Person) => p.id === 'b' });
      await settle(fixture);
      const [source] = listboxes(fixture);
      const bob = optionsOf(source).find((o) => o.textContent?.includes('Bob'))!;
      expect(bob.getAttribute('aria-disabled')).toBe('true');

      // Select-all should not include the disabled item.
      const selectAll = (
        fixture.nativeElement.querySelectorAll('input[type="checkbox"]')[0]
      ) as HTMLInputElement;
      selectAll.click();
      await settle(fixture);
      moveButtons(fixture)[0].click();
      await settle(fixture);
      // Bob (disabled) stays on source; the 3 enabled moved.
      expect(host.model.includes('b')).toBe(false);
      expect(host.model.length).toBe(3);
    });

    it('respects the disabled input — move buttons are disabled and no value changes', async () => {
      host.disabled.set(true);
      await settle(fixture);
      expect(moveButtons(fixture).every((b) => b.disabled)).toBe(true);
    });

    it('formats the count and applies custom labels', async () => {
      host.labels.set({ sourceTitle: 'Available', countFormat: '{selected}/{total}' });
      await settle(fixture);
      expect(fixture.nativeElement.textContent).toContain('Available');
      expect(fixture.nativeElement.textContent).toContain('0/4');
    });

    it('exposes role="listbox" with aria-labelledby and labelled move buttons', async () => {
      // Move one item so both panels have a (non-empty) listbox.
      optionsOf(listboxes(fixture)[0])[0].click();
      await settle(fixture);
      moveButtons(fixture)[0].click();
      await settle(fixture);

      const [source, target] = listboxes(fixture);
      const sourceLabel = source.getAttribute('aria-labelledby');
      const targetLabel = target.getAttribute('aria-labelledby');
      expect(sourceLabel).toBeTruthy();
      expect(targetLabel).toBeTruthy();
      expect(
        fixture.nativeElement.querySelector(`#${sourceLabel}`)?.textContent,
      ).toContain('Source');
      expect(
        fixture.nativeElement.querySelector(`#${targetLabel}`)?.textContent,
      ).toContain('Target');
      expect(moveButtons(fixture)[0].getAttribute('aria-label')).toBe(
        'Move selected to target',
      );
    });
  });

  describe('ControlValueAccessor (reactive forms)', () => {
    let fixture: ComponentFixture<ReactiveHostComponent>;
    let host: ReactiveHostComponent;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [ReactiveHostComponent],
      }).compileComponents();
      fixture = TestBed.createComponent(ReactiveHostComponent);
      host = fixture.componentInstance;
      await settle(fixture);
    });

    it('writeValue (control.setValue) updates the split, in targetKeys order', async () => {
      host.control.setValue(['c', 'a']);
      await settle(fixture);
      const [source, target] = listboxes(fixture);
      // Target renders in targetKeys order (c, a), not data order (a, c).
      expect(optionsOf(target).map((o) => o.textContent?.trim())).toEqual(['Cara', 'Ada']);
      expect(optionsOf(source).map((o) => o.textContent?.trim())).toEqual(['Bob', 'Dan']);
    });

    it('user move pushes the new value to the control', async () => {
      const [source] = listboxes(fixture);
      optionsOf(source)[2].click(); // Cara
      await settle(fixture);
      moveButtons(fixture)[0].click();
      await settle(fixture);
      expect(host.control.value).toEqual(['c']);
    });

    it('setDisabledState(true) disables the control and blocks moves', async () => {
      host.control.disable();
      await settle(fixture);
      expect(host.transfer().disabled()).toBe(true);
      expect(moveButtons(fixture).every((b) => b.disabled)).toBe(true);
    });

    it('reflects required from a bound Validators.required', async () => {
      host.control.addValidators(Validators.required);
      host.control.updateValueAndValidity(); // emits statusChanges → bumps the rev signal
      await settle(fixture);
      expect(host.transfer().required()).toBe(true);
    });

    it('preserves orphan keys through writeValue and across a move', async () => {
      host.control.setValue(['a', 'ghost']); // 'ghost' has no item in data
      await settle(fixture);
      // Orphan renders nothing but survives in the value.
      expect(host.transfer().value()).toEqual(['a', 'ghost']);
      const [, target] = listboxes(fixture);
      expect(optionsOf(target).length).toBe(1); // only Ada renders

      // Moving Ada back to source keeps the orphan in the value.
      host.transfer().moveToSource(['a']);
      await settle(fixture);
      expect(host.control.value).toEqual(['ghost']);
    });
  });

  describe('content projection', () => {
    it('default render uses labelFn; *twTransferItem overrides it with context', async () => {
      await TestBed.configureTestingModule({
        imports: [ProjectionHostComponent],
      }).compileComponents();
      const fixture = TestBed.createComponent(ProjectionHostComponent);
      await settle(fixture);

      const custom = fixture.nativeElement.querySelectorAll('.custom');
      expect(custom.length).toBe(PEOPLE.length);
      // Bob ('b') is on the target side per the seeded model.
      const bob = Array.from(custom).find((el) =>
        (el as HTMLElement).textContent?.includes('Bob'),
      ) as HTMLElement;
      expect(bob.getAttribute('data-side')).toBe('target');
      expect(bob.textContent).toContain('Bob · target');
    });
  });
});
