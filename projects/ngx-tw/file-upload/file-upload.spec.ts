import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChangeDetectionStrategy, Component, signal, viewChild } from '@angular/core';
import { type ComponentFixture, TestBed } from '@angular/core/testing';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { FocusMonitor, LiveAnnouncer } from '@angular/cdk/a11y';
import {
  FileUploadComponent,
  FileUploadItemDirective,
  type FileUploadItem,
  type FileUploadRejection,
  type FileUploadVariant,
} from './file-upload';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from '@cdevhub/ngx-tw/form-field';
import { provideTwIcons } from '@cdevhub/ngx-tw/icon';
import type { TwSize } from '@cdevhub/ngx-tw/core';

// ── Test hosts ────────────────────────────────────────────────────

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-file-upload
      [multiple]="multiple()"
      [accept]="accept()"
      [maxSize]="maxSize()"
      [maxFiles]="maxFiles()"
      [variant]="variant()"
      [size]="size()"
      [disabled]="disabled()"
      [required]="required()"
      [label]="label()"
      [description]="description()"
      [triggerLabel]="triggerLabel()"
      (filesAdded)="onAdded($event)"
      (fileRemoved)="onRemoved($event)"
      (fileRejected)="onRejected($event)"
      (cleared)="onCleared()"
    />
  `,
})
class BasicHost {
  readonly upload = viewChild.required(FileUploadComponent);
  multiple = signal(false);
  accept = signal<string | undefined>(undefined);
  maxSize = signal<number | undefined>(undefined);
  maxFiles = signal<number | undefined>(undefined);
  variant = signal<FileUploadVariant>('outline');
  size = signal<TwSize>('md');
  disabled = signal(false);
  required = signal(false);
  label = signal<string | undefined>('Upload files');
  description = signal<string | undefined>(undefined);
  triggerLabel = signal('Choose files');
  addedSpy = vi.fn();
  removedSpy = vi.fn();
  rejectedSpy = vi.fn();
  clearedSpy = vi.fn();
  onAdded(items: FileUploadItem[]): void { this.addedSpy(items); }
  onRemoved(item: FileUploadItem): void { this.removedSpy(item); }
  onRejected(rej: FileUploadRejection): void { this.rejectedSpy(rej); }
  onCleared(): void { this.clearedSpy(); }
}

@Component({
  imports: [FileUploadComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Reactive" multiple [formControl]="control" />`,
})
class ReactiveHost {
  readonly upload = viewChild.required(FileUploadComponent);
  control = new FormControl<File[] | null>(null);
}

