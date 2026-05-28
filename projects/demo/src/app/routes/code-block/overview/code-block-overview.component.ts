import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-code-block-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Code Block component displays preformatted code in a styled container with a header
        bar containing an optional language label and a copy-to-clipboard button. It provides
        visual and screen-reader feedback on copy. No syntax highlighting or line numbers — just
        clean code display with copy support and a customizable header slot for filenames or
        secondary actions.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-code-block [code]="basicSnippet" language="TypeScript" />
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Outlined Variant</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-code-block [code]="htmlSnippet" language="HTML" variant="outlined" />
      </div>
      <tw-code-block [code]="outlinedSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          Header bar with optional
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">language</code> label and copy button
        </li>
        <li>
          Two visual variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code> and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>
        </li>
        <li>
          Customizable header slot via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twCodeBlockHeader]</code> for filenames or extra actions
        </li>
        <li>
          Localizable aria-labels and announcement via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code> input
        </li>
        <li>
          Built-in copy-to-clipboard via Angular CDK
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Clipboard</code>
        </li>
        <li>Visual feedback: icon switches to checkmark for 2 seconds after copy</li>
        <li>
          Screen reader announcement via CDK
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        </li>
        <li>
          Keyboard-scrollable code region with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code>
        </li>
        <li>
          Optional word wrap with the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">wrap</code> input
        </li>
      </ul>
    </section>
  `,
})
export class CodeBlockOverview {
  protected readonly basicSnippet = `import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  imports: [CodeBlockComponent],
  template: \`<tw-code-block [code]="snippet" language="TypeScript" />\`,
})
export class MyComponent {}`;

  protected readonly htmlSnippet = `<tw-code-block [code]="snippet" language="HTML" variant="outlined" />`;

  protected readonly basicUsageSnippet = `<tw-code-block [code]="snippet" language="TypeScript" />`;

  protected readonly outlinedSnippet = `<tw-code-block
  [code]="snippet"
  language="HTML"
  variant="outlined"
/>`;

  protected readonly importSnippet = `import {
  CodeBlockComponent,
  CodeBlockHeaderDirective,
} from '@cdevhub/ngx-tw/code-block';`;
}
