import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SelectComponent } from '@cdevhub/ngx-tw/select';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

interface Country {
  readonly label: string;
  readonly value: string;
}

const COUNTRIES: readonly Country[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'France', value: 'fr' },
  { label: 'Spain', value: 'es' },
  { label: 'Italy', value: 'it' },
  { label: 'Japan', value: 'jp' },
  { label: 'Canada', value: 'ca' },
  { label: 'Australia', value: 'au' },
  { label: 'Romania', value: 'ro' },
];

@Component({
  selector: 'app-select-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SelectComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Select component is a combobox with a listbox popup, implementing the
        WAI-ARIA "Combobox with Listbox Popup" pattern. Options can be provided as
        data via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options</code>
        or fully customized via structural-directive templates. When placed inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        wrapper, the select auto-detects and switches to a naked style so the
        form-field's chrome owns the border, focus ring, and floating label.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The trigger has
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="combobox"</code>
        and references the listbox via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-controls</code>;
        active descendant tracking keeps DOM focus on the trigger (or the search
        input, when searchable) while arrow keys move a visual highlight through
        the listbox. Multi-select changes are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>.
        Always provide an accessible name via
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
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Opens the panel when closed; selects the active option when open. Space passes through when the search input is focused.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Opens and moves the active descendant. Does not wrap at the ends.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + ArrowDown / Alt + ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Opens or closes the panel without moving the active descendant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first or last enabled option.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp / PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves the active descendant by 10.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Escape</td>
              <td class="px-4 py-2 text-fg-muted">Closes the panel and returns focus to the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Closes the panel and allows natural tab order.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">A–Z, 0–9</td>
              <td class="px-4 py-2 text-fg-muted">Type-ahead on the closed or non-searchable panel; jumps to the first option whose label begins with the buffer (400ms window).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Printable (searchable)</td>
              <td class="px-4 py-2 text-fg-muted">Filters the listbox through the in-panel search input.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="countries"
          [(value)]="country"
          placeholder="Select a country"
          aria-label="Country"
          class="w-64"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ country() ?? 'null' }}</p>
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
        <li>Single and multi selection with typed generic value</li>
        <li>ARIA combobox with listbox popup and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-activedescendant</code>
          keyboard navigation
        </li>
        <li>Optional in-panel search input with a custom filter predicate</li>
        <li>Grouped options via an
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">optionGroup</code>
          accessor
        </li>
        <li>Five projection slots: trigger, option, empty state, header, footer</li>
        <li>CDK Overlay positioning with flexible flip and viewport clamping</li>
        <li>Works with reactive forms, template-driven forms, and Angular v21 signal forms</li>
        <li>Auto-switches to a naked variant when wrapped in
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        </li>
        <li>5 sizes and 8 semantic colors</li>
        <li>Full ARIA APG keyboard model including type-ahead and multi-select live announcements</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the select to get a label, hint, error region, and naked styling.
        </li>
        <li>
          <a routerLink="/input" class="text-primary-600 hover:underline">Input</a>
          — a plain text input for free-form values.
        </li>
        <li>
          <a routerLink="/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          and
          <a routerLink="/radio" class="text-primary-600 hover:underline">Radio</a>
          — better for small, fully visible enumerations.
        </li>
      </ul>
    </section>
  `,
})
export class SelectOverview {
  protected readonly countries = COUNTRIES;
  protected readonly country = signal<string | readonly string[] | null>('de');

  protected readonly basicUsageSnippet = `<tw-select
  [options]="countries"
  [(value)]="country"
  placeholder="Select a country"
  aria-label="Country"
/>`;

  protected readonly importSnippet = `import { SelectComponent } from '@cdevhub/ngx-tw/select';`;
}
