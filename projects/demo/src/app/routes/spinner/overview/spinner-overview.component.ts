import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { SpinnerComponent } from '@cdevhub/ngx-tw/spinner';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-spinner-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SpinnerComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Spinner component visualises an indeterminate activity — a network request, async
        validation, or any pending action whose duration you cannot predict. It ships three
        variants (circular, dots, bars), adopts the surrounding text color by default via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="current"</code>,
        and composes cleanly inside buttons, form fields, and inline text. The host element
        carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        with a visually-hidden label so assistive technology announces the activity, and animations
        respect
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-6">
          <tw-spinner />
          <tw-spinner variant="dots" color="info" />
          <tw-spinner variant="bars" color="success" />
          <tw-spinner size="lg" color="warning" />
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
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">circular</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dots</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bars</code>
        </li>
        <li>8 semantic colors plus
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'current'</code>
          which inherits from the surrounding text color
        </li>
        <li>5 sizes plus
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'inherit'</code>
          for text-scaled inline indicators (1em)
        </li>
        <li>Composes inside
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twButton][loading]</code>
          and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
          prefix / suffix slots without extra styling
        </li>
        <li>Optional track ring behind the circular stroke</li>
        <li>Accessible by default:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
          with an
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>
          visually-hidden label
        </li>
        <li>Honours
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>
          — animation is suppressed when users opt out
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/progress-bar" class="text-primary-600 hover:underline">Progress Bar</a>
          — use this instead when you know the completion percentage. Spinner is for unknown duration.
        </li>
        <li>
          <a routerLink="/skeleton" class="text-primary-600 hover:underline">Skeleton</a>
          — better for multi-region content loads where the final layout is known. Spinner is for
          single-point pending states.
        </li>
        <li>
          <a routerLink="/button" class="text-primary-600 hover:underline">Button</a>
          — the canonical host for an inline spinner; pair with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]</code>
          to block repeat submissions.
        </li>
      </ul>
    </section>
  `,
})
export class SpinnerOverview {
  protected readonly basicUsageSnippet = `<tw-spinner />
<tw-spinner variant="dots" color="info" />
<tw-spinner variant="bars" color="success" />
<tw-spinner size="lg" color="warning" />`;

  protected readonly importSnippet = `import { SpinnerComponent } from '@cdevhub/ngx-tw/spinner';`;
}
