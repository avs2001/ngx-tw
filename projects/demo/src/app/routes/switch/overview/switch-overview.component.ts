import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SwitchComponent } from '@cdevhub/ngx-tw/switch';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-switch-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SwitchComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Switch component is a two-state toggle for settings that immediately take effect — "dark
        mode", "notifications on", "auto-save". Unlike a checkbox it represents an imperative action
        rather than a form-submission value, which is why it reads better inside settings panels
        than inside data-entry forms. It implements the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">switch</code>
        pattern with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>,
        integrates with every Angular form strategy via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        and manages focus through CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The host element carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="switch"</code>
        and reflects its state through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>,
        which is the discriminator assistive tech uses to distinguish a switch from a checkbox.
        Every switch must have an accessible name — the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        input, projected default content, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        all satisfy this requirement; the component emits a dev-mode warning when none is present.
        Motion is suppressed under
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>.
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
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the checked state. Prevents page scroll.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the checked state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab / Shift+Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next or previous focusable element in the page's tab order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-switch label="Enable notifications" [(checked)]="basicValue" />
        <p class="text-xs text-fg-muted mt-4 font-mono">state = {{ basicValue() ? 'on' : 'off' }}</p>
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
        <li>5 sizes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
          through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
          — track, thumb, and label scale together
        </li>
        <li>8 semantic colors for the active (checked) state</li>
        <li>Two-way binding via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(checked)]</code>
        </li>
        <li>Works with template-driven, reactive, and Angular v21 signal forms</li>
        <li>ARIA
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">switch</code>
          pattern with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-checked</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>
        </li>
        <li>Keyboard activation: Space and Enter toggle the state</li>
        <li>Label and description via inputs or content projection for rich content</li>
        <li>Optional on/off indicator icons projected into the track</li>
        <li>Label can be positioned before or after the switch</li>
        <li>Dev-mode warning when no accessible name is provided</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
          — use when the value is a form-submission truth (terms accepted, remember-me) that the
          user reviews before commit. Switch is for settings that apply immediately.
        </li>
        <li>
          <a routerLink="/radio" class="text-primary-600 hover:underline">Radio</a>
          — for picking exactly one option from a small enumerated set rather than an on/off state.
        </li>
        <li>
          <a routerLink="/segmented-control" class="text-primary-600 hover:underline">Segmented Control</a>
          — when you need more than two labelled states but still want a single control surface.
        </li>
      </ul>
    </section>
  `,
})
export class SwitchOverview {
  protected readonly basicValue = signal(false);

  protected readonly basicUsageSnippet = `<tw-switch label="Enable notifications" [(checked)]="enabled" />`;

  protected readonly importSnippet = `import { SwitchComponent } from '@cdevhub/ngx-tw/switch';`;
}
