import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ComboboxComponent } from '@cdevhub/ngx-tw/combobox';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface Fruit {
  readonly label: string;
  readonly value: string;
}

const FRUITS: readonly Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blackberry', value: 'blackberry' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

@Component({
  selector: 'app-combobox-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ComboboxComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Combobox is an editable typeahead text input paired with a popover listbox, implementing
        the WAI-ARIA 1.2
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">combobox</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">listbox</code>
        pattern with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code> —
        DOM focus stays on the input while the arrow keys move a visual highlight through the
        suggestions. Unlike
        <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>,
        the input value is freely typable: by default an unmatched commit is emitted as raw text,
        and opting into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">strict</code>
        mode reverts unmatched entries on blur. The same component drives local arrays, async server
        results (via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]="null"</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryChange</code>),
        and form controls — template-driven, reactive, and signal forms all work through the same
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The input carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="combobox"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-autocomplete="list"</code>,
        and references the listbox via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>.
        Active descendant tracking keeps DOM focus on the input while arrow keys move a visual
        highlight through the options. Always provide an accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>,
        or a wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>.
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
              <td class="px-4 py-2 text-fg-muted">Opens the popover (if closed) and moves the active descendant by one option.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Opens the popover without moving the active descendant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover and keeps the current input text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps the active descendant to the first or last enabled option (while the popover is open).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Commits the active option, or commits the raw input text in free-text mode; passes through when there is no active descendant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Commits the current value and moves focus to the next control in the tab order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the popover and restores the last committed input text.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Printable keys</td>
              <td class="px-4 py-2 text-fg-muted">Update the query, open the popover, and filter the listbox; emits debounced <code class="font-mono">queryChange</code> for async consumers.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [(value)]="fruit"
          placeholder="Type a fruit…"
          aria-label="Fruit"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ fruit() ?? 'null' }}</p>
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
        <li>WAI-ARIA 1.2 combobox + listbox pattern with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code>
          and live region announcements
        </li>
        <li>Unified local and async filter surface — pass an array for client-side filtering or
          set
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]="null"</code>
          and drive results from
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryChange</code>
        </li>
        <li>Free-text commits by default;
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[strict]="true"</code>
          reverts unmatched values on blur
        </li>
        <li>Grouped options via an
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">optionGroup</code>
          accessor that renders labelled
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>
          regions
        </li>
        <li>Three projection slots —
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxOption</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxEmpty</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxLoading</code> —
          plus
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twComboboxPrefix</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twComboboxSuffix</code>
          adornments
        </li>
        <li>Debounced
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryChange</code>
          output with configurable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryDebounce</code>
          window
        </li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
          — works with template-driven, reactive, and signal forms
        </li>
        <li>Auto-switches to a chrome-less variant when wrapped in
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        </li>
        <li>5 sizes, 8 semantic colors, and dark-mode safe via semantic tokens</li>
        <li>Full keyboard navigation including Alt+Arrow open/close and Tab-to-commit</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — closed list of options without free-text entry.
        </li>
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — plain text input when no suggestions are needed.
        </li>
        <li>
          <a routerLink="/components/command-palette" class="text-primary-600 hover:underline">Command Palette</a>
          — fullscreen modal launcher for global actions.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the combobox to get a label, hint, and error region.
        </li>
      </ul>
    </section>
  `,
})
export class ComboboxOverview {
  protected readonly fruits = FRUITS;
  protected readonly fruit = signal<string | null>(null);

  protected readonly basicUsageSnippet = `<tw-combobox
  [options]="fruits"
  [(value)]="fruit"
  placeholder="Type a fruit…"
  aria-label="Fruit"
/>`;

  protected readonly importSnippet = `import { ComboboxComponent } from '@cdevhub/ngx-tw/combobox';`;
}
