import { ChangeDetectionStrategy, Component } from '@angular/core';
import { SkeletonComponent } from 'ngx-tw/skeleton';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-skeleton-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent, CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Skeleton component renders a placeholder shape — a gentle pulsing block — where real
        content will appear once it loads. It prevents layout jump, communicates "this region is
        loading," and adapts to light and dark themes via the surface tokens.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        By default the skeleton is hidden from assistive technology via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code> —
        lists and grids of skeletons should stay silent and let the parent region own the announcement.
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">announce</code> when a
        single skeleton owns the loading region (a hero placeholder, a stand-alone card) to expose
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>,
        and a visually hidden "Loading" label. All animations halt under
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <tw-skeleton shape="circle" [width]="40" [height]="40" />
          <div class="flex-1">
            <tw-skeleton [lines]="2" />
          </div>
        </div>
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
        <li>3 shapes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rectangle</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">circle</code></li>
        <li>3 animations: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pulse</code> (default), <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">wave</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code></li>
        <li>Multi-line text mode via the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines</code> input — last row is auto-shortened to 60% width</li>
        <li>Free-form sizing via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">width</code> and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">height</code> (numbers are pixels, strings pass through)</li>
        <li>Theme-aware background via the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">surface-muted</code> token — adapts to light and dark</li>
        <li>Assistive tech is silent by default; opt-in <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">announce</code> mode exposes a polite live region</li>
        <li>Honours <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> by halting the animation</li>
      </ul>
    </section>
  `,
})
export class SkeletonOverview {
  protected readonly basicUsageSnippet = `
<tw-skeleton shape="circle" [width]="40" [height]="40" />
<tw-skeleton [lines]="2" />`.trim();

  protected readonly importSnippet = `import { SkeletonComponent } from 'ngx-tw/skeleton';`;
}
