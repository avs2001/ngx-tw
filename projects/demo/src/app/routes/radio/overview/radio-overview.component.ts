import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { RadioComponent, RadioGroupComponent } from 'ngx-tw/radio';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-radio-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RadioComponent, RadioGroupComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Radio component is a single-selection control. Typically used inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-radio-group</code>,
        it implements the ARIA radiogroup pattern with arrow-key navigation, roving tabindex, and
        form integration through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
        Individual radios also work standalone when a one-shot boolean toggle is all you need.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The group carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="radiogroup"</code>
        while each child carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="radio"</code>.
        Focus uses a roving
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex</code>:
        only one radio is in the tab order at a time — the selected one, or the first enabled radio
        when nothing is selected yet. Arrow keys move focus AND selection in one step to match
        native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input type="radio"&gt;</code>
        semantics. Always give the group an accessible name with
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
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus into the group, landing on the selected radio (or the first enabled one if nothing is selected).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves selection to the next enabled radio and wraps from last to first.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowLeft</td>
              <td class="px-4 py-2 text-fg-muted">Moves selection to the previous enabled radio and wraps from first to last.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first enabled radio and selects it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the last enabled radio and selects it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Selects the focused radio; no-op if it is already selected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">No action — matches native radio semantics, so Enter submits the surrounding form.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="plan" aria-label="Subscription plan">
          <tw-radio value="free" label="Free" />
          <tw-radio value="pro" label="Pro" />
          <tw-radio value="team" label="Team" />
        </tw-radio-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ plan() ?? 'null' }}</p>
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
        <li>Group container owns selection state and ARIA semantics</li>
        <li>Full ARIA radiogroup keyboard model — Arrow keys with wrap, Home, End, Space</li>
        <li>Roving tabindex — only the selected radio is tab-reachable</li>
        <li>5 sizes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code> through <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code></li>
        <li>8 semantic colors for the selected indicator</li>
        <li>Two variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code></li>
        <li>Horizontal or vertical orientation</li>
        <li>Two-way binding via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code> — works with template-driven, reactive, and Angular v21 signal forms</li>
        <li>Per-radio overrides for <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code></li>
        <li>Disabled cascade — group-disabled disables every child radio</li>
        <li>Rich label, description, and dot slots via content projection</li>
        <li>Standalone radios support <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(checked)]</code> without a group</li>
        <li>Selected-dot animation respects <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code></li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          — use when each option is independent and more than one can be on at the same time.
        </li>
        <li>
          <a routerLink="/components/switch" class="text-primary-600 hover:underline">Switch</a>
          — a binary on/off toggle for settings that take immediate effect.
        </li>
        <li>
          <a routerLink="/components/select" class="text-primary-600 hover:underline">Select</a>
          — prefer for long lists where showing every option would overwhelm the layout.
        </li>
        <li>
          <a routerLink="/components/segmented-control" class="text-primary-600 hover:underline">Segmented Control</a>
          — use for a small set of mutually exclusive options that should read as a button group.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — wrap the group to get a label, hint, and error region with consistent form chrome.
        </li>
      </ul>
    </section>
  `,
})
export class RadioOverview {
  protected readonly plan = signal<string | null>('pro');

  protected readonly basicUsageSnippet = `<tw-radio-group [(value)]="plan" aria-label="Subscription plan">
  <tw-radio value="free" label="Free" />
  <tw-radio value="pro" label="Pro" />
  <tw-radio value="team" label="Team" />
</tw-radio-group>`;

  protected readonly importSnippet = `import { RadioComponent, RadioGroupComponent } from 'ngx-tw/radio';`;
}