@Component({
  imports: [FileUploadComponent, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Template" multiple [(ngModel)]="value" />`,
})
class TemplateDrivenHost {
  readonly upload = viewChild.required(FileUploadComponent);
  value: File[] | null = null;
}

@Component({
  imports: [FileUploadComponent, FileUploadItemDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-file-upload #u label="Custom" multiple>
      <ng-template twFileUploadItem let-item>
        <div data-testid="custom-row">{{ item.file.name }}</div>
      </ng-template>
    </tw-file-upload>
  `,
})
class CustomItemHost {
  readonly upload = viewChild.required(FileUploadComponent);
}

@Component({
  imports: [FileUploadComponent, FormField],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Signal" multiple [formField]="uploadForm.files" />`,
})
class SignalFormHost {
  readonly upload = viewChild.required(FileUploadComponent);
  protected readonly model = signal<{ files: File[] | null }>({ files: null });
  readonly uploadForm = form(this.model);
}

@Component({
  imports: [
    FileUploadComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    ReactiveFormsModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-form-field>
      <label twLabel>Attachments</label>
      <tw-file-upload multiple [formControl]="control" />
      <span twHint>PDF or image.</span>
      <span twError match="required">Required.</span>
    </tw-form-field>
  `,
})
class FormFieldHost {
  control = new FormControl<File[] | null>(null, Validators.required);
}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload aria-label="Pick files" />`,
})
class AriaLabelHost {}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Outer" class="my-custom-class" />`,
})
class ClassMergeHost {}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-file-upload>
      <span twFileUploadIcon data-testid="proj-icon">ICON</span>
      <span twFileUploadHeadline data-testid="proj-headline">My headline</span>
      <span twFileUploadDescription data-testid="proj-description">My description</span>
    </tw-file-upload>
  `,
})
class ProjectionHost {}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // No label, no description → the headline fallback should render.
  template: `<tw-file-upload aria-label="Upload" />`,
})
class FallbackHost {}

@Component({
  imports: [FileUploadComponent, ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <tw-file-upload
      label="Reactive"
      multiple
      [formControl]="control"
      (filesAdded)="addedSpy($event)"
      (fileRemoved)="removedSpy($event)"
      (cleared)="clearedSpy()"
    />
  `,
})
class ReactiveSpyHost {
  readonly upload = viewChild.required(FileUploadComponent);
  control = new FormControl<File[] | null>(null);
  addedSpy = vi.fn();
  removedSpy = vi.fn();
  clearedSpy = vi.fn();
}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Named" name="attachments" />`,
})
class NameHost {}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span id="ext-label">External label</span>
    <span id="ext-desc">External description</span>
    <tw-file-upload
      aria-labelledby="ext-label"
      aria-describedby="ext-desc"
      description="Inline description"
    />
  `,
})
class StandaloneAriaHost {
  readonly upload = viewChild.required(FileUploadComponent);
}

@Component({
  imports: [FileUploadComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<tw-file-upload label="Custom id" [id]="'custom-id'" />`,
})
class IdOverrideHost {}

// ── Helpers ───────────────────────────────────────────────────────

function getHost(fixture: ComponentFixture<unknown>): HTMLElement {
  return fixture.nativeElement.querySelector('tw-file-upload')!;
}

function getDropzone(fixture: ComponentFixture<unknown>): HTMLElement {
  // The dropzone is the only direct-child <div> of the host — the hidden input
  // is an <input> and the file list is a <ul>. It no longer carries
  // role="button"/tabindex; the inner trigger <button> is the keyboard control.
  return Array.from(getHost(fixture).children).find(
    (el): el is HTMLElement => el.tagName === 'DIV',
  )!;
}

function getTriggerButton(fixture: ComponentFixture<unknown>): HTMLButtonElement {
  return getDropzone(fixture).querySelector<HTMLButtonElement>('button[twButton]')!;
}

function getHiddenInput(fixture: ComponentFixture<unknown>): HTMLInputElement {
  return getHost(fixture).querySelector<HTMLInputElement>('input[type="file"]')!;
}

function makeFile(name: string, size: number, type: string): File {
  return new File([new Uint8Array(size)], name, { type });
}

// jsdom does not implement `DataTransfer`. Fake it with a plain object that
// satisfies the runtime shape the component reads (types, items, files).
interface FakeDataTransfer {
  types: readonly string[];
  files: FileList;
  items: readonly { kind: 'file'; type: string }[];
}

function buildDataTransfer(files: File[]): FakeDataTransfer {
  const fileList = Object.assign(files.slice(), {
    item: (i: number) => files[i] ?? null,
  }) as unknown as FileList;
  return {
    types: ['Files'],
    files: fileList,
    items: files.map((f) => ({ kind: 'file' as const, type: f.type })),
  };
}

function dispatchDragEvent(
  el: HTMLElement,
  type: 'dragenter' | 'dragover' | 'dragleave' | 'drop',
  files: File[],
): Event {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.defineProperty(event, 'dataTransfer', {
    value: buildDataTransfer(files),
    configurable: true,
  });
  el.dispatchEvent(event);
  return event;
}

// Patches an HTMLInputElement's `files` getter so we can simulate selection
// without an OS picker. jsdom's `input.files` setter is not implemented.
function setInputFiles(input: HTMLInputElement, files: File[]): void {
  const fileList = Object.assign(files.slice(), {
    item: (i: number) => files[i] ?? null,
  }) as unknown as FileList;
  Object.defineProperty(input, 'files', {
    configurable: true,
    get: () => fileList,
  });
}

