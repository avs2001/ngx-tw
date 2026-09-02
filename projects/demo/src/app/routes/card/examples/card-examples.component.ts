import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  CardComponent,
  CardHeaderDirective,
  CardBodyDirective,
  CardFooterDirective,
  CardMediaDirective,
} from '@cdevhub/ngx-tw/card';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import type { CardVariant } from '@cdevhub/ngx-tw/card';

const VARIANTS: CardVariant[] = ['elevated', 'outline', 'ghost'];
const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

interface ColorSample {
  readonly color: TwColor;
  readonly title: string;
  readonly body: string;
}

const COLOR_SAMPLES: readonly ColorSample[] = [
  { color: 'primary', title: 'New release', body: 'Version 3.4 is ready to deploy to staging.' },
  { color: 'secondary', title: 'Draft saved', body: 'Autosaved 2 minutes ago to your private workspace.' },
  { color: 'accent', title: 'Pinned', body: 'This report was pinned by the Growth team.' },
  { color: 'neutral', title: 'In sync', body: 'No changes since last sync 14 minutes ago.' },
  { color: 'info', title: 'Quick tip', body: 'Press ⌘K to open the command palette from any page.' },
  { color: 'success', title: 'CI passed', body: 'All 1,248 tests passed across 6 packages.' },
  { color: 'warning', title: 'Expiring', body: 'SSL certificate for app.acme.com expires in 7 days.' },
  { color: 'error', title: 'Webhook failed', body: 'Stripe webhook returned 500 · retry scheduled in 30s.' },
];

