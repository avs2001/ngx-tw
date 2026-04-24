import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BadgeComponent } from 'ngx-tw/badge';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-badge-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Badge directive turns any element into a compact status label, count, or tag. It supports
        three visual variants, eight semantic colors, five sizes, a pill shape, a dot-only indicator,
        and an optional dismiss button. The host element carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        so screen readers treat the badge as a live status region.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <span twBadge>Default</span>
          <span twBadge variant="solid" color="primary">Solid</span>
          <span twBadge variant="outline" color="info">Outline</span>
          <span twBadge variant="soft" color="success">Soft</span>
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
        <li>3 variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        </li>
        <li>8 semantic colors across every variant, mapped through the theme's color tokens</li>
        <li>5 sizes from
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code> to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>,
          with padding and font scaling in lockstep
        </li>
        <li>Pill shape via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
          for fully rounded corners
        </li>
        <li>Dot-only mode via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dot</code>
          for presence/status indicators with no label
        </li>
        <li>Leading
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon</code> or
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-avatar</code>
          via content projection — the badge auto-detects and adjusts spacing
        </li>
        <li>Dismissible mode with a built-in close button and a
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissed</code>
          output
        </li>
        <li>Attribute selector:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twBadge]</code>
          attaches to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;span&gt;</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;div&gt;</code>,
          or any semantically appropriate element
        </li>
        <li>Defaults to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
          for accessible live-region announcements
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/alert" class="text-primary-600 hover:underline">Alert</a>
          — for multi-line, block-level status messages that need a heading and body.
        </li>
        <li>
          <a routerLink="/avatar" class="text-primary-600 hover:underline">Avatar</a>
          — projects inside a badge to label users, or stands alone for profile imagery.
        </li>
        <li>
          <a routerLink="/icon" class="text-primary-600 hover:underline">Icon</a>
          — projects inside a badge as a leading glyph.
        </li>
      </ul>
    </section>
  `,
})
export class BadgeOverview {
  protected readonly basicUsageSnippet = `<span twBadge>Default</span>
<span twBadge variant="solid" color="primary">Solid</span>
<span twBadge variant="outline" color="info">Outline</span>
<span twBadge variant="soft" color="success">Soft</span>`;

  protected readonly importSnippet = `import { BadgeComponent } from 'ngx-tw/badge';`;
}