// ── Suite setup ───────────────────────────────────────────────────

const focusMonitorSpy = {
  monitor: vi.fn(() => ({ subscribe: () => ({ unsubscribe: () => {} }) })),
  stopMonitoring: vi.fn(),
};

const liveAnnouncerSpy = {
  announce: vi.fn().mockResolvedValue(undefined),
};

beforeEach(() => {
  vi.clearAllMocks();
  TestBed.configureTestingModule({
    providers: [
      { provide: FocusMonitor, useValue: focusMonitorSpy },
      { provide: LiveAnnouncer, useValue: liveAnnouncerSpy },
      provideTwIcons({}),
    ],
  });
});

// ── 1. Rendering ─────────────────────────────────────────────────

describe('FileUploadComponent — rendering', () => {
  it('mounts with default inputs', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    expect(getHost(fixture)).toBeTruthy();
  });

  it('renders the hidden file input as sr-only', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const input = getHiddenInput(fixture);
    expect(input.className).toContain('sr-only');
    expect(input.type).toBe('file');
  });

  it('takes the hidden file input out of the tab order with a non-empty aria-label (PIN H2)', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const input = getHiddenInput(fixture);
    expect(input.getAttribute('tabindex')).toBe('-1');
    expect(input.getAttribute('aria-label')?.trim()).toBeTruthy();
  });

  it('renders the dropzone as a clickable region with no button role or tabindex (PIN H1)', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const dz = getDropzone(fixture);
    // The dropzone is a click/drop target, not a focusable control — the inner
    // <button> owns keyboard operability, so there is no nested-interactive
    // structure (the dropzone must not itself be a tabbable button).
    expect(dz.getAttribute('role')).not.toBe('button');
    expect(dz.hasAttribute('tabindex')).toBe(false);
    const btn = getTriggerButton(fixture);
    expect(btn).toBeTruthy();
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.getAttribute('tabindex')).toBeNull();
  });

  it('renders the trigger button with the default label', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const btn = getDropzone(fixture).querySelector('button');
    expect(btn?.textContent?.trim()).toContain('Choose files');
  });

  it('renders no items by default', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const lis = getHost(fixture).querySelectorAll('ul > li');
    expect(lis.length).toBe(0);
  });

  it('renders every variant without errors', () => {
    const fixture = TestBed.createComponent(BasicHost);
    const host = fixture.componentInstance;
    for (const v of ['outline', 'soft'] as const) {
      host.variant.set(v);
      fixture.detectChanges();
      expect(getHost(fixture)).toBeTruthy();
    }
  });

  it('renders every size without errors', () => {
    const fixture = TestBed.createComponent(BasicHost);
    const host = fixture.componentInstance;
    const sizes: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
    for (const s of sizes) {
      host.size.set(s);
      fixture.detectChanges();
      expect(getHost(fixture)).toBeTruthy();
    }
  });

  it('sets role="group" on the host', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    expect(getHost(fixture).getAttribute('role')).toBe('group');
  });
});

// ── 2. Inputs ────────────────────────────────────────────────────

