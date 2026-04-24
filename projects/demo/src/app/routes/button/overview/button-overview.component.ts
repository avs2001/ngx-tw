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
