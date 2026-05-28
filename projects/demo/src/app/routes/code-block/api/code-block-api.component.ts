import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-code-block-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CodeBlockComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CodeBlockComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-code-block</p>

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
              <td class="px-4 py-2 font-mono text-xs">code</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">The code string to display and copy to clipboard.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">language</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional language label displayed in the header (e.g. 'TypeScript', 'HTML').</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CodeBlockVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'filled'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the container.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">wrap</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, wraps long lines instead of horizontal scrolling.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CodeBlockLabels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Localizable strings for the copy button aria-labels and the screen-reader announcement. Partial override; missing fields use English defaults.</td>
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
              <td class="px-4 py-2 font-mono text-xs">copied</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">void</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the code is successfully copied to clipboard.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Content Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Directive</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCodeBlockHeader]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CodeBlockHeaderDirective</td>
              <td class="px-4 py-2 text-fg-muted">Projects content into the header alongside the language label (e.g. filename, status pill, secondary actions).</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>

    <!-- Accessibility -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          Code region has
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code> and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="0"</code> for keyboard scrolling
        </li>
        <li>
          Dynamic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
          on code region: "&lcub;language&rcub; code" or "Code"
        </li>
        <li>
          Copy button has dynamic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>: "Copy code" / "Copied"
          (override via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code> input)
        </li>
        <li>
          Screen reader announcement via CDK
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code> on copy
        </li>
        <li>
          All icons marked
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>
        </li>
      </ul>
    </section>
  `,
})
export class CodeBlockApi {
  protected readonly typesSnippet = `type CodeBlockVariant = 'filled' | 'outlined';

interface CodeBlockLabels {
  /** aria-label for the copy button in its resting state. Default: 'Copy code'. */
  copy?: string;
  /** aria-label for the copy button after a successful copy. Default: 'Copied'. */
  copied?: string;
  /** Text passed to LiveAnnouncer after a successful copy. Default: 'Copied to clipboard'. */
  announcement?: string;
}`;
}