@Component({
  selector: 'app-card-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    CardHeaderDirective,
    CardBodyDirective,
    CardFooterDirective,
    CardMediaDirective,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the card's visual weight without changing its semantics. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>
        when the card should float above the page (dashboards, highlighted content),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        when it sits in a denser layout and needs a quiet boundary (forms, settings
        panels), and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        when the surface should be invisible and only the dividers carry structure (list
        rows, inline groupings).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (v of variants; track v) {
            <tw-card [variant]="v">
              <div twCardHeader>Starter plan</div>
              <div twCardBody>
                <p class="text-2xl font-semibold text-fg mb-1">$29<span class="text-xs text-fg-muted font-normal">/mo</span></p>
                <p>Up to 10 team members, unlimited projects, and community support.</p>
              </div>
              <div twCardFooter>{{ v }}</div>
            </tw-card>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        All three variants share the same structural slots. Switching variants is a purely
        visual change — header, body, footer, and media dividers behave identically.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the border of the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        variant — it has no effect on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>.
        Pair colors with their semantic roles:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        for confirmations,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>
        for soft alerts, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        for failures.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
          @for (sample of colorSamples; track sample.color) {
            <tw-card variant="outline" [color]="sample.color" size="sm">
              <div twCardHeader>{{ sample.title }}</div>
              <div twCardBody>{{ sample.body }}</div>
            </tw-card>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        For louder, filled alert surfaces, use the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Alert</code>
        component instead — Card's color support is intentionally quiet so the content
        stays the focus.
      </p>
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the padding of every structural section (header, body, footer)
        uniformly. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for dense dashboards and inline list cards, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        when the card is the primary focus of the viewport.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 gap-3">
          @for (s of sizes; track s) {
            <tw-card variant="outline" [size]="s">
              <div twCardHeader>Size: {{ s }}</div>
              <div twCardBody>
                The padding scales with the size input — header, body, and footer share the same rhythm.
              </div>
            </tw-card>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Sections -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sections</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A card's three structural slots —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCardHeader</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCardBody</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCardFooter</code>
        — render automatic dividers between whichever ones you project. Use the header for
        a title, the body for the primary content, and the footer for metadata or actions.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-md">
          <tw-card class="block">
            <div twCardHeader>
              <div class="flex items-center justify-between">
                <span>Delete workspace</span>
                <span class="text-xs font-normal text-error-600">Destructive</span>
              </div>
            </div>
            <div twCardBody>
              <p class="mb-2">
                This permanently deletes the <strong class="text-fg">Growth</strong>
                workspace, including 12 projects and 4,103 assets.
              </p>
              <p class="text-fg-muted">
                Team members will lose access immediately. This action cannot be undone.
              </p>
            </div>
            <div twCardFooter>
              <div class="flex items-center justify-end gap-2">
                <button twButton variant="ghost" color="neutral" size="xs">Cancel</button>
                <button twButton variant="solid" color="error" size="xs">Delete workspace</button>
              </div>
            </div>
          </tw-card>
        </div>
      </div>
      <tw-code-block [code]="sectionsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Each slot is optional — a body-only card has no dividers, and a header-plus-body
        card shows a single divider between them. The card never renders a section it
        wasn't asked to.
      </p>
    </section>

    <!-- Media placement -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Media placement</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCardMedia</code>
        directive marks a full-bleed region with no padding, so images, charts, and
        gradient headers sit flush against the card's edges. Its placement is up to you —
        put it above the header for a classic blog-post card, between header and body for
        a cover/detail split, or below the body as a trailing accent.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <tw-card>
            <div
              twCardMedia
              class="h-32 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500 flex items-end p-4"
            >
              <span class="text-xs font-medium text-white/90 uppercase tracking-wide">Engineering</span>
            </div>
            <div twCardBody>
              <p class="font-semibold text-fg mb-1">Shipping the new command palette</p>
              <p class="text-fg-muted mb-3">
                How we rebuilt the search bar on top of CDK overlays and what we learned
                about keyboard navigation along the way.
              </p>
              <p class="text-xs text-fg-subtle">6 min read · April 18, 2026</p>
            </div>
          </tw-card>

          <tw-card>
            <div twCardHeader>Quarterly active users</div>
            <div twCardBody>
              <p class="text-2xl font-semibold text-fg mb-1">28,401</p>
              <p class="text-fg-muted">
                Up <strong class="text-success-fg">12.4%</strong> from last quarter.
              </p>
            </div>
            <div
              twCardMedia
              class="h-16 bg-gradient-to-r from-success-100 via-success-200 to-success-400"
              aria-hidden="true"
            ></div>
          </tw-card>
        </div>
      </div>
      <tw-code-block [code]="mediaSnippet" language="html" />
    </section>

    <!-- Body only -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Body only</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Projecting only
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCardBody</code>
        yields a single-region card with no dividers — useful for information tiles,
        callouts, or list rows where a header and footer would feel like ceremony.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm">
          <tw-card variant="outline" class="block">
            <div twCardBody>
              <div class="flex items-start gap-3">
                <div class="flex size-10 items-center justify-center rounded-full bg-primary-50 text-primary-600 text-sm font-semibold shrink-0">
                  AM
                </div>
                <div class="min-w-0">
                  <p class="text-fg font-medium">Alice Morgan</p>
                  <p class="text-fg-muted">Invited 3 teammates to the Growth workspace.</p>
                  <p class="text-xs text-fg-subtle mt-1">Just now</p>
                </div>
              </div>
            </div>
          </tw-card>
        </div>
      </div>
      <tw-code-block [code]="bodyOnlySnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        with a semantic color for a themed boundary, or switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        and toggle the structural sections off to see how the card collapses into its
        content.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-6 mb-6">
          <div class="flex flex-wrap gap-4">
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
              <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
              <div class="flex flex-wrap gap-1">
                @for (c of colors; track c) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playColor() === c"
                    [class.!text-primary-700]="playColor() === c"
                    (click)="playColor.set(c)"
                  >{{ c }}</button>
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
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Sections</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playHeader()"
                [class.!text-primary-700]="playHeader()"
                (click)="playHeader.update(v => !v)"
              >header</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playFooter()"
                [class.!text-primary-700]="playFooter()"
                (click)="playFooter.update(v => !v)"
              >footer</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playMedia()"
                [class.!text-primary-700]="playMedia()"
                (click)="playMedia.update(v => !v)"
              >media</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <div class="mx-auto max-w-md">
            <tw-card [variant]="playVariant()" [color]="playColor()" [size]="playSize()" class="block">
              @if (playMedia()) {
                <div
                  twCardMedia
                  class="h-24 bg-gradient-to-br from-primary-300 via-accent-300 to-primary-500"
                  aria-hidden="true"
                ></div>
              }
              @if (playHeader()) {
                <div twCardHeader>Release 3.4 is live</div>
              }
              <div twCardBody>
                <p class="mb-1">
                  The new command palette ships with type-ahead search, recent actions,
                  and workspace-scoped shortcuts.
                </p>
                <p class="text-fg-muted">Rollout completes across all regions in roughly 20 minutes.</p>
              </div>
              @if (playFooter()) {
                <div twCardFooter>
                  <div class="flex items-center justify-between">
                    <span>Ship log · Platform team</span>
                    <button twButton variant="ghost" color="primary" size="xs">View changelog</button>
                  </div>
                </div>
              }
            </tw-card>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class CardExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly colorSamples = COLOR_SAMPLES;

  protected readonly playVariant = signal<CardVariant>('elevated');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playHeader = signal(true);
  protected readonly playFooter = signal(true);
  protected readonly playMedia = signal(false);

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-card [variant]="v">
    <div twCardHeader>Starter plan</div>
    <div twCardBody>
      <p>$29/mo</p>
      <p>Up to 10 team members, unlimited projects, and community support.</p>
    </div>
    <div twCardFooter>{{ v }}</div>
  </tw-card>
}`.trim();

  protected readonly colorsSnippet = `
@for (sample of colorSamples; track sample.color) {
  <tw-card variant="outline" [color]="sample.color" size="sm">
    <div twCardHeader>{{ sample.title }}</div>
    <div twCardBody>{{ sample.body }}</div>
  </tw-card>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-card variant="outline" [size]="s">
    <div twCardHeader>Size: {{ s }}</div>
    <div twCardBody>
      The padding scales with the size input.
    </div>
  </tw-card>
}`.trim();

  protected readonly sectionsSnippet = `<tw-card>
  <div twCardHeader>
    <div class="flex items-center justify-between">
      <span>Delete workspace</span>
      <span class="text-xs font-normal text-error-600">Destructive</span>
    </div>
  </div>
  <div twCardBody>
    <p>This permanently deletes the Growth workspace, including 12 projects and 4,103 assets.</p>
    <p>Team members will lose access immediately. This action cannot be undone.</p>
  </div>
  <div twCardFooter>
    <div class="flex items-center justify-end gap-2">
      <button twButton variant="ghost" color="neutral" size="xs">Cancel</button>
      <button twButton variant="solid" color="error" size="xs">Delete workspace</button>
    </div>
  </div>
</tw-card>`;

  protected readonly mediaSnippet = `<!-- Top media: blog preview -->
<tw-card>
  <div twCardMedia class="h-32 bg-gradient-to-br from-primary-400 via-primary-500 to-accent-500">
    <!-- hero image or cover art -->
  </div>
  <div twCardBody>
    <p class="font-semibold">Shipping the new command palette</p>
    <p>How we rebuilt the search bar on top of CDK overlays.</p>
  </div>
</tw-card>

<!-- Bottom media: stat card with trend strip -->
<tw-card>
  <div twCardHeader>Quarterly active users</div>
  <div twCardBody>
    <p>28,401</p>
    <p>Up 12.4% from last quarter.</p>
  </div>
  <div twCardMedia class="h-16 bg-gradient-to-r from-success-100 via-success-200 to-success-400"></div>
</tw-card>`;

  protected readonly bodyOnlySnippet = `<tw-card variant="outline">
  <div twCardBody>
    <div class="flex items-start gap-3">
      <div class="avatar">AM</div>
      <div>
        <p class="font-medium">Alice Morgan</p>
        <p>Invited 3 teammates to the Growth workspace.</p>
        <p class="text-xs">Just now</p>
      </div>
    </div>
  </div>
</tw-card>`;
}
