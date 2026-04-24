import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-code-block-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Code Block component displays preformatted code in a styled container with
        a header bar containing an optional language label and a copy-to-clipboard button.
        It provides visual and screen-reader feedback on copy. No syntax highlighting or
        line numbers — just clean code display with copy support.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-code-block [code]="basicSnippet" language="TypeScript" />
      </div>
      <div class="bg-surface-sunken border border-border rounded-lg p-4">
        <pre class="text-sm font-mono whitespace-pre text-fg"><code>&#60;tw-code-block [code]="snippet" language="TypeScript" /&#62;</code></pre>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Outlined Variant</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-code-block [code]="htmlSnippet" language="HTML" variant="outlined" />
      </div>
      <div class="bg-surface-sunken border border-border rounded-lg p-4">
        <pre class="text-sm font-mono whitespace-pre text-fg"><code>&#60;tw-code-block [code]="snippet" language="HTML" variant="outlined" /&#62;</code></pre>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <div class="bg-surface-sunken border border-border rounded-lg p-4">
        <pre class="text-sm font-mono whitespace-pre text-fg"><code>import {{ '{' }} CodeBlockComponent {{ '}' }} from 'ngx-tw/code-block';</code></pre>
      </div>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Header bar with optional <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">language</code> label and copy button</li>
        <li>Two visual variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code></li>
        <li>Built-in copy-to-clipboard via Angular CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Clipboard</code></li>
        <li>Visual feedback: icon switches to checkmark for 2 seconds after copy</li>
        <li>Screen reader announcement via CDK <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code></li>
        <li>Keyboard-scrollable code region with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="region"</code></li>
        <li>Optional word wrap with the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">wrap</code> input</li>
      </ul>
    </section>
  `,
})
export class CodeBlockOverview {
  protected readonly basicSnippet = `import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  imports: [CodeBlockComponent],
  template: \`<tw-code-block [code]="snippet" language="TypeScript" />\`,
})
export class MyComponent {}`;

  protected readonly htmlSnippet = `<tw-code-block [code]="snippet" language="HTML" variant="outlined" />`;
}
