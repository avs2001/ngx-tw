import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  EmptyStateComponent,
  EmptyStateIconDirective,
  EmptyStateTitleDirective,
  EmptyStateActionsDirective,
} from '@cdevhub/ngx-tw/empty-state';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { IconComponent } from '@cdevhub/ngx-tw/icon';
import { BadgeComponent } from '@cdevhub/ngx-tw/badge';
import { CardComponent, CardBodyDirective } from '@cdevhub/ngx-tw/card';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwSize } from '@cdevhub/ngx-tw/core';
import type { EmptyStateTitleLevel, EmptyStateVariant } from '@cdevhub/ngx-tw/empty-state';

const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const VARIANTS: EmptyStateVariant[] = ['centered', 'inline'];
const TITLE_LEVELS: EmptyStateTitleLevel[] = [1, 2, 3, 4, 5, 6];

@Component({
  selector: 'app-empty-state-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    EmptyStateComponent,
    EmptyStateIconDirective,
    EmptyStateTitleDirective,
    EmptyStateActionsDirective,
    ButtonDirective,
    IconComponent,
    BadgeComponent,
    CardComponent,
    CardBodyDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- ─────────────── Variants ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input controls the layout axis. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">centered</code>
        when the empty state owns a full region (a page, a panel, a card body) — children
        stack vertically and align to center. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code>
        when the empty state has to share a single row with neighbours, like a table's empty
        row or a sidebar slot.
      </p>

      <div class="space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Centered</p>
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <tw-empty-state
              title="No projects yet"
              description="Create your first project to start tracking work."
            >
              <button twButton variant="solid" color="primary" twEmptyStateActions>
                New project
              </button>
            </tw-empty-state>
          </div>
        </div>

        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Inline</p>
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <tw-empty-state
              variant="inline"
              title="No matching tasks"
              description="Adjust filters to broaden the search."
            >
              <button twButton variant="ghost" size="sm" twEmptyStateActions>
                Reset filters
              </button>
            </tw-empty-state>
          </div>
        </div>
      </div>

      <tw-code-block [code]="variantsSnippet" language="html" class="mt-4" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code>
        variant tightens vertical padding per size so the empty state can sit inside a
        table row without dominating it; horizontal padding still follows the size scale.
      </p>
    </section>

    <!-- ─────────────── Sizes ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input controls overall padding, child gap, and the fallback icon's scale. The
        title typography is locked at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-sm font-semibold</code>
        at every size — visual hierarchy at larger sizes comes from breathing room and a
        larger glyph, not bigger heading text.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (s of sizes; track s) {
            <div class="rounded-md border border-border-muted bg-surface">
              <p class="text-[10px] font-medium text-fg-muted px-3 pt-2 uppercase tracking-wide">size = {{ s }}</p>
              <tw-empty-state [size]="s" title="No items" description="Nothing to show yet." />
            </div>
          }
        </div>
      </div>

      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- ─────────────── With Icons (custom illustration) ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icons</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default illustration is a fallback
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon name="inbox"</code>.
        Override it by projecting any element with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twEmptyStateIcon</code> —
        a different
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon</code>,
        a hand-authored SVG, or an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;img&gt;</code>.
        Decorative icons should carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>;
        meaningful illustrations should carry an accessible name.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tw-empty-state title="Inbox zero" description="Everything's caught up.">
            <tw-icon twEmptyStateIcon name="check-circle" size="xl" color="success" aria-hidden="true" />
          </tw-empty-state>

          <tw-empty-state title="No results" description="Try a different search term.">
            <tw-icon twEmptyStateIcon name="search" size="xl" color="neutral" aria-hidden="true" />
          </tw-empty-state>
        </div>
      </div>

      <tw-code-block [code]="iconsSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Projected icons size themselves — the component's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input only feeds the fallback icon. Need a 40px glyph beyond
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon</code>'s
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        (32px) step? Project a hand-authored
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;svg twEmptyStateIcon class="size-10"&gt;</code>.
      </p>
    </section>

    <!-- ─────────────── Custom title slot ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom title slot</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">title</code>
        input is fine for plain strings — but when you need an inline badge, an icon, or a
        link inside the heading, reach for the structural
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twEmptyStateTitle</code>
        directive. The component still renders the wrapping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;hN&gt;</code>
        (per
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">titleLevel</code>)
        and applies its typography classes; you control the inner content.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-empty-state description="Search returned nothing matching that query.">
          <span *twEmptyStateTitle class="inline-flex items-center gap-2">
            No results
            <span twBadge color="neutral" size="sm">0</span>
          </span>
        </tw-empty-state>
      </div>

      <tw-code-block [code]="customTitleSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Projected content replaces the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">title</code>
        input — when both are present, the projection wins. The same pattern works for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twEmptyStateDescription</code>.
      </p>
    </section>

    <!-- ─────────────── Inside a card ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside a card</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Empty State is unstyled at the root — no border, no background. Wrap it in
        <a routerLink="/components/card" class="text-primary-600 hover:underline">Card</a>
        (or any container with the look you want) when it should read as a contained
        section instead of bare canvas.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-card variant="outline">
          <div twCardBody>
            <tw-empty-state
              title="No team members"
              description="Invite collaborators to share this workspace."
            >
              <div twEmptyStateActions>
                <button twButton variant="solid" color="primary">Invite people</button>
                <button twButton variant="ghost">Learn more</button>
              </div>
            </tw-empty-state>
          </div>
        </tw-card>
      </div>

      <tw-code-block [code]="cardSnippet" language="html" />
    </section>

    <!-- ─────────────── Inline in a table ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inline in a table empty row</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inline</code>
        variant exists for table-empty-row contexts: short vertical footprint, icon next
        to text instead of above it, actions pushed to the trailing edge. Wrap it in a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;td colspan&gt;</code>
        that spans every column so it visually owns the row.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="border border-border rounded-md overflow-hidden">
          <table class="w-full text-sm">
            <thead class="bg-surface-muted">
              <tr class="text-left">
                <th class="px-4 py-2 font-medium text-fg-muted">Title</th>
                <th class="px-4 py-2 font-medium text-fg-muted">Owner</th>
                <th class="px-4 py-2 font-medium text-fg-muted">Status</th>
                <th class="px-4 py-2 font-medium text-fg-muted">Updated</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td colspan="4" class="bg-surface">
                  <tw-empty-state
                    variant="inline"
                    size="sm"
                    title="No matching rows"
                    description="Adjust filters to see results."
                  >
                    <button twButton variant="ghost" size="sm" twEmptyStateActions>
                      Reset filters
                    </button>
                  </tw-empty-state>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <tw-code-block [code]="tableSnippet" language="html" />
    </section>

    <!-- ─────────────── Live-announcement wrapper ─────────────── -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Live-announcement wrapper</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Empty State is intentionally silent — it does not set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live</code>
        on its host. When the empty state appears in response to user action (e.g. a
        search returning no results), wrap it yourself in a polite live region so screen
        readers announce the change.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div role="status" aria-live="polite">
          <tw-empty-state
            size="sm"
            title="No results"
            description="No items match your search."
          >
            <tw-icon twEmptyStateIcon name="search" size="lg" color="neutral" aria-hidden="true" />
          </tw-empty-state>
        </div>
      </div>

      <tw-code-block [code]="liveSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>
        for transient empty states (search, filter changes). Static empty states that
        appear on page load do not need a live region — the rendered heading already
        belongs to the document outline.
      </p>
    </section>

    <!-- ─────────────── Playground ─────────────── -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Toggle the variant and size to see the layout shift,
        change the title level to verify the rendered tag, and clear the title or
        description to confirm the component omits the empty region instead of stamping
        a blank element.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <!-- Control row -->
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playVariant() === v"
                  [class.!text-primary-700]="playVariant() === v"
                  (click)="playVariant.set(v)"
                >{{ v }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Title level</label>
            <div class="flex gap-1">
              @for (l of titleLevels; track l) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playTitleLevel() === l"
                  [class.!text-primary-700]="playTitleLevel() === l"
                  (click)="playTitleLevel.set(l)"
                >h{{ l }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Show title</label>
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="playShowTitle()"
              [class.!text-primary-700]="playShowTitle()"
              (click)="playShowTitle.set(!playShowTitle())"
            >{{ playShowTitle() ? 'on' : 'off' }}</button>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Show description</label>
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="playShowDescription()"
              [class.!text-primary-700]="playShowDescription()"
              (click)="playShowDescription.set(!playShowDescription())"
            >{{ playShowDescription() ? 'on' : 'off' }}</button>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Show actions</label>
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="playShowActions()"
              [class.!text-primary-700]="playShowActions()"
              (click)="playShowActions.set(!playShowActions())"
            >{{ playShowActions() ? 'on' : 'off' }}</button>
          </div>
        </div>

        <!-- Live preview -->
        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-empty-state
            [variant]="playVariant()"
            [size]="playSize()"
            [titleLevel]="playTitleLevel()"
            [title]="playShowTitle() ? 'No projects yet' : undefined"
            [description]="playShowDescription() ? 'Create your first project to start tracking work.' : undefined"
          >
            @if (playShowActions()) {
              <div twEmptyStateActions>
                <button twButton variant="solid" color="primary" size="sm">New project</button>
                <button twButton variant="ghost" size="sm">Import</button>
              </div>
            }
          </tw-empty-state>
        </div>
      </div>
    </section>
  `,
})
export class EmptyStateExamples {
  protected readonly sizes = SIZES;
  protected readonly variants = VARIANTS;
  protected readonly titleLevels = TITLE_LEVELS;

  // Playground state
  protected readonly playVariant = signal<EmptyStateVariant>('centered');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playTitleLevel = signal<EmptyStateTitleLevel>(3);
  protected readonly playShowTitle = signal(true);
  protected readonly playShowDescription = signal(true);
  protected readonly playShowActions = signal(true);

  // ── snippets ──

  protected readonly variantsSnippet = `<!-- Centered (default) -->
<tw-empty-state
  title="No projects yet"
  description="Create your first project to start tracking work."
>
  <button twButton variant="solid" color="primary" twEmptyStateActions>
    New project
  </button>
</tw-empty-state>

<!-- Inline -->
<tw-empty-state
  variant="inline"
  title="No matching tasks"
  description="Adjust filters to broaden the search."
>
  <button twButton variant="ghost" size="sm" twEmptyStateActions>
    Reset filters
  </button>
</tw-empty-state>`;

  protected readonly sizesSnippet = `@for (s of sizes; track s) {
  <tw-empty-state [size]="s" title="No items" description="Nothing to show yet." />
}`;

  protected readonly iconsSnippet = `<tw-empty-state title="Inbox zero" description="Everything's caught up.">
  <tw-icon twEmptyStateIcon name="check-circle" size="xl" color="success" aria-hidden="true" />
</tw-empty-state>

<tw-empty-state title="No results" description="Try a different search term.">
  <tw-icon twEmptyStateIcon name="search" size="xl" color="neutral" aria-hidden="true" />
</tw-empty-state>`;

  protected readonly customTitleSnippet = `<tw-empty-state description="Search returned nothing matching that query.">
  <span *twEmptyStateTitle class="inline-flex items-center gap-2">
    No results
    <span twBadge color="neutral" size="sm">0</span>
  </span>
</tw-empty-state>`;

  protected readonly cardSnippet = `<tw-card variant="outline">
  <div twCardBody>
    <tw-empty-state
      title="No team members"
      description="Invite collaborators to share this workspace."
    >
      <div twEmptyStateActions>
        <button twButton variant="solid" color="primary">Invite people</button>
        <button twButton variant="ghost">Learn more</button>
      </div>
    </tw-empty-state>
  </div>
</tw-card>`;

  protected readonly tableSnippet = `<table>
  <thead>
    <tr><th>Title</th><th>Owner</th><th>Status</th><th>Updated</th></tr>
  </thead>
  <tbody>
    <tr>
      <td colspan="4">
        <tw-empty-state
          variant="inline"
          size="sm"
          title="No matching rows"
          description="Adjust filters to see results."
        >
          <button twButton variant="ghost" size="sm" twEmptyStateActions>
            Reset filters
          </button>
        </tw-empty-state>
      </td>
    </tr>
  </tbody>
</table>`;

  protected readonly liveSnippet = `<div role="status" aria-live="polite">
  @if (results().length === 0) {
    <tw-empty-state
      title="No results"
      description="No items match your search."
    >
      <tw-icon twEmptyStateIcon name="search" size="lg" color="neutral" aria-hidden="true" />
    </tw-empty-state>
  }
</div>`;
}