describe('FileUploadComponent — inputs', () => {
  it('reflects multiple to the hidden input', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    expect(getHiddenInput(fixture).multiple).toBe(true);
  });

  it('reflects accept to the hidden input', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.accept.set('image/*,.pdf');
    fixture.detectChanges();
    expect(getHiddenInput(fixture).getAttribute('accept')).toBe('image/*,.pdf');
  });

  it('reflects name to the hidden input (#15)', () => {
    const fixture = TestBed.createComponent(NameHost);
    fixture.detectChanges();
    expect(getHiddenInput(fixture).getAttribute('name')).toBe('attachments');
  });

  it('reflects disabled to host aria-disabled, dropzone styling, button and hidden input', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    expect(getHost(fixture).getAttribute('aria-disabled')).toBe('true');
    const dz = getDropzone(fixture);
    expect(dz.className).toContain('pointer-events-none');
    expect(getTriggerButton(fixture).disabled).toBe(true);
    expect(getHiddenInput(fixture).disabled).toBe(true);
  });

  // ARIA 1.2 does not allow `aria-required` on `role="group"`, and axe reports
  // it as a critical `aria-allowed-attr` violation. The requirement belongs on
  // the control that holds the value — the hidden `<input type="file">`, via
  // the native `required` attribute. Asserting BOTH halves: present on the
  // input, absent from the host. Without the negative half this test would
  // still pass if the disallowed host attribute were reintroduced.
  it('marks the hidden file input required, and never the group host', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.required.set(true);
    fixture.detectChanges();
    expect(getHiddenInput(fixture).required).toBe(true);
    expect(getHost(fixture).hasAttribute('aria-required')).toBe(false);
  });

  it('renders the label input as the headline', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.label.set('Drag your files');
    fixture.detectChanges();
    expect(getHost(fixture).textContent).toContain('Drag your files');
  });

  it('renders the description input', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.description.set('PDF up to 10MB');
    fixture.detectChanges();
    expect(getHost(fixture).textContent).toContain('PDF up to 10MB');
  });

  it('renders the custom triggerLabel', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.triggerLabel.set('Browse');
    fixture.detectChanges();
    const btn = getDropzone(fixture).querySelector('button');
    expect(btn?.textContent?.trim()).toContain('Browse');
  });

  it('assigns a unique host id by default', () => {
    const f1 = TestBed.createComponent(BasicHost);
    const f2 = TestBed.createComponent(BasicHost);
    f1.detectChanges();
    f2.detectChanges();
    expect(getHost(f1).id).not.toBe(getHost(f2).id);
  });

  it('uses the consumer-supplied id over the auto-generated one (#17)', () => {
    const fixture = TestBed.createComponent(IdOverrideHost);
    fixture.detectChanges();
    expect(getHost(fixture).id).toBe('custom-id');
  });
});

// ── 3. Outputs ───────────────────────────────────────────────────

describe('FileUploadComponent — outputs', () => {
  it('emits filesAdded on drop', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    const file = makeFile('a.txt', 10, 'text/plain');
    dispatchDragEvent(getDropzone(fixture), 'drop', [file]);
    fixture.detectChanges();
    expect(fixture.componentInstance.addedSpy).toHaveBeenCalledTimes(1);
    const call = fixture.componentInstance.addedSpy.mock.calls[0][0] as FileUploadItem[];
    expect(call.length).toBe(1);
    expect(call[0].file.name).toBe('a.txt');
  });

  it('emits fileRejected with reason "accept"', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.accept.set('image/*');
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.rejectedSpy).toHaveBeenCalledTimes(1);
    const rej = fixture.componentInstance.rejectedSpy.mock.calls[0][0] as FileUploadRejection;
    expect(rej.reason).toBe('accept');
    expect(rej.message).toContain('file type');
  });

  it('emits fileRemoved when remove() is called', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const item = fixture.componentInstance.upload().items()[0];
    fixture.componentInstance.upload().remove(item.id);
    fixture.detectChanges();
    expect(fixture.componentInstance.removedSpy).toHaveBeenCalledWith(item);
  });

  it('moves focus to the trigger button after the last item is removed (H1 focus retarget)', async () => {
    // The dropzone lost its tabindex (no longer a focusable control), so focus
    // restoration after the last remove must land on the keyboard-operable
    // trigger button, not the now-unfocusable dropzone div.
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const focusSpy = vi.spyOn(getTriggerButton(fixture), 'focus');
    const item = fixture.componentInstance.upload().items()[0];
    fixture.componentInstance.upload().remove(item.id);
    fixture.detectChanges();
    await fixture.whenStable(); // flush the queueMicrotask focus restore
    expect(focusSpy).toHaveBeenCalled();
  });

  it('delegates form-field container-click focus to the trigger button (H1 focus retarget)', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const focusSpy = vi.spyOn(getTriggerButton(fixture), 'focus');
    // A click outside the dropzone region (null target) routes focus to the control.
    fixture.componentInstance.upload().onContainerClick(new MouseEvent('click'));
    expect(focusSpy).toHaveBeenCalled();
  });

  it('emits cleared when clear() is called', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    fixture.componentInstance.upload().clear();
    fixture.detectChanges();
    expect(fixture.componentInstance.clearedSpy).toHaveBeenCalledTimes(1);
  });

  it('does not emit filesAdded / fileRemoved / cleared on writeValue (#14)', () => {
    const fixture = TestBed.createComponent(ReactiveSpyHost);
    fixture.detectChanges();
    // setValue() routes through writeValue — a programmatic value sync, not a
    // user gesture, so none of the action outputs may fire.
    fixture.componentInstance.control.setValue([makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(1);
    expect(fixture.componentInstance.addedSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.removedSpy).not.toHaveBeenCalled();
    expect(fixture.componentInstance.clearedSpy).not.toHaveBeenCalled();
  });
});

