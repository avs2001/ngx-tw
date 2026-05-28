import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import {
  CardComponent,
  CardHeaderDirective,
  CardBodyDirective,
  CardFooterDirective,
} from 'ngx-tw/card';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-card-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CardComponent,
    CardHeaderDirective,
    CardBodyDirective,
    CardFooterDirective,
    CodeBlockComponent,
    RouterLink,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Card component groups related content inside a styled container with
        consistent padding, optional elevation, and automatic dividers between
        structural sections. It is purely presentational — semantics come from the
        content projected into it — so it composes naturally with headings, lists,
        form controls, buttons, or media. Reach for a card whenever a group of
        information benefits from a clear visual boundary and its own surface.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="mx-auto max-w-sm">
          <tw-card class="block">
            <div twCardHeader>Q1 revenue report</div>
            <div twCardBody>
              <p class="mb-1">Total revenue climbed to <strong class="text-fg">$2.4M</strong>, up 18% year-over-year.</p>
              <p class="text-fg-muted">Enterprise contracts drove the majority of the increase, with SMB flat quarter-over-quarter.</p>
            </div>
            <div twCardFooter>Updated April 22, 2026 · Finance team</div>
          </tw-card>
        </div>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Composition patterns</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The card is intentionally non-interactive and unannotated for assistive
        technology — it is a styling container, not a semantic element. When a card
        needs keyboard focus, click handling, or a landmark role, compose the right
        primitive around or inside it instead of adding inputs to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-card</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mt-6 mb-2">Clickable card</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-3">
        Wrap the card in a native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;a&gt;</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;button&gt;</code>
        when the whole surface should activate a single destination. The native
        element supplies the role, tab stop, keyboard handling, and focus ring; the
        card stays purely visual.
      </p>
      <tw-code-block [code]="clickableCardSnippet" language="html" />

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mt-6 mb-2">Interactive rows inside a card</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-3">
        For a list of selectable rows inside a card, use
        <a routerLink="/item" class="text-primary-600 hover:underline">tw-item</a>
        with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">interactive</code>
        input. Each item carries its own role, tabindex, focus ring, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>
        output — the card only frames them.
      </p>
      <tw-code-block [code]="interactiveRowSnippet" language="html" />

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mt-6 mb-2">Card as a landmark region</h3>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-3">
        When a card represents a discrete document region (an article preview, a
        labelled stat panel), promote it to a landmark by adding
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role</code>
        and an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
        pointing at the header element. The card stays a generic container; the
        consumer chooses the semantic.
      </p>
      <tw-code-block [code]="landmarkSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Three variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>,
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code></li>
        <li>Semantic color tinting on outlined borders across all eight library colors</li>
        <li>Five sizes controlling section padding from
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
          to
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code></li>
        <li>Directive-based slots for header, body, footer, and full-bleed media</li>
        <li>Automatic dividers between header/body/footer when all three are present</li>
        <li>Consumer controls ordering — place media at the top, the bottom, or between sections</li>
        <li>Flat DOM — no wrapper elements beyond the projected content</li>
        <li>Class merging via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tailwind-variants</code>
          so consumer overrides resolve cleanly against internal classes</li>
        <li>Dark-mode-aware through semantic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">surface</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">border</code>
          tokens</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/alert" class="text-primary-600 hover:underline">Alert</a>
          — narrower container focused on informational or status messages.
        </li>
        <li>
          <a routerLink="/dialog" class="text-primary-600 hover:underline">Dialog</a>
          — modal surface for interactive content that interrupts the user.
        </li>
        <li>
          <a routerLink="/accordion" class="text-primary-600 hover:underline">Accordion</a>
          and
          <a routerLink="/collapsible" class="text-primary-600 hover:underline">Collapsible</a>
          — better when grouped content needs to expand and collapse.
        </li>
        <li>
          <a routerLink="/item" class="text-primary-600 hover:underline">Item</a>
          — a leading/title/description primitive for list rows inside a card body.
        </li>
      </ul>
    </section>
  `,
})
export class CardOverview {
  protected readonly basicUsageSnippet = `<tw-card>
  <div twCardHeader>Q1 revenue report</div>
  <div twCardBody>
    <p>Total revenue climbed to <strong>$2.4M</strong>, up 18% year-over-year.</p>
    <p>Enterprise contracts drove the majority of the increase.</p>
  </div>
  <div twCardFooter>Updated April 22, 2026 · Finance team</div>
</tw-card>`;

  protected readonly importSnippet = `import {
  CardComponent,
  CardHeaderDirective,
  CardBodyDirective,
  CardFooterDirective,
  CardMediaDirective,
} from 'ngx-tw/card';`;

  protected readonly clickableCardSnippet = `<a routerLink="/reports/q1" class="block focus:outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded-lg">
  <tw-card>
    <div twCardHeader>Q1 revenue report</div>
    <div twCardBody>
      <p>Total revenue climbed to $2.4M, up 18% year-over-year.</p>
    </div>
    <div twCardFooter>Updated April 22, 2026</div>
  </tw-card>
</a>`;

  protected readonly interactiveRowSnippet = `<tw-card variant="outlined" size="xs">
  @for (member of teamMembers; track member.id) {
    <tw-item
      twCardBody
      interactive
      (selected)="openProfile(member)"
    >
      <span twItemTitle>{{ member.name }}</span>
      <span twItemDescription>{{ member.role }}</span>
    </tw-item>
  }
</tw-card>`;

  protected readonly landmarkSnippet = `<tw-card role="region" aria-labelledby="q1-report-title">
  <div twCardHeader id="q1-report-title">Q1 revenue report</div>
  <div twCardBody>
    <p>Total revenue climbed to $2.4M, up 18% year-over-year.</p>
  </div>
</tw-card>`;
}
