import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { ProgressBarComponent } from 'ngx-tw/progress-bar';
import type {
  ProgressBarOptions,
  ProgressBarSize,
  ProgressBarValueFormatter,
  ProgressBarVariant,
} from 'ngx-tw/progress-bar';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor } from 'ngx-tw/core';

const VARIANTS: ProgressBarVariant[] = ['linear', 'segmented'];
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
const SIZES: ProgressBarSize[] = ['sm', 'md', 'lg'];

const SHOW_VALUE: ProgressBarOptions = { showValue: true };

interface QueueFile {
  readonly name: string;
  readonly progress: number;
}

const QUEUE_FILES: readonly QueueFile[] = [
  { name: 'annual-report-2026.zip', progress: 78 },
  { name: 'brand-assets.tar', progress: 34 },
  { name: 'backup-database.sql', progress: 100 },
  { name: 'release-notes.md', progress: 12 },
];

@Component({
  selector: 'app-progress-bar-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ProgressBarComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input switches between a continuous fill and discrete cells. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linear</code>
        for fluid progress such as uploads or percentage-driven tasks, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">segmented</code>
        when the work divides into a small, known number of steps — the discrete
        cells communicate "3 of 4 done" more clearly than a fractional bar.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <tw-progress-bar label="Linear" [value]="60" [options]="showValueOption" />
          <div>
            <tw-progress-bar
              [label]="'Onboarding step ' + step() + ' of 4'"
              variant="segmented"
              [value]="step() * 25"
              [options]="{ segments: 4 }"
            />
            <div class="flex items-center gap-2 mt-4">
              <button
                twButton
                size="sm"
                variant="outline"
                color="neutral"
                [disabled]="step() === 0"
                (click)="prevStep()"
              >
                Back
              </button>
              <button
                twButton
                size="sm"
                color="primary"
                [disabled]="step() === 4"
                (click)="nextStep()"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.segments</code>
        field is ignored when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'linear'</code>,
        so it is safe to leave wired up when toggling between variants.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the fill (and each filled cell in the segmented variant). Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for neutral, in-flight progress, and switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        to reflect the outcome of a finished or interrupted task.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (c of colors; track c) {
            <tw-progress-bar [label]="c" [color]="c" [value]="65" [options]="showValueOption" />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls bar thickness:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        (4px) fits inside list rows and dense tables,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        (8px) is the default for forms and panels, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        (12px) is for prominent, standalone task displays.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <tw-progress-bar [label]="s" [size]="s" [value]="50" [options]="showValueOption" />
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Passing
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>
        or omitting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        switches the bar to indeterminate — it sweeps continuously and drops
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuenow</code>
        in favour of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy="true"</code>.
        When the task completes, pair the final value with a semantic color so the
        visual outcome matches the announcement.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Determinate</p>
            <tw-progress-bar label="Rendering report" [value]="42" [options]="showValueOption" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Indeterminate</p>
            <tw-progress-bar label="Waiting for server" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Success</p>
            <tw-progress-bar label="Backup complete" [value]="100" color="success" [options]="showValueOption" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Warning</p>
            <tw-progress-bar label="Backup paused" [value]="45" color="warning" [options]="showValueOption" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Error</p>
            <tw-progress-bar label="Backup failed at 63%" [value]="63" color="error" [options]="showValueOption" />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Custom value formatter -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom value formatter</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default formatter renders an integer percentage, which rarely matches the
        units of the underlying task. Pass an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.formatter</code>
        to render bytes, fractions, or any domain-specific string — the same string is
        shown next to the label and mirrored to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>
        for screen readers.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-progress-bar
          label="annual-report-2026.pdf"
          [value]="uploaded()"
          color="info"
          [options]="uploadOptions"
        />
        <div class="flex items-center gap-2 mt-4">
          <button
            twButton
            size="sm"
            color="info"
            [disabled]="uploadRunning()"
            (click)="startUpload()"
          >
            Start upload
          </button>
          <button
            twButton
            size="sm"
            variant="outline"
            color="neutral"
            (click)="resetUpload()"
          >
            Reset
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="formatterTsSnippet" language="ts" />
        <tw-code-block [code]="formatterHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- In context -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">In context</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When the bar sits inside a list row or card without a visible
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>,
        provide an accessible name with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">options.ariaLabel</code>
        so the bar still announces its purpose. Constrain the width with a host class
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">class="w-40"</code>)
        — the component fills its container by default.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised overflow-hidden mb-4">
        <ul class="divide-y divide-border-muted">
          @for (file of files; track file.name) {
            <li class="flex items-center gap-4 px-4 py-3">
              <svg class="size-4 shrink-0 text-fg-muted" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/>
              </svg>
              <span class="text-sm text-fg flex-1 min-w-0 truncate">{{ file.name }}</span>
              <tw-progress-bar
                class="w-40 shrink-0"
                [value]="file.progress"
                size="sm"
                [options]="{ ariaLabel: file.name + ' upload progress' }"
              />
              <span class="text-xs text-fg-muted font-mono tabular-nums w-10 text-right">{{ file.progress }}%</span>
            </li>
          }
        </ul>
      </div>
      <tw-code-block [code]="inContextSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">indeterminate</code>
        to see the sweep animation, or pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">segmented</code>
        with a smaller value to watch individual cells fill.
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
                >{{ v }}</button>
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
                >{{ c }}</button>
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
                >{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playShowValue()"
                [class.!text-primary-700]="playShowValue()"
                (click)="togglePlayShowValue()"
              >showValue</button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playIndeterminate()"
                [class.!text-primary-700]="playIndeterminate()"
                (click)="togglePlayIndeterminate()"
              >indeterminate</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-progress-bar
            label="Playground"
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [value]="playIndeterminate() ? null : playValue()"
            [options]="playOptions()"
          />
          <div class="flex items-center gap-2 mt-4 flex-wrap">
            <button twButton size="xs" variant="outline" color="neutral" (click)="playValue.set(0)">0%</button>
            <button twButton size="xs" variant="outline" color="neutral" (click)="playValue.set(25)">25%</button>
            <button twButton size="xs" variant="outline" color="neutral" (click)="playValue.set(50)">50%</button>
            <button twButton size="xs" variant="outline" color="neutral" (click)="playValue.set(75)">75%</button>
            <button twButton size="xs" variant="outline" color="neutral" (click)="playValue.set(100)">100%</button>
          </div>
          <p class="text-xs text-fg-muted mt-4 font-mono">
            value = {{ playIndeterminate() ? 'null (indeterminate)' : playValue() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class ProgressBarExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly files = QUEUE_FILES;
  protected readonly showValueOption = SHOW_VALUE;

  // Wizard
  protected readonly step = signal(1);

  // Upload
  protected readonly uploadTotal = 10_485_760; // 10 MB
  protected readonly uploaded = signal(3_355_443); // ~3.2 MB
  protected readonly uploadRunning = signal(false);
  private uploadTimer: ReturnType<typeof setInterval> | null = null;

  protected readonly uploadOptions: ProgressBarOptions = {
    max: this.uploadTotal,
    showValue: true,
    formatter: (value, max) => {
      const toMB = (b: number) => (b / 1_048_576).toFixed(1);
      return `${toMB(value)} MB / ${toMB(max)} MB`;
    },
  };

  // Playground
  protected readonly playVariant = signal<ProgressBarVariant>('linear');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<ProgressBarSize>('md');
  protected readonly playShowValue = signal(true);
  protected readonly playIndeterminate = signal(false);
  protected readonly playValue = signal(50);

  protected readonly playOptions = computed<ProgressBarOptions>(() => ({
    segments: 5,
    showValue: this.playShowValue(),
  }));

  private readonly destroyRef = inject(DestroyRef);

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.uploadTimer) clearInterval(this.uploadTimer);
    });
  }

  protected prevStep(): void {
    const current = this.step();
    if (current > 0) this.step.set(current - 1);
  }

  protected nextStep(): void {
    const current = this.step();
    if (current < 4) this.step.set(current + 1);
  }

  protected togglePlayShowValue(): void {
    this.playShowValue.set(!this.playShowValue());
  }

  protected togglePlayIndeterminate(): void {
    this.playIndeterminate.set(!this.playIndeterminate());
  }

  protected readonly formatBytes: ProgressBarValueFormatter = (value, max) => {
    const toMB = (b: number) => (b / 1_048_576).toFixed(1);
    return `${toMB(value)} MB / ${toMB(max)} MB`;
  };

  protected startUpload(): void {
    if (this.uploadRunning()) return;
    this.uploadRunning.set(true);
    this.uploaded.set(0);
    this.uploadTimer = setInterval(() => {
      const next = this.uploaded() + Math.floor(Math.random() * 400_000) + 120_000;
      if (next >= this.uploadTotal) {
        this.uploaded.set(this.uploadTotal);
        this.stopUpload();
      } else {
        this.uploaded.set(next);
      }
    }, 250);
  }

  protected resetUpload(): void {
    this.stopUpload();
    this.uploaded.set(0);
  }

  private stopUpload(): void {
    if (this.uploadTimer) {
      clearInterval(this.uploadTimer);
      this.uploadTimer = null;
    }
    this.uploadRunning.set(false);
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `<!-- Linear (continuous fill) -->
<tw-progress-bar label="Linear" [value]="60" [options]="{ showValue: true }" />

<!-- Segmented (discrete steps) -->
<tw-progress-bar
  [label]="'Onboarding step ' + step() + ' of 4'"
  variant="segmented"
  [value]="step() * 25"
  [options]="{ segments: 4 }"
/>`;

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-progress-bar [label]="c" [color]="c" [value]="65" [options]="{ showValue: true }" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-progress-bar [label]="s" [size]="s" [value]="50" [options]="{ showValue: true }" />
}`.trim();

  protected readonly statesSnippet = `<!-- Determinate -->
<tw-progress-bar label="Rendering report" [value]="42" [options]="{ showValue: true }" />

<!-- Indeterminate: omit value, or pass null -->
<tw-progress-bar label="Waiting for server" />

<!-- Outcome states -->
<tw-progress-bar label="Backup complete"     [value]="100" color="success" [options]="{ showValue: true }" />
<tw-progress-bar label="Backup paused"       [value]="45"  color="warning" [options]="{ showValue: true }" />
<tw-progress-bar label="Backup failed at 63%" [value]="63"  color="error"   [options]="{ showValue: true }" />`;

  protected readonly formatterTsSnippet = `const TEN_MB = 10 * 1_048_576;
protected readonly uploaded = signal(3_355_443);

protected readonly uploadOptions: ProgressBarOptions = {
  max: TEN_MB,
  showValue: true,
  formatter: (value, max) => {
    const toMB = (b: number) => (b / 1_048_576).toFixed(1);
    return \`\${toMB(value)} MB / \${toMB(max)} MB\`;
  },
};`;

  protected readonly formatterHtmlSnippet = `<tw-progress-bar
  label="annual-report-2026.pdf"
  [value]="uploaded()"
  color="info"
  [options]="uploadOptions"
/>`;

  protected readonly inContextSnippet = `<ul class="divide-y divide-border-muted">
  @for (file of files; track file.name) {
    <li class="flex items-center gap-4 px-4 py-3">
      <svg class="size-4 shrink-0 text-fg-muted">…</svg>
      <span class="text-sm text-fg flex-1 min-w-0 truncate">{{ file.name }}</span>
      <tw-progress-bar
        class="w-40 shrink-0"
        [value]="file.progress"
        size="sm"
        [options]="{ ariaLabel: file.name + ' upload progress' }"
      />
      <span class="text-xs text-fg-muted font-mono tabular-nums w-10 text-right">{{ file.progress }}%</span>
    </li>
  }
</ul>`;
}