// ── 4. Drag-drop ─────────────────────────────────────────────────

describe('FileUploadComponent — drag-drop', () => {
  it('flips isDragging on dragenter', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'dragenter', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().isDragging()).toBe(true);
  });

  it('uses counter pattern: child traversal does not flip dragging off', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const dz = getDropzone(fixture);
    dispatchDragEvent(dz, 'dragenter', [makeFile('a.txt', 10, 'text/plain')]);
    dispatchDragEvent(dz, 'dragenter', [makeFile('a.txt', 10, 'text/plain')]);
    dispatchDragEvent(dz, 'dragleave', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().isDragging()).toBe(true);
  });

  it('drop resets isDragging and adds the files', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'dragenter', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().isDragging()).toBe(false);
    expect(fixture.componentInstance.upload().items().length).toBe(1);
  });

  it('dragover calls preventDefault for file drags', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const event = dispatchDragEvent(getDropzone(fixture), 'dragover', [
      makeFile('a.txt', 10, 'text/plain'),
    ]);
    expect(event.defaultPrevented).toBe(true);
  });

  it('drag is ignored when disabled', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(0);
  });
});

// ── 5. Selection via native input ────────────────────────────────

describe('FileUploadComponent — selection via native input', () => {
  it('open() clicks the hidden input', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const input = getHiddenInput(fixture);
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    fixture.componentInstance.upload().open();
    expect(clickSpy).toHaveBeenCalled();
  });

  it('open() is a no-op when disabled', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.disabled.set(true);
    fixture.detectChanges();
    const input = getHiddenInput(fixture);
    const clickSpy = vi.spyOn(input, 'click').mockImplementation(() => {});
    fixture.componentInstance.upload().open();
    expect(clickSpy).not.toHaveBeenCalled();
  });

  it('selecting a file via change event adds it', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    const input = getHiddenInput(fixture);
    setInputFiles(input, [makeFile('a.txt', 10, 'text/plain')]);
    input.dispatchEvent(new Event('change'));
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(1);
  });
});

// ── 6. Validation ────────────────────────────────────────────────

describe('FileUploadComponent — validation', () => {
  it('rejects with reason "accept" when MIME does not match image/*', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.accept.set('image/*');
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const rej = fixture.componentInstance.rejectedSpy.mock.calls[0][0] as FileUploadRejection;
    expect(rej.reason).toBe('accept');
    expect(fixture.componentInstance.upload().items().length).toBe(0);
  });

  it('accepts .pdf extension match', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.accept.set('.pdf');
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('doc.pdf', 10, '')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(1);
  });

  it('rejects with reason "size" when file exceeds maxSize', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.maxSize.set(1024);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('big.bin', 2048, 'application/octet-stream')]);
    fixture.detectChanges();
    const rej = fixture.componentInstance.rejectedSpy.mock.calls[0][0] as FileUploadRejection;
    expect(rej.reason).toBe('size');
  });

  it('rejects with reason "count" when maxFiles is reached', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.componentInstance.maxFiles.set(2);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [
      makeFile('a.txt', 1, 'text/plain'),
      makeFile('b.txt', 1, 'text/plain'),
      makeFile('c.txt', 1, 'text/plain'),
    ]);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(2);
    const rej = fixture.componentInstance.rejectedSpy.mock.calls[0][0] as FileUploadRejection;
    expect(rej.reason).toBe('count');
  });

  it('replaces existing file when multiple is false', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('b.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const items = fixture.componentInstance.upload().items();
    expect(items.length).toBe(1);
    expect(items[0].file.name).toBe('b.txt');
  });
});

