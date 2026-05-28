import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-tabs-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TabsComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TabsComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-tabs</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'underline' | 'enclosed' | 'pill'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'underline'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the visual style of the tab strip.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Sets the semantic color for active tab indicators and highlights.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls padding, font size, and icon size of tab triggers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">orientation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal' | 'vertical'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal'</td>
              <td class="px-4 py-2 text-fg-muted">Layout direction of the tab strip.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">fitted</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, tab triggers stretch to fill the available width equally.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Two-way bindings</h3>
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Value of the currently active tab; updates when the user selects a tab.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;string&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a closable tab's close button is clicked; payload is the tab's value.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TabComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TabComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-tab</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Unique identifier for this tab; used to match the active tab value.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Plain text label shown in the trigger; ignored when a custom trigger template is provided.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, the tab cannot be selected and is skipped by keyboard navigation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closable</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, a close button is rendered inside the tab trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">lazy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">When true, the tab's panel content is instantiated on first activation and kept alive.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- TabTriggerDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TabTriggerDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twTabTrigger]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-template</code>
        as the custom trigger content for its parent
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-tab</code>.
        When present it replaces the default label-only trigger. The template context
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">let-ctx</code>)
        exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{' }} active, disabled, value {{ '}' }}</code>.
      </p>
    </section>

    <!-- TabContentDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TabContentDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twTabContent]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-template</code>
        as the panel content for its parent
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-tab</code>.
        Required when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[lazy]="true"</code>
        so the template can be instantiated only on first activation.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class TabsApi {
  protected readonly typesSnippet = `type TabsVariant = 'underline' | 'enclosed' | 'pill';

type TwColor =
  | 'primary' | 'secondary' | 'accent' | 'neutral'
  | 'info'    | 'success'   | 'warning' | 'error';

type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';`;
}
