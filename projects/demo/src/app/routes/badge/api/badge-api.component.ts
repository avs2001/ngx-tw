import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-badge-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">BadgeComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twBadge] · Exported as: twBadge</p>

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
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">BadgeVariant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'soft'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the visual style of the badge.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'neutral'</td>
              <td class="px-4 py-2 text-fg-muted">Sets the semantic color palette.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls padding, font size, and leading-element size.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">pill</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders fully rounded corners instead of the default rounded-md.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dismissible</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders a trailing dismiss button that emits the dismissed event.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dot</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, renders a standalone colored dot with no label or padding.</td>
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
              <td class="px-4 py-2 font-mono text-xs">dismissed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the dismiss button is clicked.</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tw-icon</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Projects a leading icon; the badge detects it and reserves space automatically.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">tw-avatar</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Projects a leading avatar; takes precedence over icon when both are present.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">(default)</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Badge label content; omitted when dot is true.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class BadgeApi {
  protected readonly typesSnippet = `type BadgeVariant = 'solid' | 'outline' | 'soft';

type TwColor =
  | 'primary' | 'secondary' | 'accent' | 'neutral'
  | 'info'    | 'success'   | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
