import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AspectRatioDirective } from '@cdevhub/ngx-tw/aspect-ratio';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-aspect-ratio-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AspectRatioDirective, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Aspect Ratio directive constrains any element to a fixed width-to-height
        ratio by setting the native CSS
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aspect-ratio</code>
        property. It replaces hand-rolled
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aspect-[16/9]</code>
        utility classes with a single, reusable input that accepts both numbers and
        ratio strings. Reach for it anywhere media is rendered at a fixed shape — card
        covers, thumbnails, responsive video frames, and image grids.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-start gap-4">
          <div
            twAspectRatio
            class="w-40 grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted"
          >
            1 / 1
          </div>
          <div
            twAspectRatio="16/9"
            class="w-64 grid place-items-center rounded-lg bg-surface-sunken text-xs font-mono text-fg-muted"
          >
            16 / 9
          </div>
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
        <li>Single
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAspectRatio</code>
          input — no configuration ceremony
        </li>
        <li>Accepts a unitless number
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1.7777</code>)
          or a ratio string using
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">/</code>
          or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">:</code>
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'16/9'</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'16:9'</code>)
        </li>
        <li>Normalizes every value to the CSS
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'w / h'</code>
          form
        </li>
        <li>Invalid or non-positive input falls back to a square
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1 / 1</code>),
          so the host always has a valid ratio
        </li>
        <li>Bare attribute
          (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twAspectRatio</code>)
          renders a square with zero config
        </li>
        <li>Sets only
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aspect-ratio</code>
          — layout (width, object-fit) stays in your hands
        </li>
        <li>Pure CSS, no JavaScript layout work, no CDK dependency</li>
        <li>Non-interactive and presentational — adds no ARIA and leaves host media accessibility untouched</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/card" class="text-primary-600 hover:underline">Card</a>
          — pair a ratio'd cover image with the card body.
        </li>
        <li>
          <a routerLink="/components/avatar" class="text-primary-600 hover:underline">Avatar</a>
          — a dedicated circular media primitive with fallback initials.
        </li>
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — hold a ratio'd placeholder while media loads.
        </li>
        <li>
          <a routerLink="/components/carousel" class="text-primary-600 hover:underline">Carousel</a>
          — keep every slide at a uniform shape.
        </li>
      </ul>
    </section>
  `,
})
export class AspectRatioOverview {
  protected readonly basicUsageSnippet = `<!-- Square — bare attribute, zero config -->
<div twAspectRatio class="w-40"></div>

<!-- 16:9 — pass a ratio string -->
<div twAspectRatio="16/9" class="w-64"></div>`;

  protected readonly importSnippet = `import { AspectRatioDirective } from '@cdevhub/ngx-tw/aspect-ratio';`;
}
