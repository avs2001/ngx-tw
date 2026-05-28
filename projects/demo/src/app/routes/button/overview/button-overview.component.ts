import { ChangeDetectionStrategy, Component } from '@angular/core';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-button-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Button directive turns any element into a styled, accessible button with support for
        multiple variants, semantic colors, sizes, loading states, and icon placement. Apply it to
        native <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#60;button&#62;</code>
        or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#60;a&#62;</code> elements.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        On a native <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        the browser already provides the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">button</code>
        role; the directive layers the additional ARIA wiring needed for its loading and disabled
        states. On an anchor, role and keyboard activation come from the native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;a&gt;</code>
        element — the directive provides only the visual treatment. Focus is tracked through
        Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>
        so the focus ring only appears for keyboard-origin focus.
      </p>
      <div class="overflow-x-auto border border-border rounded-lg mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter</td>
              <td class="px-4 py-2 text-fg-muted">Activates the button (native browser behavior).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Activates the button (native browser behavior).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the next focusable element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Shift + Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the previous focusable element.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">State</th>
              <th class="px-4 py-2 font-medium text-fg-muted">ARIA / behavior</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code> and blocks click and Enter / Space activation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">loading</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy="true"</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>; keeps the button focusable so screen readers can still announce it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">icon-only</td>
              <td class="px-4 py-2 text-fg-muted">Requires an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code> describing the action — the icon glyph alone is invisible to assistive tech.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 text-fg-muted">Visible <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focus-visible</code> outline appears only on keyboard focus, courtesy of CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton>Save changes</button>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>5 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">link</code></li>
        <li>8 semantic colors across all variants</li>
        <li>5 sizes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code> through <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code></li>
        <li>Loading state with pointer-events disabled and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code></li>
        <li>Leading and trailing icon support via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twButtonIcon</code></li>
        <li>Works on <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#60;button&#62;</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#60;a&#62;</code> elements</li>
        <li>Accessible: ARIA attributes, focus management via CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FocusMonitor</code></li>
      </ul>
    </section>
  `,
})
export class ButtonOverview {
  protected readonly basicUsageSnippet = `<button twButton>Save changes</button>`;

  protected readonly importSnippet = `import { ButtonDirective, ButtonIconDirective } from 'ngx-tw/button';`;
}
