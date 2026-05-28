import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-empty-state-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- EmptyStateComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">EmptyStateComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-empty-state</p>

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
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls overall spacing and icon scale.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EmptyStateVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'centered'</td>
              <td class="px-4 py-2 text-fg-muted">Layout style; 'centered' stacks children vertically, 'inline' arranges them horizontally for compact rows.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">title</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Primary heading text; projected *twEmptyStateTitle content takes precedence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Secondary descriptive text; projected *twEmptyStateDescription content takes precedence.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">titleLevel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EmptyStateTitleLevel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">3</td>
              <td class="px-4 py-2 text-fg-muted">Heading level used for the title element; matches native &lt;h1&gt;–&lt;h6&gt;.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Kind</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twEmptyStateIcon]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Attribute</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">Illustration; replaces the fallback &lt;tw-icon name="inbox"&gt; when projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twEmptyStateTitle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Structural</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">Custom title content rendered inside the dynamic heading wrapper; replaces the title input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twEmptyStateDescription</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Structural</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">Custom description content rendered inside a &lt;p&gt; wrapper; replaces the description input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twEmptyStateActions]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Attribute</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">Action buttons row; the projected element carries the row classes via host binding.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- EmptyStateIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">EmptyStateIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twEmptyStateIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marker directive applied to any element projected as the illustration slot. Carries no inputs or outputs; presence is detected via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">contentChild</code>
        so the component can suppress the fallback icon.
      </p>
    </section>

    <!-- EmptyStateTitleDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">EmptyStateTitleDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twEmptyStateTitle] (structural)</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that captures the projected template via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>.
        Use with the asterisk syntax:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span *twEmptyStateTitle&gt;…&lt;/span&gt;</code>.
        The component renders the captured template inside the dynamic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;hN&gt;</code>
        wrapper.
      </p>
    </section>

    <!-- EmptyStateDescriptionDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">EmptyStateDescriptionDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twEmptyStateDescription] (structural)</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that captures the projected template via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>.
        Use with the asterisk syntax:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span *twEmptyStateDescription&gt;…&lt;/span&gt;</code>.
        The component renders the captured template inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;p&gt;</code>
        wrapper.
      </p>
    </section>

    <!-- EmptyStateActionsDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">EmptyStateActionsDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twEmptyStateActions]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive that stamps the actions-row classes
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">flex flex-wrap items-center gap-2</code>,
        plus alignment per variant) on the projected element via host binding. Apply it to the container that holds your CTA buttons.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class EmptyStateApi {
  protected readonly typesSnippet = `type EmptyStateVariant = 'centered' | 'inline';

type EmptyStateTitleLevel = 1 | 2 | 3 | 4 | 5 | 6;

// Shared from 'ngx-tw/core':
type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
