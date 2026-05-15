import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProgressBarComponent } from 'ngx-tw/progress-bar';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-progress-bar-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressBarComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Progress Bar component visualises task completion, implementing the WAI-ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">progressbar</code>
        pattern. Use it whenever progress is measurable — uploads, multi-step wizards,
        skill bars — or to signal that unquantifiable work is under way with an
        indeterminate sweep. For open-ended loading where there is no bar to fill,
        prefer a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-spinner</code>
        instead.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The bar exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="progressbar"</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemin</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemax</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>.
        When no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        is supplied the bar switches to indeterminate: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>
        are dropped and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy="true"</code>
        is set so assistive tech announces ongoing activity. An accessible name is
        required — supply
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>,
        or one of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.ariaLabel</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.ariaLabelledby</code>;
        the fill animation respects
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-progress-bar label="Syncing files" [value]="42" [options]="{ showValue: true }" />
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
        <li>2 variants: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linear</code> continuous fill and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">segmented</code> discrete steps</li>
        <li>Determinate mode with a clamped
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
          over any
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.min</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.max</code>
          range
        </li>
        <li>Indeterminate sweep when
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
          is omitted, with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy="true"</code>
          for assistive tech
        </li>
        <li>8 semantic colors including
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
          to reflect task outcome
        </li>
        <li>3 thicknesses (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>) with a tabular-nums value readout</li>
        <li>Custom
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.formatter</code>
          for byte counts, fractions, and other non-percent displays
        </li>
        <li>Fully
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">progressbar</code>-role compliant with automatic
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>
          wiring when
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
          is set
        </li>
        <li>Honours
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>
          — the sweep and width transitions disable when the user opts out
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/spinner" class="text-primary-600 hover:underline">Spinner</a>
          — for open-ended loading with no measurable progress.
        </li>
        <li>
          <a routerLink="/components/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — for content placeholders while data is fetched.
        </li>
        <li>
          <a routerLink="/components/stepper" class="text-primary-600 hover:underline">Stepper</a>
          — when multi-step progress needs per-step labels and navigation, not just a fill.
        </li>
      </ul>
    </section>
  `,
})
export class ProgressBarOverview {
  protected readonly basicUsageSnippet = `<tw-progress-bar
  label="Syncing files"
  [value]="42"
  [options]="{ showValue: true }"
/>`;

  protected readonly importSnippet = `import { ProgressBarComponent } from 'ngx-tw/progress-bar';`;
}
