import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { FlipCardComponent } from '@cdevhub/ngx-tw/flip-card';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-flip-card-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlipCardComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Flip Card component renders two faces stacked in 3D and rotates between
        them on user interaction. It accepts
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="front"]</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="back"]</code>
        content, so each face can hold anything — marketing copy on the front, product
        details on the back; a stat summary on the front, a breakdown on the back;
        a teammate photo on the front, their bio on the back. The flip is driven by CSS
        transforms, so it works without JavaScript animation runtimes.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-3">
        In
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">click</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hover</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">both</code>
        modes the host is a toggle button:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="0"</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-pressed</code>
        reflects the face that's visible. In
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>
        mode the host is a plain region with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>
        — face changes are announced automatically, and an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ariaLabel</code>
        is applied (defaulting to "Flip card") so the region passes AXE. The
        invisible face is also marked
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inert</code>,
        so screen readers and tab order only see the visible content.
      </p>
      <div class="overflow-x-auto border border-border rounded-lg max-w-2xl">
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
              <td class="px-4 py-2 text-fg-muted">Toggles the visible face.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Space</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the visible face; page scroll is suppressed.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto h-48 w-72">
          <tw-flip-card class="h-full w-full">
            <div slot="front" class="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center">
              <p class="text-xs uppercase tracking-wide text-fg-muted">Plan</p>
              <p class="text-2xl font-semibold text-fg">Starter</p>
              <p class="text-xs text-fg-muted">Hover or click to see what's included</p>
            </div>
            <div slot="back" class="flex h-full w-full flex-col justify-center gap-2 p-6">
              <p class="text-xs uppercase tracking-wide text-fg-muted">Includes</p>
              <ul class="text-sm text-fg space-y-1">
                <li>Up to 10 seats</li>
                <li>Unlimited projects</li>
                <li>Community support</li>
              </ul>
            </div>
          </tw-flip-card>
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
        <li>Three chrome variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
          — matches the Card component's vocabulary</li>
        <li>Four trigger modes:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">click</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hover</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>,
          or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">both</code></li>
        <li>Horizontal (Y-axis) and vertical (X-axis) flip directions</li>
        <li>Two-way binding via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(flipped)]</code>
          for programmatic control</li>
        <li>Named content slots:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="front"]</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="back"]</code></li>
        <li>Silent no-op when no back content is projected — safe to use as a front-only card</li>
        <li>Full keyboard support: Enter and Space toggle the visible face</li>
        <li>CSS 3D transforms — no
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;angular/animations</code>
          dependency</li>
        <li>Honors
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>:
          the flip still happens but the transition is instant</li>
        <li>Dark-mode-aware through semantic surface and border tokens</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/card" class="text-primary-600 hover:underline">Card</a>
          — use for static grouping; Flip Card extends the same chrome with a second face.
        </li>
        <li>
          <a routerLink="/components/collapsible" class="text-primary-600 hover:underline">Collapsible</a>
          — better when the hidden content should push surrounding layout rather than replace the surface.
        </li>
        <li>
          <a routerLink="/components/popover" class="text-primary-600 hover:underline">Popover</a>
          — better when additional content should float above the page instead of replacing the card.
        </li>
      </ul>
    </section>
  `,
})
export class FlipCardOverview {
  protected readonly basicUsageSnippet = `<tw-flip-card class="h-48 w-72">
  <div slot="front">Starter plan</div>
  <div slot="back">
    <ul>
      <li>Up to 10 seats</li>
      <li>Unlimited projects</li>
      <li>Community support</li>
    </ul>
  </div>
</tw-flip-card>`;

  protected readonly importSnippet = `import { FlipCardComponent } from '@cdevhub/ngx-tw/flip-card';`;
}
