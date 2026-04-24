import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SeparatorComponent } from 'ngx-tw/separator';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-separator-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeparatorComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Separator draws a thin line between blocks of content — a lightweight way to
        express "these things are distinct, but related". It renders either horizontally
        or vertically, carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="separator"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-orientation</code>
        for assistive tech, and accepts optional projected content that renders as a
        centered label flanked by two lines. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">decorative</code>
        when the divider is purely visual so screen readers skip past it.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <p class="text-sm text-fg">Profile settings</p>
        <tw-separator />
        <p class="text-sm text-fg-muted">Account preferences, email notifications, and connected services.</p>
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
        <li>Horizontal and vertical orientations</li>
        <li>3 line styles:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dashed</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dotted</code>
        </li>
        <li>3 weights:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">thin</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">medium</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">thick</code>
        </li>
        <li>8 semantic colors</li>
        <li>Optional centered label (text, icon, or any markup) via content projection</li>
        <li>Decorative mode hides the separator from assistive technology</li>
        <li>Accessible by default:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="separator"</code>
          with a matching
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-orientation</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/card" class="text-primary-600 hover:underline">Card</a>
          — use a card's built-in header/footer dividers rather than a standalone separator inside a card.
        </li>
        <li>
          <a routerLink="/menu" class="text-primary-600 hover:underline">Menu</a>
          — menus emit their own separator items between groups; prefer those over this component inside a menu.
        </li>
        <li>
          <a routerLink="/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — when you need to separate content groups that each carry their own screen of content, tabs usually communicate the structure better than a divider.
        </li>
      </ul>
    </section>
  `,
})
export class SeparatorOverview {
  protected readonly basicUsageSnippet = `<p>Profile settings</p>
<tw-separator />
<p>Account preferences, email notifications, and connected services.</p>`;

  protected readonly importSnippet = `import { SeparatorComponent } from 'ngx-tw/separator';`;
}
