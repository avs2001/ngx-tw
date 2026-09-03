import { describe, it, expect, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import type { HarnessLoader } from '@angular/cdk/testing';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { provideTwIcons } from '@cdevhub/ngx-tw/icon';
import { FileUploadComponent } from '../file-upload';
import { FileUploadHarness } from './file-upload-harness';

function makeFile(name: string, size: number, type = 'text/plain'): File {
  return new File([new Uint8Array(size)], name, { type });
}

@Component({
  imports: [FileUploadComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-file-upload
      aria-label="Attachments"
      multiple
      [required]="required()"
      [formControl]="control"
    />
  `,
})
class HarnessHost {
  readonly upload = viewChild.required(FileUploadComponent);
  readonly control = new FormControl<File[]>([], { nonNullable: true });
  readonly required = signal(false);
}

describe('FileUploadHarness', () => {
  let fixture: ComponentFixture<HarnessHost>;
  let loader: HarnessLoader;

  /**
   * Seeds attached files the way a consumer would — through the bound form
   * control's `writeValue` path. The harness deliberately exposes no
   * `attach()`; see the class JSDoc for why setting `input.files` cannot be
   * expressed through CDK's `TestElement`.
   */
  async function seed(...files: File[]): Promise<void> {
    fixture.componentInstance.control.setValue(files);
    fixture.detectChanges();
    await fixture.whenStable();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HarnessHost],
      // `tw-file-upload` renders `<tw-icon>` for the dropzone and every row.
      providers: [provideTwIcons({})],
    }).compileComponents();
    fixture = TestBed.createComponent(HarnessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    loader = TestbedHarnessEnvironment.loader(fixture);
  });

  it('reads the accessible name and starts with nothing attached', async () => {
    const upload = await loader.getHarness(FileUploadHarness);

    expect(await upload.getLabel()).toBe('Attachments');
    expect(await upload.getFileNames()).toEqual([]);
  });

  it('enumerates attached files in list order', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    await seed(makeFile('notes.txt', 10), makeFile('report.pdf', 2048));

    // State CHANGED across the seed — the empty read above is the other half
    // of the proof that these are not hardcoded.
    expect(await upload.getFileNames()).toEqual(['notes.txt', 'report.pdf']);
  });

  it('exposes the row meta line, the only place per-file status surfaces', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    await seed(makeFile('notes.txt', 10));
    const [row] = await upload.getFiles();

    expect(await row.getName()).toBe('notes.txt');
    expect(await row.getMetaText()).toBe('10 B');
    // The two spans have no separator between them once Angular drops the
    // whitespace-only text node — pinned so the derivation above stays honest.
    expect(await row.getText()).toBe('notes.txt10 B');

    // Status lands in the same string — there is no separate DOM hook for it.
    fixture.componentInstance.upload().setItemStatus(
      fixture.componentInstance.upload().items()[0].id,
      'error',
      'Server rejected it',
    );
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await row.getMetaText()).toBe('10 B · Failed — Server rejected it');
  });

  it('removes a file by name and updates the bound control', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    await seed(makeFile('notes.txt', 10), makeFile('report.pdf', 2048));

    await upload.removeFile('notes.txt');

    expect(await upload.getFileNames()).toEqual(['report.pdf']);
    expect(fixture.componentInstance.control.value.map((f) => f.name)).toEqual([
      'report.pdf',
    ]);
  });

  it('removes the last file through the row harness', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    await seed(makeFile('notes.txt', 10));
    const [row] = await upload.getFiles();

    await row.remove();

    expect(await upload.getFileNames()).toEqual([]);
  });

  it('throws a named error rather than failing silently on an unknown file', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    await seed(makeFile('notes.txt', 10));

    await expect(upload.removeFile('missing.txt')).rejects.toThrow(
      /no attached file matching/i,
    );
  });

  it('reports the disabled state from the group', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    expect(await upload.isDisabled()).toBe(false);

    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await upload.isDisabled()).toBe(true);
  });

  it('reads required and invalid off the native input, not the role="group" host', async () => {
    const upload = await loader.getHarness(FileUploadHarness);
    expect(await upload.isRequired()).toBe(false);
    expect(await upload.isInvalid()).toBe(false);

    // ARIA 1.2 forbids `aria-required` / `aria-invalid` on `role="group"`, so
    // both live on the hidden `<input type="file">`. Were the harness reading
    // the host these would stay false.
    fixture.componentInstance.required.set(true);
    fixture.componentInstance.control.addValidators(Validators.required);
    fixture.componentInstance.control.setValue([]);
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(await upload.isRequired()).toBe(true);
    expect(await upload.isInvalid()).toBe(true);
  });

  it('finds a control by its accessible name through the predicate', async () => {
    const upload = await loader.getHarness(FileUploadHarness.with({ label: 'Attachments' }));
    expect(await upload.getLabel()).toBe('Attachments');
  });
});