// ── 7. CVA contract ──────────────────────────────────────────────

describe('FileUploadComponent — CVA', () => {
  it('writeValue([file]) populates items()', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    const file = makeFile('a.txt', 10, 'text/plain');
    fixture.componentInstance.control.setValue([file]);
    fixture.detectChanges();
    const items = fixture.componentInstance.upload().items();
    expect(items.length).toBe(1);
    expect(items[0].file).toBe(file);
    expect(items[0].progress).toBe(0);
    expect(items[0].status).toBe('pending');
  });

  it('writeValue(null) clears items', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue([makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue(null);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(0);
  });

  it('user drop triggers onChange with File[]', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const value = fixture.componentInstance.control.value;
    expect(Array.isArray(value)).toBe(true);
    expect(value!.length).toBe(1);
  });

  it('setDisabledState reflects to aria-disabled', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.disable();
    fixture.detectChanges();
    expect(getHost(fixture).getAttribute('aria-disabled')).toBe('true');
  });

  it('works with template-driven ngModel', async () => {
    const fixture = TestBed.createComponent(TemplateDrivenHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.value?.length).toBe(1);
  });

  it('works with signal forms ([formField])', () => {
    const fixture = TestBed.createComponent(SignalFormHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const value = fixture.componentInstance.uploadForm.files().value();
    expect(value?.length).toBe(1);
  });
});

// ── 8. Programmatic API ──────────────────────────────────────────

describe('FileUploadComponent — programmatic API', () => {
  it('remove(id) removes the item and updates value', () => {
    const fixture = TestBed.createComponent(ReactiveHost);
    fixture.detectChanges();
    fixture.componentInstance.control.setValue([
      makeFile('a.txt', 10, 'text/plain'),
      makeFile('b.txt', 10, 'text/plain'),
    ]);
    fixture.detectChanges();
    const item = fixture.componentInstance.upload().items()[0];
    fixture.componentInstance.upload().remove(item.id);
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(1);
  });

  it('remove(unknown) is a no-op', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    fixture.componentInstance.upload().remove('does-not-exist');
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(1);
  });

  it('clear() empties the list', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [
      makeFile('a.txt', 1, 'text/plain'),
      makeFile('b.txt', 1, 'text/plain'),
    ]);
    fixture.detectChanges();
    fixture.componentInstance.upload().clear();
    fixture.detectChanges();
    expect(fixture.componentInstance.upload().items().length).toBe(0);
  });

  it('setItemProgress clamps to 0–100', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const id = fixture.componentInstance.upload().items()[0].id;
    fixture.componentInstance.upload().setItemProgress(id, 150);
    expect(fixture.componentInstance.upload().items()[0].progress).toBe(100);
    fixture.componentInstance.upload().setItemProgress(id, -10);
    expect(fixture.componentInstance.upload().items()[0].progress).toBe(0);
    fixture.componentInstance.upload().setItemProgress(id, 42);
    expect(fixture.componentInstance.upload().items()[0].progress).toBe(42);
  });

  it('setItemStatus updates status and error', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    const id = fixture.componentInstance.upload().items()[0].id;
    fixture.componentInstance.upload().setItemStatus(id, 'error', 'boom');
    fixture.detectChanges();
    const item = fixture.componentInstance.upload().items()[0];
    expect(item.status).toBe('error');
    expect(item.error).toBe('boom');
  });
});

// ── 9. Accessibility ─────────────────────────────────────────────

