import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SegmentedControlComponent, SegmentedControlOptionComponent } from 'ngx-tw/segmented-control';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-segmented-control-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SegmentedControlComponent, SegmentedControlOptionComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Segmented Control is a group of mutually-exclusive toggle buttons where
        exactly one option is always selected. It implements the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">radiogroup</code>
        pattern with roving tabindex, and integrates with Angular forms through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
        Reach for it when a dropdown would be overkill and a plain button group would not
        communicate selection — common uses include view switches (list / grid / table),
        time-range pickers, and boolean-ish tri-state toggles.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The host element carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="radiogroup"</code>
        and each option carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="radio"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>
        reflecting the selected state. A roving tabindex keeps only one option in the tab
        order at a time — arrow keys move the selection and the focused tabstop together,
        so the group behaves like a single control. Always provide an accessible name on
        the container via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>.
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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves selection and focus to the next enabled option; wraps at the end.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Moves selection and focus to the previous enabled option; wraps at the start.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Selects and focuses the first enabled option.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Selects and focuses the last enabled option.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space / Enter</td>
              <td class="px-4 py-2 text-fg-muted">Activates the focused option (default button behaviour).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus into or out of the group; only the selected option participates in the tab order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control [(value)]="basicValue" aria-label="View mode">
          <tw-segmented-option value="list">List</tw-segmented-option>
          <tw-segmented-option value="grid">Grid</tw-segmented-option>
          <tw-segmented-option value="table">Table</tw-segmented-option>
        </tw-segmented-control>
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ basicValue() ?? 'null' }}</p>
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
        <li>ARIA
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">radiogroup</code>
          pattern with roving tabindex and wrap-around arrow navigation
        </li>
        <li>Three visual variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">surface</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        </li>
        <li>5 sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) and 8 semantic colors</li>
        <li>Two rounded shapes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
          (vertical orientation forces <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>)
        </li>
        <li>Horizontal and vertical orientation</li>
        <li>Two-way binding via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code></li>
        <li>Works with template-driven forms, reactive forms, and Angular v21 signal forms through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        </li>
        <li>Per-option and group-level disabling; disabled options are skipped by keyboard navigation</li>
        <li>Rich labels via content projection — text, icons, or any custom markup</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/radio" class="text-primary-600 hover:underline">Radio</a>
          — a traditional radio group with labelled options and unlimited items.
        </li>
        <li>
          <a routerLink="/switch" class="text-primary-600 hover:underline">Switch</a>
          — for a single binary on/off rather than a choice from a small set.
        </li>
        <li>
          <a routerLink="/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — visually similar but swaps panels of content rather than selecting a value.
        </li>
        <li>
          <a routerLink="/select" class="text-primary-600 hover:underline">Select</a>
          — reach for this when the set is larger than 4–5 options or needs search.
        </li>
      </ul>
    </section>
  `,
})
export class SegmentedControlOverview {
  protected readonly basicValue = signal<string | null>('list');

  protected readonly basicUsageSnippet = `<tw-segmented-control [(value)]="view" aria-label="View mode">
  <tw-segmented-option value="list">List</tw-segmented-option>
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="table">Table</tw-segmented-option>
</tw-segmented-control>`;

  protected readonly importSnippet = `import {
  SegmentedControlComponent,
  SegmentedControlOptionComponent,
} from 'ngx-tw/segmented-control';`;
}
