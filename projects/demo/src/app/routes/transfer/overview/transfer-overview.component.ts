import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TransferComponent } from '@cdevhub/ngx-tw/transfer';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface Scope {
  readonly key: string;
  readonly label: string;
}

const SCOPES: readonly Scope[] = [
  { key: 'read:billing', label: 'Read billing' },
  { key: 'write:billing', label: 'Manage billing' },
  { key: 'read:members', label: 'View members' },
  { key: 'write:members', label: 'Invite & remove members' },
  { key: 'deploy', label: 'Deploy to production' },
  { key: 'audit', label: 'Read audit log' },
];

@Component({
  selector: 'app-transfer-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [TransferComponent, CodeBlockComponent, FormsModule, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Transfer component is a dual-listbox shuttle: two side-by-side panels — a
        source and a target — with a column of move controls between them. The user ticks
        items in one panel and shuttles them to the other, optionally narrowing each list
        with a search field and bulk-selecting with a tri-state header checkbox. Each panel
        composes Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkListbox</code>
        for accessible, keyboard-navigable selection. Its value is the set of keys currently
        on the target side, exposed through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each panel is a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="listbox"</code>
        labelled by its title, with each row a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="option"</code>
        carrying
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-selected</code>.
        CDK manages a single roving tabindex per panel, so the keys below operate within the
        focused list. The per-row check glyph is decorative
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>) —
        selection lives on the option. Moves are announced politely via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
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
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift+Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves between the source list, the move buttons, the search inputs, and the target list.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves the roving focus to the next or previous option within the focused list.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the first or last option in the focused list.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space / Enter</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the focused option's checked (pending-move) state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">A–Z, 0–9</td>
              <td class="px-4 py-2 text-fg-muted">Type-ahead — moves focus to the next option whose label starts with the typed characters.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [(ngModel)]="granted"
          [labels]="{ sourceTitle: 'Available scopes', targetTitle: 'Granted' }"
          aria-label="API scopes"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">granted = [{{ granted().join(', ') }}]</p>
      </div>
      <tw-code-block [code]="basicUsageHtmlSnippet" language="html" />
      <tw-code-block [code]="basicUsageTsSnippet" language="ts" class="mt-3 block" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Dual-listbox shuttle built on
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/cdk/listbox</code>
          — accessible, keyboard-navigable, single tab stop per panel
        </li>
        <li>Value is the set of target keys, via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
          — works with template-driven, reactive, and signal forms
        </li>
        <li>Generic over any item type with a required
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">keyFn</code>
          and a defaulted
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelFn</code>
        </li>
        <li>Optional per-panel search and a tri-state select-all via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display</code>
          config
        </li>
        <li>Fully templated rows through the optional
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTransferItem</code>
          directive — fall back to a label, or render avatars and metadata
        </li>
        <li>One-way mode and a per-item
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabledItem</code>
          predicate via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">behavior</code>
          config
        </li>
        <li>Moves announced with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>;
          integrates with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
          for label and error chrome
        </li>
        <li>Density via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.size</code>
          config (shared
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSize</code>)
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — choose from options in an overlay listbox when a full dual-list is overkill.
        </li>
        <li>
          <a routerLink="/components/tags-input" class="text-primary-600 hover:underline">Tags Input</a>
          — free-text multi-value entry rather than moving between fixed lists.
        </li>
        <li>
          <a routerLink="/components/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          — a single binary control; the transfer composes one for its select-all header.
        </li>
      </ul>
    </section>
  `,
})
export class TransferOverview {
  protected readonly scopes = SCOPES;
  protected readonly granted = signal<readonly string[]>(['read:members']);

  protected readonly scopeKey = (s: Scope): string => s.key;
  protected readonly scopeLabel = (s: Scope): string => s.label;

  protected readonly basicUsageHtmlSnippet = `<tw-transfer
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [(ngModel)]="granted"
  [labels]="{ sourceTitle: 'Available scopes', targetTitle: 'Granted' }"
  aria-label="API scopes"
/>`;

  protected readonly basicUsageTsSnippet = `interface Scope {
  key: string;
  label: string;
}

protected readonly scopes: Scope[] = [/* … */];
protected readonly granted = signal<readonly string[]>(['read:members']);

protected readonly scopeKey = (s: Scope) => s.key;
protected readonly scopeLabel = (s: Scope) => s.label;`;

  protected readonly importSnippet = `import {
  TransferComponent,
  TransferItemDefDirective,
} from '@cdevhub/ngx-tw/transfer';`;
}