describe('FileUploadComponent — accessibility', () => {
  it('reflects aria-label to host', () => {
    const fixture = TestBed.createComponent(AriaLabelHost);
    fixture.detectChanges();
    expect(getHost(fixture).getAttribute('aria-label')).toBe('Pick files');
  });

  it('standalone: merges the internal descriptionId into aria-describedby alongside the external id (#16)', () => {
    const fixture = TestBed.createComponent(StandaloneAriaHost);
    fixture.detectChanges();
    const host = getHost(fixture);
    const describedby = (host.getAttribute('aria-describedby') ?? '').split(/\s+/).filter(Boolean);
    expect(describedby).toContain('ext-desc');
    expect(describedby).toContain(fixture.componentInstance.upload().descriptionId);
  });

  it('exposes the description on the focusable trigger button, not only the group (H1 regression guard)', () => {
    // The dropzone (which used to carry aria-describedby) is no longer focusable;
    // the trigger button is. A description on the group does NOT propagate to a
    // child control, so the button must reference the description ids itself.
    const fixture = TestBed.createComponent(StandaloneAriaHost);
    fixture.detectChanges();
    const describedby = (getTriggerButton(fixture).getAttribute('aria-describedby') ?? '')
      .split(/\s+/)
      .filter(Boolean);
    expect(describedby).toContain('ext-desc');
    expect(describedby).toContain(fixture.componentInstance.upload().descriptionId);
  });

  it('standalone: mirrors the external aria-labelledby id to the host (#16)', () => {
    const fixture = TestBed.createComponent(StandaloneAriaHost);
    fixture.detectChanges();
    const labelledby = (getHost(fixture).getAttribute('aria-labelledby') ?? '')
      .split(/\s+/)
      .filter(Boolean);
    expect(labelledby).toContain('ext-label');
  });

  it('exposes a native <button> as the keyboard control (PIN H1)', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    // Keyboard operability now lives on the native trigger <button> — a real
    // button is Enter/Space-activatable by the browser, so clicking it (the
    // synthesized result of those keys) must open the picker.
    const btn = getTriggerButton(fixture);
    expect(btn.tagName).toBe('BUTTON');
    expect(btn.type).toBe('button');
    const openSpy = vi.spyOn(fixture.componentInstance.upload(), 'open');
    btn.click();
    expect(openSpy).toHaveBeenCalled();
  });

  it('trigger click does not double-fire dropzone click', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    const openSpy = vi.spyOn(fixture.componentInstance.upload(), 'open');
    const btn = getTriggerButton(fixture);
    btn.click();
    expect(openSpy).toHaveBeenCalledTimes(1);
  });

  it('shows a focus-visible ring on the keyboard control — the trigger button (#18)', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    // The dropzone is no longer focusable, so the visible focus indicator must
    // live on the element that actually receives focus: the trigger <button>.
    expect(getTriggerButton(fixture).className).toContain('focus-visible:outline-primary-500');
  });

  it('renders remove buttons with aria-label "Remove {name}"', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.multiple.set(true);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('photo.png', 10, 'image/png')]);
    fixture.detectChanges();
    const removeBtn = getHost(fixture).querySelector('[data-tw-file-upload-remove]');
    expect(removeBtn?.getAttribute('aria-label')).toBe('Remove photo.png');
  });

  it('announces accepted files via LiveAnnouncer', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(liveAnnouncerSpy.announce).toHaveBeenCalledWith(
      expect.stringContaining('1 file added'),
      'polite',
    );
  });

  // As above: `aria-invalid` is not allowed on `role="group"`. It goes on the
  // hidden file input, which is the control carrying the value.
  it('sets aria-invalid on the hidden file input, not on the group host', async () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    fixture.componentInstance.control.markAsTouched();
    fixture.componentInstance.control.updateValueAndValidity();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(getHiddenInput(fixture).getAttribute('aria-invalid')).toBe('true');
    expect(getHost(fixture).hasAttribute('aria-invalid')).toBe(false);
  });
});

// ── 10. Form-field integration ───────────────────────────────────

