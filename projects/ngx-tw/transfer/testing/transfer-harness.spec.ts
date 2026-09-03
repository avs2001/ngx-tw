import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TransferComponent } from '../transfer';
import { TransferHarness } from './transfer-harness';

interface Person {
  readonly id: string;
  readonly name: string;
}

const PEOPLE: readonly Person[] = [
  { id: 'a', name: 'Ada' },
  { id: 'b', name: 'Bob' },
  { id: 'c', name: 'Cara' },
  { id: 'd', name: 'Dan' },
];

@Component({
  imports: [TransferComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-transfer
      aria-label="People"
      [data]="data"
      [keyFn]="keyFn"
      [labelFn]="labelFn"
      [behavior]="behavior()"
      [display]="display()"
      [formControl]="control"
    />
  `,
})
class HarnessHost {
  readonly data = PEOPLE;
  readonly keyFn = (p: Person): string => p.id;
  readonly labelFn = (p: Person): string => p.name;
  readonly behavior = signal<Record<string, unknown>>({});
  readonly display = signal<Record<string, unknown>>({});
  readonly control = new FormControl<readonly string[]>([], { nonNullable: true });
}

describe('TransferHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HarnessHost] }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the accessible name and both panel titles', async () => {
    const transfer = await loader.getHarness(TransferHarness);

    expect(await transfer.getLabel()).toBe('People');
    expect(await transfer.getTitle('source')).toBe('Source');
    expect(await transfer.getTitle('target')).toBe('Target');
  });

  it('enumerates each side independently', async () => {
    const transfer = await loader.getHarness(TransferHarness);

    expect(await transfer.getItemTexts('source')).toEqual(['Ada', 'Bob', 'Cara', 'Dan']);
    // The target panel renders no listbox at all while empty (an empty
    // role="listbox" violates aria-required-children), which is exactly the
    // case a DOM-order-based panel lookup would get wrong.
    expect(await transfer.getItemTexts('target')).toEqual([]);
    expect(await transfer.getItemCount('target')).toBe(0);
  });

  it('ticks rows and shuttles them to the target', async () => {
    const transfer = await loader.getHarness(TransferHarness);

    await transfer.checkItem('source', 'Ada');
    await transfer.checkItem('source', 'Cara');
    expect(await transfer.getItems('source', { checked: true })).toHaveLength(2);

    await transfer.moveToTarget();

    expect(await transfer.getItemTexts('target')).toEqual(['Ada', 'Cara']);
    expect(await transfer.getItemTexts('source')).toEqual(['Bob', 'Dan']);
    expect(fixture.componentInstance.control.value).toEqual(['a', 'c']);
    // Moves clear the pending ticks on the panel they left.
    expect(await transfer.getItems('source', { checked: true })).toHaveLength(0);
  });

  it('unticks a row, taking it back out of the next move', async () => {
    const transfer = await loader.getHarness(TransferHarness);
    await transfer.checkItem('source', 'Ada');
    await transfer.checkItem('source', 'Bob');
    const [ada] = await transfer.getItems('source', { text: 'Ada' });

    await ada.uncheck();
    expect(await ada.isChecked()).toBe(false);

    await transfer.moveToTarget();

    expect(await transfer.getItemTexts('target')).toEqual(['Bob']);
  });

  it('shuttles rows back to the source', async () => {
    const transfer = await loader.getHarness(TransferHarness);
    await transfer.checkItem('source', 'Ada');
    await transfer.checkItem('source', 'Bob');
    await transfer.moveToTarget();

    await transfer.checkItem('target', 'Ada');
    await transfer.moveToSource();

    expect(await transfer.getItemTexts('target')).toEqual(['Bob']);
    expect(await transfer.getItemTexts('source')).toEqual(['Ada', 'Cara', 'Dan']);
    expect(fixture.componentInstance.control.value).toEqual(['b']);
  });

  it('moves everything through the header select-all', async () => {
    const transfer = await loader.getHarness(TransferHarness);

    await transfer.setAllChecked('source', true);
    expect(await transfer.getItems('source', { checked: true })).toHaveLength(4);

    await transfer.moveToTarget();

    expect(await transfer.getItemTexts('target')).toEqual(['Ada', 'Bob', 'Cara', 'Dan']);
    expect(await transfer.getItemCount('source')).toBe(0);
  });

  it('clears the header select-all again', async () => {
    const transfer = await loader.getHarness(TransferHarness);
    await transfer.setAllChecked('source', true);
    expect(await transfer.getItems('source', { checked: true })).toHaveLength(4);

    await transfer.setAllChecked('source', false);

    expect(await transfer.getItems('source', { checked: true })).toHaveLength(0);
  });

  it('clears the select-all from the tri-state middle', async () => {
    const transfer = await loader.getHarness(TransferHarness);
    // One row ticked puts the header checkbox in `mixed`, where a single click
    // resolves to CHECKED. `setAllChecked(false)` has to click twice to land
    // on false; a naive one-click implementation ends up selecting everything.
    await transfer.checkItem('source', 'Ada');
    expect(await transfer.getItems('source', { checked: true })).toHaveLength(1);

    await transfer.setAllChecked('source', false);

    expect(await transfer.getItems('source', { checked: true })).toHaveLength(0);
  });

  it('reports per-row disabled state and refuses to move it', async () => {
    fixture.componentInstance.behavior.set({
      disabledItem: (p: Person) => p.id === 'c',
    });
    fixture.detectChanges();
    await fixture.whenStable();

    const transfer = await loader.getHarness(TransferHarness);
    const [cara] = await transfer.getItems('source', { text: 'Cara' });
    expect(await cara.isDisabled()).toBe(true);

    await transfer.setAllChecked('source', true);
    await transfer.moveToTarget();

    expect(await transfer.getItemTexts('target')).toEqual(['Ada', 'Bob', 'Dan']);
    expect(await transfer.getItemTexts('source')).toEqual(['Cara']);
  });

  it('throws a named error rather than failing silently on an unknown row', async () => {
    const transfer = await loader.getHarness(TransferHarness);

    await expect(transfer.checkItem('source', 'Kumquat')).rejects.toThrow(
      /no source item matching/i,
    );
  });

  it('says so when oneWay removed the ← button', async () => {
    fixture.componentInstance.behavior.set({ oneWay: true });
    fixture.detectChanges();
    await fixture.whenStable();

    const transfer = await loader.getHarness(TransferHarness);
    await transfer.checkItem('source', 'Ada');
    await transfer.moveToTarget();

    await expect(transfer.moveToSource()).rejects.toThrow(/no ← button/);
  });

  it('says so when the select-all checkbox is hidden', async () => {
    fixture.componentInstance.display.set({ showSelectAll: false });
    fixture.detectChanges();
    await fixture.whenStable();

    const transfer = await loader.getHarness(TransferHarness);
    await expect(transfer.setAllChecked('source', true)).rejects.toThrow(
      /no select-all checkbox/i,
    );
  });

  it('reports the disabled state', async () => {
    const transfer = await loader.getHarness(TransferHarness);
    expect(await transfer.isDisabled()).toBe(false);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await transfer.isDisabled()).toBe(true);
  });

  it('finds a control by its accessible name through the predicate', async () => {
    const transfer = await loader.getHarness(TransferHarness.with({ label: 'People' }));
    expect(await transfer.getTitle('source')).toBe('Source');
  });
});
