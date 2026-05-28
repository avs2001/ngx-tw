import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { IconComponent } from 'ngx-tw/icon';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-icon-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Icon component renders SVG icons from a registry or from direct icon data, with a
        consistent size scale and semantic color variants. Icons are registered tree-shakably via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwIcons</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwLucideIcons</code>
        so only the icons an app actually uses end up in the bundle. By default, icons are
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>
        and inherit the parent's text color via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">currentColor</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-4">
          <tw-icon name="star" />
          <tw-icon name="heart" color="error" />
          <tw-icon name="check-circle" color="success" size="lg" />
          <tw-icon name="alert-triangle" color="warning" size="xl" />
        </div>
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
        <li>Tree-shakable icon registration via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwIcons</code>
          or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwLucideIcons</code>
        </li>
        <li>9 color options:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">current</code>
          (default) plus the 8 semantic colors
        </li>
        <li>5 sizes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
          (12px) through
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
          (32px)
        </li>
        <li>Inherits the parent's text color by default so icons sit naturally inside prose and buttons</li>
        <li>Accessible by default:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>
          unless
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
          is provided
        </li>
        <li>SVG-author config grouped under a single
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">svg</code>
          input —
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">strokeWidth</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">absoluteStrokeWidth</code>
          compensation, and custom
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">viewBox</code>
          for non-24×24 icon sources
        </li>
        <li>SVG caching: the DOM only rebuilds when the underlying icon data changes</li>
        <li>Dev-mode warnings when an icon name is not registered</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/avatar" class="text-primary-600 hover:underline">Avatar</a>
          — for user portraits with icon fallbacks.
        </li>
        <li>
          <a routerLink="/components/button" class="text-primary-600 hover:underline">Button</a>
          — pairs naturally with icons for leading or trailing glyphs.
        </li>
        <li>
          <a routerLink="/components/alert" class="text-primary-600 hover:underline">Alert</a>
          — uses icons to reinforce semantic status.
        </li>
      </ul>
    </section>
  `,
})
export class IconOverview {
  protected readonly basicUsageSnippet = `<tw-icon name="star" />
<tw-icon name="heart" color="error" />
<tw-icon name="check-circle" color="success" size="lg" />
<tw-icon name="alert-triangle" color="warning" size="xl" />`;

  protected readonly importSnippet = `// Component
import { IconComponent } from 'ngx-tw/icon';

// Provider (app.config.ts)
import { provideTwLucideIcons } from 'ngx-tw/icon/lucide';
import { Star, Heart, CheckCircle } from 'lucide-angular';

export const appConfig = {
  providers: [
    provideTwLucideIcons({ Star, Heart, CheckCircle }),
  ],
};`;
}
