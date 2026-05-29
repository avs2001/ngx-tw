import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-file-upload-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- FileUploadComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">FileUploadComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-file-upload &nbsp;·&nbsp; ExportAs: twFileUpload</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">multiple</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, the user can select more than one file.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">accept</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Comma-separated list of accepted types using native <code class="font-mono">&lt;input accept&gt;</code> syntax (e.g. <code class="font-mono">'image/*,.pdf'</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Maximum size per file in bytes. Files larger than this are rejected with reason <code class="font-mono">'size'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxFiles</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Maximum total file count. Drops past this limit are rejected with reason <code class="font-mono">'count'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'outline' | 'soft'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'outline'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the drop zone container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls drop-zone padding, headline typography, and illustration scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, blocks file selection and applies muted styling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the control as required. Inferred from <code class="font-mono">Validators.required</code> on a bound <code class="font-mono">NgControl</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Headline text rendered inside the drop zone. Projected content takes precedence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Secondary text rendered under the label. Projected content takes precedence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">triggerLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Choose files'</td>
              <td class="px-4 py-2 text-fg-muted">Label rendered inside the trigger button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name applied to the host when no visible label is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Id of an external element that labels the control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Id of an external element that describes the control. Form-field merges its hint/error ids alongside.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional <code class="font-mono">name</code> attribute on the hidden <code class="font-mono">&lt;input type="file"&gt;</code> for native form submissions.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Id on the host element. Auto-generated as <code class="font-mono">tw-file-upload-N</code> when not provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the <code class="font-mono">ErrorStateMatcher</code>. Falls back to <code class="font-mono">TW_ERROR_STATE_MATCHER</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">filesAdded</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;FileUploadItem[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires once per add operation with the accepted items. Does not fire on <code class="font-mono">writeValue</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">fileRemoved</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;FileUploadItem&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a file is removed via the remove button or programmatic <code class="font-mono">remove()</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">fileRejected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;FileUploadRejection&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires for each file that failed validation during add.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cleared</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">OutputEmitterRef&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when all files are cleared at once via programmatic <code class="font-mono">clear()</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Opens the OS file picker. No-op when disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">remove</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string): void</td>
              <td class="px-4 py-2 text-fg-muted">Removes the item with the given id and emits <code class="font-mono">fileRemoved</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Removes all items and emits <code class="font-mono">cleared</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setItemProgress</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id: string, percent: number): void</td>
              <td class="px-4 py-2 text-fg-muted">Updates the per-item progress, clamped to 0–100. No-op when the id is unknown.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setItemStatus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(id, status, error?): void</td>
              <td class="px-4 py-2 text-fg-muted">Updates the per-item status and optional error message. Announces transitions through <code class="font-mono">LiveAnnouncer</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Read-only signals</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">items</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;readonly FileUploadItem[]&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Current items with their progress and status.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">isDragging</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;boolean&gt;</td>
              <td class="px-4 py-2 text-fg-muted">True while a valid file drag is over the drop zone.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">valueLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Convenience alias for <code class="font-mono">items().length</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- FileUploadItemDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">FileUploadItemDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twFileUploadItem]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Structural directive that captures a template used to render each row.
        Apply with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twFileUploadItem="let item"</code>
        to override the default row entirely. The template context exposes the
        current <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FileUploadItem</code>
        as both
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">item</code>.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class FileUploadApi {
  protected readonly typesSnippet = `type FileUploadStatus = 'pending' | 'uploading' | 'success' | 'error';

type FileUploadVariant = 'outline' | 'soft';

type FileUploadRejectionReason = 'accept' | 'size' | 'count';

interface FileUploadItem {
  readonly id: string;
  readonly file: File;
  readonly progress: number;
  readonly status: FileUploadStatus;
  readonly error?: string;
}

interface FileUploadRejection {
  readonly file: File;
  readonly reason: FileUploadRejectionReason;
  readonly message: string;
}`;
}
