import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FileUploadComponent, type FileUploadItem } from '@cdevhub/ngx-tw/file-upload';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-file-upload-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FileUploadComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The File Upload component lets users select one or more files via a button, a
        click on the drop zone, or by dragging files from the OS into the page. It
        owns selection, validation, drag-drop UX, and the per-file progress surface;
        the actual HTTP request stays in the consumer's hands so the component is
        compatible with any upload pipeline (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">HttpClient</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fetch</code>,
        S3 SDK, presigned uploads). The selected files flow through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        as a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">File[]</code>,
        so the same instance works with template-driven, reactive, and Angular v21
        signal forms — and integrates with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        for label, hint, and error chrome.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The host element exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>
        and the drop zone is a focusable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>
        with a visible focus ring. A hidden native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input type="file"&gt;</code>
        is the actual form control, so native form submission and assistive-tech
        recognition keep working. Selection, removal, validation, and per-item status
        transitions are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>,
        so users hear "3 files added", "report.pdf was rejected: exceeds 5 MB", or
        "report.pdf upload complete" without having to inspect the list manually.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the drop zone, then to the "Choose files" trigger, then to each per-file remove button in order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Opens the OS file picker when focus is on the drop zone or the trigger button. Space is preventDefaulted so the page does not scroll.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Drag &amp; drop</td>
              <td class="px-4 py-2 text-fg-muted">Dragging files from the desktop onto the drop zone highlights it in primary; dropping commits the files through the same validation path as the picker.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Remove button</td>
              <td class="px-4 py-2 text-fg-muted">Each row's remove button carries <code class="font-mono">aria-label="Remove {{ '{' }}filename{{ '}' }}"</code>; focus moves to the next remove button after removal, or back to the drop zone when the last item is removed.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-file-upload
          multiple
          accept="image/*,.pdf"
          label="Drop attachments or click to browse"
          description="Up to 10 MB per file."
          (filesAdded)="onAdded($event)"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ count() }} files</p>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Native HTML5 drag-and-drop with visual states for valid / invalid / dragging</li>
        <li>Built-in validation:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accept</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxSize</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxFiles</code>
        </li>
        <li>Per-item progress and status, driven by imperative
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setItemProgress</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setItemStatus</code>
        </li>
        <li>Composes
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-progress-bar</code>
          for inline upload progress per file
        </li>
        <li>Custom row rendering via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twFileUploadItem</code>
          template directive
        </li>
        <li>2 variants (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>) and 5 sizes</li>
        <li>Works with reactive forms, template-driven forms, and Angular v21 signal forms</li>
        <li>Integrates with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
          for label, hint, and error chrome
        </li>
        <li>Live announcements for add, remove, reject, status transitions, and clear</li>
        <li>Keyboard-operable drop zone with the canonical focus ring</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the upload to get a label, hint, and error region for the whole control.
        </li>
        <li>
          <a routerLink="/components/progress-bar" class="text-primary-600 hover:underline">Progress Bar</a>
          — the component rendered per row to visualise per-file upload progress.
        </li>
        <li>
          <a routerLink="/components/button" class="text-primary-600 hover:underline">Button</a>
          — the "Choose files" trigger and per-row remove control use the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twButton</code>
          directive.
        </li>
      </ul>
    </section>
  `,
})
export class FileUploadOverview {
  protected readonly count = signal(0);

  protected onAdded(items: FileUploadItem[]): void {
    this.count.update((c) => c + items.length);
  }

  protected readonly basicUsageSnippet = `<tw-file-upload
  multiple
  accept="image/*,.pdf"
  label="Drop attachments or click to browse"
  description="Up to 10 MB per file."
  (filesAdded)="onAdded($event)"
/>`;

  protected readonly importSnippet = `import { FileUploadComponent } from '@cdevhub/ngx-tw/file-upload';`;
}
