import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { TagsInputComponent } from '../tags-input';
import { TagsInputHarness } from './tags-input-harness';

@Component({
  imports: [TagsInputComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-tags-input
      aria-label="Recipients"
      [formControl]="control"
      [required]="required()"
      [addOnBlur]="addOnBlur()"
    />
  `,
})
class HarnessHost {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
  readonly required = signal(false);
  readonly addOnBlur = signal(false);
}

describe('TagsInputHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [HarnessHost] }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the accessible name and starts with no chips', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);

    expect(await tagsInput.getLabel()).toBe('Recipients');
    expect(await tagsInput.getTagTexts()).toEqual([]);
    expect(await tagsInput.getInputValue()).toBe('');
  });

  it('commits a tag typed into the input followed by Enter', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);

    await tagsInput.addTag('alpha');

    // State CHANGED across the interaction — the empty read above is the other
    // half of the proof that these are not hardcoded.
    expect(await tagsInput.getTagTexts()).toEqual(['alpha']);
    expect(await tagsInput.getInputValue()).toBe('');
    expect(fixture.componentInstance.control.value).toEqual(['alpha']);
  });

  it('commits on a separator character typed through typeInput, minus the swallow', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);

    // `,` is in the default `separatorKeys`, so the text before it commits.
    await tagsInput.typeInput('beta,');
    expect(await tagsInput.getTagTexts()).toEqual(['beta']);

    // The separator character itself is LEFT IN THE INPUT, unlike a real
    // browser: CDK's `typeInElement` appends every character to `value`
    // regardless of the `preventDefault()` the component calls on the keydown.
    // Pinned deliberately — if CDK ever honours preventDefault this assertion
    // fails, which is exactly when the caveat on `typeInput` should be dropped.
    expect(await tagsInput.getInputValue()).toBe(',');

    await tagsInput.clearInput();
    expect(await tagsInput.getInputValue()).toBe('');
  });

  it('removes a chip by its label', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    await tagsInput.addTag('alpha');
    await tagsInput.addTag('beta');
    expect(await tagsInput.getTagTexts()).toEqual(['alpha', 'beta']);

    await tagsInput.removeTag('alpha');

    expect(await tagsInput.getTagTexts()).toEqual(['beta']);
    expect(fixture.componentInstance.control.value).toEqual(['beta']);
  });

  it('removes a chip by index through the chip harness', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    await tagsInput.addTag('alpha');
    await tagsInput.addTag('beta');

    const tags = await tagsInput.getTags();
    expect(await tags[1].getRemoveLabel()).toBe('Remove beta');
    await tags[1].remove();

    expect(await tagsInput.getTagTexts()).toEqual(['alpha']);
  });

  it('throws a named error rather than failing silently on an unknown chip', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    await tagsInput.addTag('alpha');

    await expect(tagsInput.removeTag('kumquat')).rejects.toThrow(/no tag matching/i);
  });

  it('reads and clears the pending text without touching committed chips', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    await tagsInput.addTag('alpha');
    await tagsInput.typeInput('draft');
    expect(await tagsInput.getInputValue()).toBe('draft');

    await tagsInput.clearInput();

    expect(await tagsInput.getInputValue()).toBe('');
    expect(await tagsInput.getTagTexts()).toEqual(['alpha']);
  });

  it('commits the pending text on blur when addOnBlur is set', async () => {
    fixture.componentInstance.addOnBlur.set(true);
    fixture.detectChanges();
    await fixture.whenStable();

    const tagsInput = await loader.getHarness(TagsInputHarness);
    await tagsInput.focus();
    await tagsInput.typeInput('gamma');
    expect(await tagsInput.getTagTexts()).toEqual([]);

    await tagsInput.blur();

    expect(await tagsInput.getTagTexts()).toEqual(['gamma']);
  });

  it('reports the disabled state from the group', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    expect(await tagsInput.isDisabled()).toBe(false);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await tagsInput.isDisabled()).toBe(true);
  });

  it('reads required and invalid off the inner input, not the role="group" host', async () => {
    const tagsInput = await loader.getHarness(TagsInputHarness);
    expect(await tagsInput.isRequired()).toBe(false);
    expect(await tagsInput.isInvalid()).toBe(false);

    // ARIA 1.2 forbids `aria-required` / `aria-invalid` on `role="group"`, so
    // both live on the text input. Were the harness reading the host these
    // would stay false.
    fixture.componentInstance.required.set(true);
    fixture.componentInstance.control.addValidators(Validators.required);
    fixture.componentInstance.control.setValue([]);
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await tagsInput.isRequired()).toBe(true);
    expect(await tagsInput.isInvalid()).toBe(true);
  });

  it('finds a control by its accessible name through the predicate', async () => {
    const tagsInput = await loader.getHarness(
      TagsInputHarness.with({ label: 'Recipients' }),
    );
    expect(await tagsInput.getLabel()).toBe('Recipients');
  });
});
