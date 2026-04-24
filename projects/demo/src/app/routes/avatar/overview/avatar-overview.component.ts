import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AvatarComponent } from 'ngx-tw/avatar';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-avatar-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Avatar component renders a compact visual identity for a user or entity. It supports an
        automatic content cascade — an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;img&gt;</code>
        when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">src</code>
        loads successfully, initials when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">initials</code>
        are provided, and projected (or default) fallback content otherwise. It is non-interactive:
        it exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="img"</code>
        with an accessible name from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alt</code>
        when no real image is shown, and companion
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-avatar-group</code>
        stacks multiple avatars with overlap and an optional "+N" overflow indicator.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
          <tw-avatar initials="AB" color="success" alt="Alice Brown" />
          <tw-avatar initials="MK" color="accent" alt="Mike Keller" />
          <tw-avatar alt="Anonymous user" />
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
        <li>Automatic content cascade: image &rarr; initials &rarr; projected or default fallback</li>
        <li>5 sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) and 8 semantic colors for the initials/icon surface</li>
        <li>3 shape options: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">full</code> (circle), <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code> (rounded square), <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code> (sharp square)</li>
        <li>Optional status dot: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">online</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">busy</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">away</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">offline</code> — position adapts to the shape</li>
        <li>Content projection replaces the default silhouette with a custom icon or SVG</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-avatar-group</code> stacks avatars with overlap, propagates a single size, and renders a "+N" overflow indicator via the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code> input</li>
        <li>Accessible by default: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="img"</code> with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code> for non-image avatars, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code> when no name is provided</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/badge" class="text-primary-600 hover:underline">Badge</a>
          — pair with an avatar to build user chips, assignee tags, and status pills.
        </li>
        <li>
          <a routerLink="/icon" class="text-primary-600 hover:underline">Icon</a>
          — project a themed icon as the avatar's fallback content.
        </li>
        <li>
          <a routerLink="/card" class="text-primary-600 hover:underline">Card</a>
          — typical container for avatars in profile summaries and member lists.
        </li>
      </ul>
    </section>
  `,
})
export class AvatarOverview {
  protected readonly basicUsageSnippet = `<tw-avatar initials="JD" color="primary" alt="Jane Doe" />
<tw-avatar initials="AB" color="success" alt="Alice Brown" />
<tw-avatar initials="MK" color="accent" alt="Mike Keller" />
<tw-avatar alt="Anonymous user" />`;

  protected readonly importSnippet = `import { AvatarComponent, AvatarGroupComponent } from 'ngx-tw/avatar';`;
}