describe('FileUploadComponent — form-field integration', () => {
  it('does not break value flow when wrapped in tw-form-field', () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.componentInstance.control.value?.length).toBe(1);
  });

  it("appends tw-form-field-type-file-upload to the form-field host", () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const ff = fixture.nativeElement.querySelector('tw-form-field') as HTMLElement;
    expect(ff.className).toContain('tw-form-field-type-file-upload');
  });

  it("propagates form-field's setDescribedByIds to the host", () => {
    const fixture = TestBed.createComponent(FormFieldHost);
    fixture.detectChanges();
    const describedby = getHost(fixture).getAttribute('aria-describedby');
    expect(describedby).toBeTruthy();
    // Hint id should be present in the merged list.
    const hint = fixture.nativeElement.querySelector('[twHint]') as HTMLElement;
    expect(describedby!.split(/\s+/)).toContain(hint.id);
  });
});

// ── 11. State / variants smoke ───────────────────────────────────

describe('FileUploadComponent — state variants', () => {
  it('dragging-valid: dropzone gets primary border', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'dragenter', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(getDropzone(fixture).className).toContain('border-primary-500');
  });

  it("variant='soft': dropzone has surface-muted background", () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.componentInstance.variant.set('soft');
    fixture.detectChanges();
    expect(getDropzone(fixture).className).toContain('bg-surface-muted');
  });

  // Theme adaptation is owned by the slot tokens, exactly as `alert`,
  // `tab-nav` and `segmented-control` already assert. This component was the
  // sole exception: its drag-over states carried the library's ONLY two `dark:`
  // utilities, and both were inverted. `theme/_dark.css` already remaps
  // `--color-primary-50` onto `blue-950`, so `bg-primary-soft` IS the dark
  // wash; the `dark:bg-primary-900/20` override on top resolved to `blue-100`,
  // near-white, and flashed the dropzone bright on drag-over.
  it('should never emit `dark:` overrides on the drag-over states', () => {
    const fixture = TestBed.createComponent(BasicHost);
    fixture.detectChanges();

    for (const [type, file] of [
      ['dragenter', makeFile('a.txt', 10, 'text/plain')],
      ['dragenter', makeFile('big.txt', 10_000_000, 'text/plain')],
    ] as const) {
      dispatchDragEvent(getDropzone(fixture), type, [file]);
      fixture.detectChanges();
      expect(getDropzone(fixture).className).not.toMatch(/\bdark:/);
    }
  });
});

// ── 12. Custom item template ─────────────────────────────────────

describe('FileUploadComponent — custom item template', () => {
  it('overrides the default row with the projected template', () => {
    const fixture = TestBed.createComponent(CustomItemHost);
    fixture.detectChanges();
    dispatchDragEvent(getDropzone(fixture), 'drop', [makeFile('a.txt', 10, 'text/plain')]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('[data-testid="custom-row"]')).toBeTruthy();
  });
});

// ── 12b. Content projection ──────────────────────────────────────

describe('FileUploadComponent — content projection', () => {
  it('renders projected icon / headline / description content (#4)', () => {
    const fixture = TestBed.createComponent(ProjectionHost);
    fixture.detectChanges();
    const host = getHost(fixture);
    expect(host.querySelector('[data-testid="proj-icon"]')).toBeTruthy();
    expect(host.textContent).toContain('My headline');
    expect(host.textContent).toContain('My description');
  });

  it('renders the headline fallback when no label and no description are set (#4)', () => {
    const fixture = TestBed.createComponent(FallbackHost);
    fixture.detectChanges();
    expect(getHost(fixture).textContent).toContain('Drag files here or click to browse');
  });
});

// ── 13. Class merging ────────────────────────────────────────────

describe('FileUploadComponent — class merging', () => {
  it('preserves consumer-supplied class alongside internal classes', () => {
    const fixture = TestBed.createComponent(ClassMergeHost);
    fixture.detectChanges();
    const cls = getHost(fixture).className;
    expect(cls).toContain('my-custom-class');
    expect(cls).toContain('flex');
  });
});
