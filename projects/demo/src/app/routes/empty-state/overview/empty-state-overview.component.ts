import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { EmptyStateComponent } from '@cdevhub/ngx-tw/empty-state';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-empty-state-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [EmptyStateComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Empty State component fills the gap left by a successful render of
        zero rows — an empty inbox, a search with no results, a fresh list
        before the first record is created. It composes a centered icon,
        heading, description, and optional action buttons into a calm,
        opinionated region you can drop anywhere that data normally lives. It
        is intentionally neutral: accent comes from projected
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-button</code>
        actions, never from the empty state itself. For live announcements
        (e.g. "no search results found") wrap the component yourself in a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        region — empty state stays a static content surface.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-empty-state
          title="No messages"
          description="When you receive a message it'll appear here."
        />
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
        <li>Two layout variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">centered</code>
          for full-region usage and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code>
          for compact rows (e.g. inside a table's empty row)
        </li>
        <li>Five sizes (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>) that scale spacing and the fallback icon</li>
        <li>Renders the title as a real <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;h1&gt;</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;h6&gt;</code> via the
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">titleLevel</code>
          input — participates in the document outline
        </li>
        <li>Four projection slots: icon (attribute), title and description (structural <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twEmptyStateTitle</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twEmptyStateDescription</code>), and actions (attribute)</li>
        <li>Fallback inbox icon renders automatically when no icon slot is projected</li>
        <li>Neutral by design — no <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code> input; accent comes from projected action buttons</li>
        <li>No focus management or keyboard handling — projected actions retain their native behavior</li>
        <li>Works inside cards, table empty rows, or directly inside any container</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — render this while data is loading; swap to Empty State once the response confirms zero rows.
        </li>
        <li>
          <a routerLink="/components/alert" class="text-primary-600 hover:underline">Alert</a>
          — for transient or actionable messages that need a live region; Empty State stays static.
        </li>
        <li>
          <a routerLink="/components/card" class="text-primary-600 hover:underline">Card</a>
          — wrap Empty State in an outlined card when it sits inside a section that needs visual containment.
        </li>
        <li>
          <a routerLink="/components/table" class="text-primary-600 hover:underline">Table</a>
          — embed
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant="inline"</code>
          inside a colspan'd row when the table has no results.
        </li>
      </ul>
    </section>
  `,
})
export class EmptyStateOverview {
  protected readonly basicUsageSnippet = `<tw-empty-state
  title="No messages"
  description="When you receive a message it'll appear here."
/>`;

  protected readonly importSnippet = `import {
  EmptyStateComponent,
  EmptyStateIconDirective,
  EmptyStateTitleDirective,
  EmptyStateDescriptionDirective,
  EmptyStateActionsDirective,
} from '@cdevhub/ngx-tw/empty-state';`;
}
