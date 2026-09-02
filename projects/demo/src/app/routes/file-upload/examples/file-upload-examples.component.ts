import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  linkedSignal,
  signal,
  viewChild,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  FileUploadComponent,
  FileUploadItemDirective,
  type FileUploadItem,
  type FileUploadVariant,
} from '@cdevhub/ngx-tw/file-upload';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwSize } from '@cdevhub/ngx-tw/core';

const VARIANTS: FileUploadVariant[] = ['outline', 'soft'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const ACCEPT_PRESETS = [
  { label: 'any', value: undefined },
  { label: 'images', value: 'image/*' },
  { label: 'PDFs', value: '.pdf,application/pdf' },
  { label: 'CSV', value: '.csv' },
] as const;

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB'];
  let v = bytes;
  let i = -1;
  while (v >= 1024 && i < units.length - 1) {
    v /= 1024;
    i++;
  }
  return `${v < 10 ? v.toFixed(1) : Math.round(v)} ${units[i]}`;
}

@Component({
  selector: 'app-file-upload-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FileUploadComponent,
    FileUploadItemDirective,
    ButtonDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    IconComponent,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input controls the drop zone's resting style.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        renders a dashed border on a transparent background — the canonical
        drop-zone affordance that reads as "drop something here". Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        when the upload sits next to other filled controls and a transparent zone
        would look out of place; the muted surface tones it down without losing the
        dropzone identity.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          @for (v of variants; track v) {
            <div class="space-y-2">
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <tw-file-upload
                [variant]="v"
                [label]="'Variant: ' + v"
                description="Drop a file or click to browse."
                [aria-label]="'Variant ' + v"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls drop-zone padding, headline typography, and the size of the
        illustration glyph. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for compact form rows where the upload sits alongside other inputs; reach
        for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        when the drop zone is the primary focus of the screen (a standalone
        attachment step, an import flow).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ s }}</p>
              <tw-file-upload
                [size]="s"
                label="Drop a file"
                description="Click to browse."
                [aria-label]="'Size ' + s"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The drop zone supports the standard form-control states. A disabled upload
        blocks every interaction — click, keyboard, and drop — and applies muted
        styling.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        surfaces through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        on the host and pairs with a wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        for a visible asterisk and an error region driven by Angular validators.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
            <tw-file-upload
              [disabled]="true"
              label="Upload locked"
              description="Sign in to upload."
            />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
            <tw-file-upload
              [required]="true"
              label="Attachments"
              description="At least one file is required."
              aria-label="Required attachments"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Validation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Validation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Validation is built in through three inputs.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accept</code>
        uses native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input accept&gt;</code>
        syntax — MIME types
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">image/*</code>),
        explicit types
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">application/pdf</code>),
        or extensions
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">.csv</code>).
        Files that fail any rule never reach
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>;
        instead they fire a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fileRejected</code>
        event with a human-readable message and are announced through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          multiple
          accept="image/*,.pdf"
          [maxSize]="5 * 1024 * 1024"
          [maxFiles]="3"
          label="Attachments"
          description="PDF or image, up to 5 MB each. Maximum 3 files."
          (fileRejected)="onRejected($event)"
        />
        @if (rejections().length) {
          <div class="mt-4 rounded-md border border-error-300 bg-error-50 p-3">
            <p class="text-xs font-semibold text-error-800 mb-1">Rejected files</p>
            <ul class="text-xs text-error-700 space-y-1">
              @for (r of rejections(); track $index) {
                <li>{{ r }}</li>
              }
            </ul>
          </div>
        }
      </div>
      <tw-code-block [code]="validationSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Built-in rejections do not flow through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgControl.errors</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twError match="size"]</code>
        will not fire for them. Use Angular
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validator</code>s
        on the bound control for error-key-driven UI (cross-field rules, async
        checks).
      </p>
    </section>

    <!-- Template-driven forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The component implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works out of the box. The model is always a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">File[]</code> —
        even in single-file mode — which removes branching from consumer code.
        Programmatic clears flow back into the model.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          name="attachmentsTd"
          multiple
          [(ngModel)]="tdFiles"
          label="Attachments"
          description="Template-driven binding."
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">ngModel = {{ tdSummary() }}</p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>;
        the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>,
        and touched flags stay in sync. Toggling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable()</code>
        on the control blocks every interaction without an explicit
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          multiple
          [formControl]="reactiveCtrl"
          label="Attachments"
          description="Reactive forms binding."
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          control.value = {{ reactiveCtrl.value?.length ?? 0 }} files ·
          disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="reactiveCtrl.reset()">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="toggleDisabled()">
            {{ reactiveCtrl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and bind a field with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        so you can drive UI without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          multiple
          [formField]="signalForm.files"
          label="Attachments"
          description="Signal forms binding."
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = {{ signalForm.files().value()?.length ?? 0 }} files ·
          touched = {{ signalForm.files().touched() }} ·
          valid = {{ signalForm.files().valid() }}
        </p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Inside form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside form-field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Wrap the upload in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        to get an external label, hint, and error region. The form-field merges its
        hint/error ids into the upload's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        automatically, and pairs the bound validator's error key with any projected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twError match="…"]</code>
        message.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md">
          <tw-form-field>
            <label twLabel>Supporting documents</label>
            <tw-file-upload
              multiple
              accept=".pdf,image/*"
              [formControl]="formFieldCtrl"
            />
            <span twHint>PDF or image, up to 10 MB each.</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Custom item template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom item template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twFileUploadItem</code>
        template to replace each row entirely — render image thumbnails, embed file
        metadata, or compose with other library components. The template context
        exposes the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FileUploadItem</code>
        as both
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">item</code>,
        and a template reference (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">#u="twFileUpload"</code>)
        exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">remove(id)</code>
        and the rest of the imperative API.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          #thumbUpload="twFileUpload"
          multiple
          accept="image/*"
          label="Add product images"
          description="JPG, PNG, or WEBP. We'll generate a quick preview."
        >
          <ng-template twFileUploadItem let-item>
            <div class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-muted">
              @if (thumbnailFor(item.id); as src) {
                <img [src]="src" alt="" class="size-12 rounded-md object-cover shrink-0 border border-border" />
              } @else {
                <div class="size-12 rounded-md bg-surface-muted flex items-center justify-center shrink-0">
                  <tw-icon name="image" size="md" class="text-fg-muted" aria-hidden="true" />
                </div>
              }
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-fg truncate">{{ item.file.name }}</p>
                <p class="text-xs text-fg-muted">{{ formatSize(item.file.size) }} · {{ item.file.type || 'image' }}</p>
              </div>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="sm"
                [attr.aria-label]="'Remove ' + item.file.name"
                (click)="thumbUpload.remove(item.id)"
              >
                <tw-icon twButtonIcon name="x" />
              </button>
            </div>
          </ng-template>
        </tw-file-upload>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="customItemTsSnippet" language="ts" />
        <tw-code-block [code]="customItemHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Object URLs from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">URL.createObjectURL</code>
        must be released to avoid leaks. The example tracks each URL by item id and
        revokes it on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fileRemoved</code>,
        on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cleared</code>,
        and in the host's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DestroyRef.onDestroy</code>.
      </p>
    </section>

    <!-- Per-item progress simulation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Per-item progress &amp; status</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Progress and status are imperative:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setItemProgress(id, percent)</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setItemStatus(id, status, error?)</code>.
        Wire them to your real upload pipeline's progress events. The example below
        simulates an upload sequence — every file climbs to 100% over a few seconds
        and the second file ends in error to show the failure state.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          #progressUpload="twFileUpload"
          multiple
          label="Drop files to simulate an upload"
          description="The first file succeeds; the second fails on purpose."
          (filesAdded)="onProgressAdded($event[0].id)"
        />
        <div class="flex gap-2 mt-3">
          <button twButton variant="solid" color="primary" size="sm"
                  [disabled]="progressUpload.items().length === 0"
                  (click)="simulateUpload(progressUpload)">
            Simulate upload
          </button>
          <button twButton variant="outline" color="neutral" size="sm"
                  (click)="progressUpload.clear()">
            Clear
          </button>
        </div>
      </div>
      <tw-code-block [code]="progressSnippet" language="ts" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">multiple</code>
        with a restrictive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accept</code>
        to see how rejections appear in the announce region, or pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        with a small size for a compact form-row variant.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-3">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playVariant() === v"
                        [class.!text-primary-700]="playVariant() === v"
                        (click)="playVariant.set(v)">{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playSize() === s"
                        [class.!text-primary-700]="playSize() === s"
                        (click)="playSize.set(s)">{{ s }}</button>
              }
            </div>
          </div>
        </div>
        <div class="flex flex-wrap gap-4 mb-6 border-t border-border-muted pt-3 mt-3">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Accept</label>
            <div class="flex gap-1">
              @for (a of acceptPresets; track a.label) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playAcceptLabel() === a.label"
                        [class.!text-primary-700]="playAcceptLabel() === a.label"
                        (click)="setAccept(a.label, a.value)">{{ a.label }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Behavior</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playMultiple()"
                      [class.!text-primary-700]="playMultiple()"
                      (click)="playMultiple.update(v => !v)">multiple</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playRequired()"
                      [class.!text-primary-700]="playRequired()"
                      (click)="playRequired.update(v => !v)">required</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-file-upload
            [variant]="playVariant()"
            [size]="playSize()"
            [multiple]="playMultiple()"
            [accept]="playAccept()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            label="Drop files here"
            description="Playground"
            aria-label="Playground"
          />
        </div>
      </div>
    </section>
  `,
})
export class FileUploadExamples {
  private readonly destroyRef = inject(DestroyRef);

  protected readonly variants = VARIANTS;
  protected readonly sizes = SIZES;
  protected readonly acceptPresets = ACCEPT_PRESETS;

  // ── States demo ──
  protected readonly rejections = signal<string[]>([]);

  protected onRejected(rej: { file: File; reason: string; message: string }): void {
    this.rejections.update((list) => [...list, rej.message].slice(-3));
  }

  // ── Form bindings ──
  protected readonly tdFiles = signal<File[] | null>(null);
  protected readonly reactiveCtrl = new FormControl<File[] | null>(null);
  protected readonly signalModel = signal<{ files: File[] | null }>({ files: null });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.files);
  });
  protected readonly formFieldCtrl = new FormControl<File[] | null>(null);

  protected tdSummary(): string {
    const v = this.tdFiles();
    return v && v.length ? `${v.length} files` : 'null';
  }

  protected toggleDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // ── Custom item template (thumbnail demo) ──
  // Cache object URLs per item id; revoke on remove/clear/destroy to avoid leaks.
  // `linkedSignal` reconciles the URL map against `upload.items()` — the previous
  // map carries forward, new image items mint a URL, departed items release theirs.
  // No effect = no cycle.
  private readonly thumbUpload = viewChild<FileUploadComponent>('thumbUpload');

  protected readonly thumbnails = linkedSignal<
    readonly FileUploadItem[],
    ReadonlyMap<string, string>
  >({
    source: () => this.thumbUpload()?.items() ?? [],
    computation: (items, previous) => {
      const prev = previous?.value ?? new Map<string, string>();
      const next = new Map(prev);
      const keep = new Set<string>();
      for (const item of items) {
        keep.add(item.id);
        if (!next.has(item.id) && item.file.type.startsWith('image/')) {
          next.set(item.id, URL.createObjectURL(item.file));
        }
      }
      for (const [id, url] of prev) {
        if (!keep.has(id)) {
          URL.revokeObjectURL(url);
          next.delete(id);
        }
      }
      return next;
    },
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const url of this.thumbnails().values()) URL.revokeObjectURL(url);
    });
  }

  protected thumbnailFor(id: string): string | undefined {
    return this.thumbnails().get(id);
  }

  protected formatSize(bytes: number): string {
    return humanSize(bytes);
  }

  // ── Progress simulation ──
  private firstItemId = '';

  protected onProgressAdded(firstId: string): void {
    this.firstItemId = firstId;
  }

  protected simulateUpload(upload: FileUploadComponent): void {
    const items = upload.items();
    items.forEach((item, idx) => {
      let p = 0;
      // Second file (idx === 1) fails at 70% to showcase the error state.
      const failsHere = idx === 1;
      const tick = (): void => {
        p = Math.min(100, p + 10 + Math.random() * 15);
        upload.setItemStatus(item.id, 'uploading');
        upload.setItemProgress(item.id, p);
        if (failsHere && p >= 70) {
          upload.setItemStatus(item.id, 'error', '413 Payload too large');
          return;
        }
        if (p >= 100) {
          upload.setItemStatus(item.id, 'success');
          return;
        }
        setTimeout(tick, 250 + Math.random() * 350);
      };
      setTimeout(tick, 150 * idx);
    });
  }

  // ── Playground ──
  protected readonly playVariant = signal<FileUploadVariant>('outline');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playMultiple = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playAcceptLabel = signal<string>('any');
  protected readonly playAccept = signal<string | undefined>(undefined);

  protected setAccept(label: string, value: string | undefined): void {
    this.playAcceptLabel.set(label);
    this.playAccept.set(value);
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-file-upload
    [variant]="v"
    [label]="'Variant: ' + v"
    description="Drop a file or click to browse."
  />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-file-upload
    [size]="s"
    label="Drop a file"
    description="Click to browse."
  />
}`.trim();

  protected readonly statesSnippet = `
<tw-file-upload
  [disabled]="true"
  label="Upload locked"
  description="Sign in to upload."
/>

<tw-file-upload
  [required]="true"
  label="Attachments"
  description="At least one file is required."
/>`.trim();

  protected readonly validationSnippet = `
<tw-file-upload
  multiple
  accept="image/*,.pdf"
  [maxSize]="5 * 1024 * 1024"
  [maxFiles]="3"
  label="Attachments"
  description="PDF or image, up to 5 MB each. Maximum 3 files."
  (fileRejected)="onRejected($event)"
/>`.trim();

  protected readonly tdTsSnippet = `protected readonly tdFiles = signal<File[] | null>(null);`;

  protected readonly tdHtmlSnippet = `
<tw-file-upload
  name="attachmentsTd"
  multiple
  [(ngModel)]="tdFiles"
  label="Attachments"
/>`.trim();

  protected readonly reactiveTsSnippet = `protected readonly reactiveCtrl = new FormControl<File[] | null>(null);`;

  protected readonly reactiveHtmlSnippet = `
<tw-file-upload
  multiple
  [formControl]="reactiveCtrl"
  label="Attachments"
/>`.trim();

  protected readonly signalTsSnippet = `
protected readonly signalModel = signal<{ files: File[] | null }>({ files: null });
protected readonly signalForm = form(this.signalModel, (p) => {
  required(p.files);
});`.trim();

  protected readonly signalHtmlSnippet = `
<tw-file-upload
  multiple
  [formField]="signalForm.files"
  label="Attachments"
/>`.trim();

  protected readonly formFieldSnippet = `
<tw-form-field>
  <label twLabel>Supporting documents</label>
  <tw-file-upload multiple accept=".pdf,image/*" [formControl]="ctrl" />
  <span twHint>PDF or image, up to 10 MB each.</span>
</tw-form-field>`.trim();

  protected readonly customItemTsSnippet = `
// Mint a thumbnail URL per image item and revoke when the item disappears.
// linkedSignal reconciles the URL map against upload.items() — previous URLs
// carry forward, new image items mint a URL, removed items release theirs.
private readonly upload = viewChild<FileUploadComponent>('thumbUpload');

protected readonly thumbnails = linkedSignal<
  readonly FileUploadItem[],
  ReadonlyMap<string, string>
>({
  source: () => this.upload()?.items() ?? [],
  computation: (items, previous) => {
    const prev = previous?.value ?? new Map<string, string>();
    const next = new Map(prev);
    const keep = new Set<string>();
    for (const item of items) {
      keep.add(item.id);
      if (!next.has(item.id) && item.file.type.startsWith('image/')) {
        next.set(item.id, URL.createObjectURL(item.file));
      }
    }
    for (const [id, url] of prev) {
      if (!keep.has(id)) {
        URL.revokeObjectURL(url);
        next.delete(id);
      }
    }
    return next;
  },
});

constructor() {
  inject(DestroyRef).onDestroy(() => {
    for (const url of this.thumbnails().values()) URL.revokeObjectURL(url);
  });
}`.trim();

  protected readonly customItemHtmlSnippet = `
<tw-file-upload #u="twFileUpload" multiple accept="image/*"
  label="Add product images">
  <ng-template twFileUploadItem let-item>
    <div class="flex items-center gap-3 px-3 py-2 rounded-md hover:bg-surface-muted">
      @if (thumbnails().get(item.id); as src) {
        <img [src]="src" alt="" class="size-12 rounded-md object-cover" />
      } @else {
        <div class="size-12 rounded-md bg-surface-muted flex items-center justify-center">
          <tw-icon name="image" size="md" class="text-fg-muted" />
        </div>
      }
      <div class="flex-1 min-w-0">
        <p class="text-sm font-medium truncate">{{ '{{' }} item.file.name {{ '}}' }}</p>
      </div>
      <button twButton variant="ghost" color="neutral" size="sm"
              (click)="u.remove(item.id)">
        <tw-icon twButtonIcon name="x" />
      </button>
    </div>
  </ng-template>
</tw-file-upload>`.trim();

  protected readonly progressSnippet = `
// Wire to your real HTTP pipeline; this example simulates ticks.
simulateUpload(upload: FileUploadComponent): void {
  for (const item of upload.items()) {
    this.http.post('/upload', toFormData(item.file), {
      reportProgress: true,
      observe: 'events',
    }).subscribe({
      next: (event) => {
        if (event.type === HttpEventType.UploadProgress && event.total) {
          upload.setItemProgress(item.id, Math.round((event.loaded / event.total) * 100));
        } else if (event.type === HttpEventType.Response) {
          upload.setItemStatus(item.id, 'success');
        }
      },
      error: (err) => upload.setItemStatus(item.id, 'error', err.message),
    });
  }
}`.trim();
}
