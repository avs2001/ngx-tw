import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  TabNavComponent,
  TabLinkDirective,
  TabNavPanel,
  type TabNavVariant,
} from 'ngx-tw/tab-nav';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const VARIANTS: TabNavVariant[] = ['underline', 'enclosed', 'pill'];
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

@Component({
  selector: 'app-tab-nav-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TabNavComponent,
    TabLinkDirective,
    TabNavPanel,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change how the strip sits in a layout.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>
        is the quietest option and fits flush under a page header;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>
        reads as a set of folder-style tabs over a bordered region; and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        gives a self-contained toggle group that works without an anchoring baseline.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <nav twTabNav [variant]="v" [attr.aria-label]="v + ' variant demo'">
                @for (link of links; track link) {
                  <a
                    twTabLink
                    href="#"
                    [active]="activeByVariant()[v] === link"
                    (click)="selectByVariant(v, link, $event)"
                  >
                    {{ link }}
                  </a>
                }
              </nav>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the active link's indicator and text. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main navigation, the semantic colors to match a themed surface, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        when the nav should read as structural chrome rather than a brand element.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (c of colors; track c) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ c }}</p>
              <nav twTabNav [color]="c" [attr.aria-label]="c + ' color demo'">
                <a
                  twTabLink
                  href="#"
                  [active]="activeByColor()[c] === 'a'"
                  (click)="selectByColor(c, 'a', $event)"
                >
                  Overview
                </a>
                <a
                  twTabLink
                  href="#"
                  [active]="activeByColor()[c] === 'b'"
                  (click)="selectByColor(c, 'b', $event)"
                >
                  Details
                </a>
                <a
                  twTabLink
                  href="#"
                  [active]="activeByColor()[c] === 'c'"
                  (click)="selectByColor(c, 'c', $event)"
                >
                  Activity
                </a>
              </nav>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the padding and font scale of every link. Match the size to the
        surrounding layout —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        reads well in a compact toolbar, the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        suits most page-level navigation, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        works for feature-level nav where the strip is the primary control.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ s }}</p>
              <nav twTabNav [size]="s" [attr.aria-label]="s + ' size demo'">
                @for (link of links; track link) {
                  <a
                    twTabLink
                    href="#"
                    [active]="activeBySize()[s] === link"
                    (click)="selectBySize(s, link, $event)"
                  >
                    {{ link }}
                  </a>
                }
              </nav>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Fitted -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Fitted (equal-width links)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[fitted]="true"</code>
        to stretch every link so they evenly divide the available width. This reads well
        with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        variant for small option sets where the strip itself acts as a mini segmented
        control; for long labels with many items, prefer the default un-fitted layout so
        labels keep their natural width.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <nav twTabNav variant="pill" [fitted]="true" aria-label="Fitted demo">
          @for (range of ranges; track range) {
            <a
              twTabLink
              href="#"
              [active]="fittedActive() === range"
              (click)="selectFitted(range, $event)"
            >
              {{ range }}
            </a>
          }
        </nav>
      </div>
      <tw-code-block [code]="fittedSnippet" language="html" />
    </section>

    <!-- With Panel (ARIA tabs pattern) -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Panel (ARIA tabs pattern)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-tab-nav-panel&gt;</code>
        reference through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[tabPanel]</code>
        to switch the nav into the WAI-ARIA tabs pattern — the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;nav&gt;</code>
        becomes a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tablist</code>,
        links become
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tab</code>s
        with roving focus, and arrow keys move focus between links. Reach for this when the
        active content lives inside the same page rather than on a different route.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <nav twTabNav [tabPanel]="panel" aria-label="Settings tabs">
          <a
            twTabLink
            href="#"
            linkId="panel-link-account"
            [active]="panelActive() === 'a'"
            (click)="selectPanel('a', $event)"
          >
            Account
          </a>
          <a
            twTabLink
            href="#"
            linkId="panel-link-billing"
            [active]="panelActive() === 'b'"
            (click)="selectPanel('b', $event)"
          >
            Billing
          </a>
          <a
            twTabLink
            href="#"
            linkId="panel-link-team"
            [active]="panelActive() === 'c'"
            (click)="selectPanel('c', $event)"
          >
            Team
          </a>
        </nav>
        <tw-tab-nav-panel #panel class="block pt-4 text-sm text-fg-muted">
          @switch (panelActive()) {
            @case ('a') { <p>Manage your account details and preferences.</p> }
            @case ('b') { <p>Review invoices, payment methods, and plan options.</p> }
            @case ('c') { <p>Invite teammates and manage seats.</p> }
          }
        </tw-tab-nav-panel>
      </div>
      <tw-code-block [code]="panelSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The panel exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tabpanel"</code>
        and mirrors the active link's id in its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>,
        so assistive tech can announce which tab owns the visible content.
      </p>
    </section>

    <!-- Disabled -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled link</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A disabled link is dimmed, sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>,
        and blocks both clicks and Enter/Space via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">preventDefault</code>
        — so even a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">routerLink</code>
        binding on the anchor will not navigate. Arrow-key focus in the tabs pattern skips
        disabled links.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <nav twTabNav aria-label="Disabled demo">
          <a
            twTabLink
            href="#"
            [active]="disabledActive() === 'a'"
            (click)="selectDisabled('a', $event)"
          >
            Enabled
          </a>
          <a
            twTabLink
            href="#"
            [active]="disabledActive() === 'b'"
            (click)="selectDisabled('b', $event)"
          >
            Also Enabled
          </a>
          <a twTabLink href="#" [disabled]="true">Coming Soon</a>
        </nav>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every visual input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fitted</code>
        for a toolbar-style strip, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>
        at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        to match a top-level page header.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playVariant() === v"
                  [class.!text-primary-700]="playVariant() === v"
                  (click)="playVariant.set(v)"
                >
                  {{ v }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playColor() === c"
                  [class.!text-primary-700]="playColor() === c"
                  (click)="playColor.set(c)"
                >
                  {{ c }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playSize() === s"
                  [class.!text-primary-700]="playSize() === s"
                  (click)="playSize.set(s)"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Fitted</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playFitted()"
                [class.!text-primary-700]="playFitted()"
                (click)="playFitted.update(v => !v)"
              >
                fitted
              </button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <nav
            twTabNav
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [fitted]="playFitted()"
            aria-label="Playground"
          >
            @for (link of links; track link) {
              <a
                twTabLink
                href="#"
                [active]="playActive() === link"
                (click)="selectPlayground(link, $event)"
              >
                {{ link }}
              </a>
            }
          </nav>
        </div>
      </div>
    </section>
  `,
})
export class TabNavExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly links = ['Dashboard', 'Reports', 'Settings'];
  protected readonly ranges = ['Day', 'Week', 'Month', 'Year'];

  protected readonly activeByVariant = signal<Record<TabNavVariant, string>>({
    underline: 'Dashboard',
    enclosed: 'Dashboard',
    pill: 'Dashboard',
  });

  protected readonly activeByColor = signal<Record<TwColor, string>>({
    primary: 'a',
    secondary: 'a',
    accent: 'a',
    neutral: 'a',
    info: 'a',
    success: 'a',
    warning: 'a',
    error: 'a',
  });

  protected readonly activeBySize = signal<Record<TwSize, string>>({
    xs: 'Dashboard',
    sm: 'Dashboard',
    md: 'Dashboard',
    lg: 'Dashboard',
    xl: 'Dashboard',
  });

  protected readonly fittedActive = signal<string>('Week');
  protected readonly panelActive = signal<'a' | 'b' | 'c'>('a');
  protected readonly disabledActive = signal<string>('a');

  protected readonly playVariant = signal<TabNavVariant>('underline');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playFitted = signal(false);
  protected readonly playActive = signal<string>('Dashboard');

  protected selectByVariant(v: TabNavVariant, link: string, event: MouseEvent): void {
    event.preventDefault();
    this.activeByVariant.update(m => ({ ...m, [v]: link }));
  }

  protected selectByColor(c: TwColor, value: string, event: MouseEvent): void {
    event.preventDefault();
    this.activeByColor.update(m => ({ ...m, [c]: value }));
  }

  protected selectBySize(s: TwSize, link: string, event: MouseEvent): void {
    event.preventDefault();
    this.activeBySize.update(m => ({ ...m, [s]: link }));
  }

  protected selectFitted(range: string, event: MouseEvent): void {
    event.preventDefault();
    this.fittedActive.set(range);
  }

  protected selectPanel(value: 'a' | 'b' | 'c', event: MouseEvent): void {
    event.preventDefault();
    this.panelActive.set(value);
  }

  protected selectDisabled(value: string, event: MouseEvent): void {
    event.preventDefault();
    this.disabledActive.set(value);
  }

  protected selectPlayground(link: string, event: MouseEvent): void {
    event.preventDefault();
    this.playActive.set(link);
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <nav twTabNav [variant]="v" [attr.aria-label]="v + ' variant demo'">
    @for (link of links; track link) {
      <a
        twTabLink
        href="#"
        [active]="activeByVariant()[v] === link"
        (click)="selectByVariant(v, link, $event)"
      >
        {{ link }}
      </a>
    }
  </nav>
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <nav twTabNav [color]="c" [attr.aria-label]="c + ' color demo'">
    <a twTabLink href="#" [active]="activeByColor()[c] === 'a'"
       (click)="selectByColor(c, 'a', $event)">Overview</a>
    <a twTabLink href="#" [active]="activeByColor()[c] === 'b'"
       (click)="selectByColor(c, 'b', $event)">Details</a>
    <a twTabLink href="#" [active]="activeByColor()[c] === 'c'"
       (click)="selectByColor(c, 'c', $event)">Activity</a>
  </nav>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <nav twTabNav [size]="s" [attr.aria-label]="s + ' size demo'">
    @for (link of links; track link) {
      <a
        twTabLink
        href="#"
        [active]="activeBySize()[s] === link"
        (click)="selectBySize(s, link, $event)"
      >
        {{ link }}
      </a>
    }
  </nav>
}`.trim();

  protected readonly fittedSnippet = `<nav twTabNav variant="pill" [fitted]="true" aria-label="Fitted demo">
  @for (range of ranges; track range) {
    <a
      twTabLink
      href="#"
      [active]="fittedActive() === range"
      (click)="selectFitted(range, $event)"
    >
      {{ range }}
    </a>
  }
</nav>`;

  protected readonly panelSnippet = `<nav twTabNav [tabPanel]="panel" aria-label="Settings tabs">
  <a twTabLink href="#" linkId="panel-link-account"
     [active]="panelActive() === 'a'" (click)="selectPanel('a', $event)">Account</a>
  <a twTabLink href="#" linkId="panel-link-billing"
     [active]="panelActive() === 'b'" (click)="selectPanel('b', $event)">Billing</a>
  <a twTabLink href="#" linkId="panel-link-team"
     [active]="panelActive() === 'c'" (click)="selectPanel('c', $event)">Team</a>
</nav>
<tw-tab-nav-panel #panel>
  @switch (panelActive()) {
    @case ('a') { <p>Manage your account details and preferences.</p> }
    @case ('b') { <p>Review invoices, payment methods, and plan options.</p> }
    @case ('c') { <p>Invite teammates and manage seats.</p> }
  }
</tw-tab-nav-panel>`;

  protected readonly disabledSnippet = `<nav twTabNav aria-label="Disabled demo">
  <a twTabLink href="#" [active]="active() === 'a'" (click)="select('a', $event)">Enabled</a>
  <a twTabLink href="#" [active]="active() === 'b'" (click)="select('b', $event)">Also Enabled</a>
  <a twTabLink href="#" [disabled]="true">Coming Soon</a>
</nav>`;
}
