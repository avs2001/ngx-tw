import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CommandPaletteComponent,
  CommandPaletteItemDirective,
} from 'ngx-tw/command-palette';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-command-palette-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommandPaletteComponent,
    CommandPaletteItemDirective,
    ButtonDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Command Palette is a keyboard-driven, modal search surface for triggering application
        actions — similar to VS Code's ⌘K, Linear's command menu, or Raycast. Consumers feed it
        commands either declaratively via projected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-command-palette-item&gt;</code>
        elements or as a data array via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[commands]</code>,
        and the default filter performs a case-insensitive substring match on labels, keywords,
        and group names. The overlay implements the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">combobox</code>
        + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">listbox</code>
        pattern with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code>,
        focus trapping, and live-region result announcements.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The search input has
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="combobox"</code>
        and references the listbox via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>;
        DOM focus stays on the input while arrow keys move a visual highlight through the item
        list via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code>.
        Opening the palette traps focus inside the overlay (CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusTrap</code>),
        closing returns focus to whatever element owned it before open, and typing announces the
        result count through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        on a debounced interval.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves the active descendant, skipping disabled items. Wraps at the ends.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first or last enabled item.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Activates the highlighted item, invokes its <code class="font-mono">run</code> callback, and emits <code class="font-mono">itemSelected</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the palette and returns focus to the trigger. Suppressed when <code class="font-mono">[closeOnEscape]="false"</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Closes the palette — the palette is a modal, not a form control, so Tab dismissal is the expected escape hatch.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Printable characters</td>
              <td class="px-4 py-2 text-fg-muted">Filters the list. The default predicate matches labels, keywords, and group names.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton (click)="isOpen.set(true)">Open palette</button>
          <span class="text-sm text-fg-muted">
            Last activated: <strong class="text-fg">{{ lastSelected() ?? 'none' }}</strong>
          </span>
        </div>

        <tw-command-palette
          [(open)]="isOpen"
          (itemSelected)="lastSelected.set($event.label)"
        >
          <tw-command-palette-item id="new-file" label="New file" [shortcut]="['⌘', 'N']">
            New file
          </tw-command-palette-item>
          <tw-command-palette-item id="open-file" label="Open file" [shortcut]="['⌘', 'O']">
            Open file
          </tw-command-palette-item>
          <tw-command-palette-item id="save" label="Save" [shortcut]="['⌘', 'S']">
            Save
          </tw-command-palette-item>
          <tw-command-palette-item id="settings" label="Settings">
            Settings
          </tw-command-palette-item>
        </tw-command-palette>
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
        <li>Dual sourcing: declarative
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-command-palette-item&gt;</code>
          or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[commands]</code>
          data array, merged and deduplicated by
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">id</code>
        </li>
        <li>Case-insensitive substring filter by default over label, keywords, and group</li>
        <li>Fully swappable predicate via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]</code>
          — fuzzy, scored, server-fetched, whatever the consumer needs
        </li>
        <li>Grouped sections via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCommandPaletteGroup</code>
          or a per-item
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">group</code>
          input
        </li>
        <li>Keyboard shortcut hints rendered as
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;kbd&gt;</code>
          chips (string or array)
        </li>
        <li>Projected empty-state and footer templates with sensible fallbacks</li>
        <li>ARIA combobox + listbox with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code>
          keyboard navigation
        </li>
        <li>Focus trap and focus-return on close; LiveAnnouncer-powered result counts</li>
        <li>Two-way bindable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(open)]</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(query)]</code>
        </li>
        <li>Programmatic control via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">show()</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hide()</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggle()</code>
        </li>
        <li>5 sizes controlling item density</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — modal surface for confirmations, forms, and richer content that doesn't fit the one-action-per-row command model.
        </li>
        <li>
          <a routerLink="/menu" class="text-primary-600 hover:underline">Menu</a>
          — attaches to a specific trigger and lists context-local actions; reach for Menu over Command Palette when the action set is short and anchored to the click target.
        </li>
        <li>
          <a routerLink="/select" class="text-primary-600 hover:underline">Select</a>
          — for picking a value rather than running an action. Select writes to a form control; Command Palette runs a callback.
        </li>
      </ul>
    </section>
  `,
})
export class CommandPaletteOverview {
  protected readonly isOpen = signal(false);
  protected readonly lastSelected = signal<string | null>(null);

  protected readonly basicUsageSnippet = `<button twButton (click)="isOpen.set(true)">Open palette</button>

<tw-command-palette
  [(open)]="isOpen"
  (itemSelected)="lastSelected.set($event.label)"
>
  <tw-command-palette-item id="new-file" label="New file" [shortcut]="['⌘', 'N']">
    New file
  </tw-command-palette-item>
  <tw-command-palette-item id="open-file" label="Open file" [shortcut]="['⌘', 'O']">
    Open file
  </tw-command-palette-item>
  <tw-command-palette-item id="save" label="Save" [shortcut]="['⌘', 'S']">
    Save
  </tw-command-palette-item>
  <tw-command-palette-item id="settings" label="Settings">
    Settings
  </tw-command-palette-item>
</tw-command-palette>`;

  protected readonly importSnippet = `import {
  CommandPaletteComponent,
  CommandPaletteItemDirective,
  CommandPaletteGroupDirective,
  CommandPaletteItemIconDirective,
  CommandPaletteItemDescriptionDirective,
  CommandPaletteEmptyDirective,
  CommandPaletteFooterDirective,
} from 'ngx-tw/command-palette';`;
}
