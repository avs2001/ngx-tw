import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-command-palette-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- CommandPaletteComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-command-palette</p>

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
              <td class="px-4 py-2 text-fg-muted">Controls item density and padding across the palette.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Type a command or search…'</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder text shown inside the search input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">commands</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly CommandPaletteItem[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Data-driven command list; merged with projected items and deduplicated by <code class="font-mono">id</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">filterFn</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CommandPaletteFilterFn | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Custom filter predicate; falls back to a case-insensitive substring match on label, keywords, and group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnSelect</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the palette closes automatically after an item is activated.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnEscape</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether Escape closes the palette.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closeOnBackdropClick</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether clicking the backdrop closes the palette.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">autoFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the search input is auto-focused when the palette opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ariaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Command palette'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label used for the dialog role.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">searchAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Search commands'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label applied to the search input (<code class="font-mono">role="combobox"</code>).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Additional classes appended to the overlay panel for consumer customization.</td>
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
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Open state of the palette; setting to <code class="font-mono">true</code> shows the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">query</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Current search query; reads or resets the filter.</td>
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
              <td class="px-4 py-2 font-mono text-xs">itemSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;CommandPaletteItem&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a command is activated via click or Enter; payload is the resolved item.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">opened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the palette becomes fully visible.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the palette is fully removed from the DOM.</td>
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
              <td class="px-4 py-2 font-mono text-xs">show</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Opens the palette programmatically.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hide</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Closes the palette programmatically.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the current open state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focusSearch</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Reapplies focus to the search input.</td>
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
              <td class="px-4 py-2 font-mono text-xs">tw-command-palette-item</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..n</td>
              <td class="px-4 py-2 text-fg-muted">Declarative palette items; content is projected into each row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCommandPaletteGroup]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..n</td>
              <td class="px-4 py-2 text-fg-muted">Optional wrapper applying a group label to its enclosed items.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twCommandPaletteEmpty</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the empty-state message; <code class="font-mono">$implicit</code> is the current search query.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">*twCommandPaletteFooter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Sticky content rendered at the bottom of the panel.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CommandPaletteItemDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteItemDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-command-palette-item</p>

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
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Stable identifier used as the DOM id and in selection payloads.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Plain-text label used for filtering and default rendering.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">keywords</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Additional search keywords that match the query but are not rendered.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">group</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Explicit group name; overrides any enclosing <code class="font-mono">twCommandPaletteGroup</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disabled items render but cannot be activated or focused.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">shortcut</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | readonly string[] | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Keyboard shortcut hint; a string renders as one kbd, an array renders each key separately.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Secondary description text rendered under the label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">run</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(() =&gt; void) | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Callback invoked before <code class="font-mono">activated</code> emits.</td>
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
              <td class="px-4 py-2 font-mono text-xs">activated</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;void&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when this specific item is activated via Enter or click.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CommandPaletteGroupDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteGroupDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCommandPaletteGroup]</p>

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
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">required</td>
              <td class="px-4 py-2 text-fg-muted">Group heading text shown above the enclosed items.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CommandPaletteItemIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteItemIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCommandPaletteItemIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Host directive that styles a leading icon inside a palette item.
      </p>
    </section>

    <!-- CommandPaletteItemDescriptionDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteItemDescriptionDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCommandPaletteItemDescription]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Host directive that styles secondary description text inside a palette item.
      </p>
    </section>

    <!-- CommandPaletteEmptyDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteEmptyDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCommandPaletteEmpty]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as the empty-state template. Context is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#123; $implicit: string &#125;</code>
        where the implicit value is the current search query.
      </p>
    </section>

    <!-- CommandPaletteFooterDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CommandPaletteFooterDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCommandPaletteFooter]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        as a sticky footer rendered at the bottom of the palette.
      </p>
    </section>

    <!-- TW_COMMAND_PALETTE_REF -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TW_COMMAND_PALETTE_REF</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Token: CommandPaletteRef</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Injection token providing a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CommandPaletteRef</code>
        handle to content rendered inside the palette overlay. Exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close()</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setQuery()</code>
        methods so projected content can drive the palette without a parent reference.
      </p>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CommandPaletteApi {
  protected readonly typesSnippet = `interface CommandPaletteItem {
  id: string;
  label: string;
  keywords?: readonly string[];
  group?: string;
  disabled?: boolean;
  shortcut?: string | readonly string[];
  description?: string;
  icon?: string;
  run?: () => void;
}

type CommandPaletteFilterFn = (
  items: readonly CommandPaletteItem[],
  query: string,
) => readonly CommandPaletteItem[];

interface CommandPaletteRef {
  close(): void;
  setQuery(query: string): void;
}`;
}
