import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { SpinnerComponent } from 'ngx-tw/spinner';
import type { SpinnerVariant, SpinnerSize } from 'ngx-tw/spinner';
import { ButtonDirective } from 'ngx-tw/button';
import { FormFieldComponent, LabelDirective } from 'ngx-tw/form-field';
import { InputDirective } from 'ngx-tw/input';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const VARIANTS: SpinnerVariant[] = ['circular', 'dots', 'bars'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const PLAY_SIZES: SpinnerSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'inherit'];

@Component({
  selector: 'app-spinner-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    SpinnerComponent,
    ButtonDirective,
    FormFieldComponent,
    LabelDirective,
    InputDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the animation shape, not its meaning. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">circular</code>
        as the general-purpose default, switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dots</code>
        when the spinner sits beside a small caption or piece of inline text (the horizontal
        footprint reads better than a ring at tiny sizes), and pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bars</code>
        when you want to signal "processing / throughput" rather than a simple wait.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-8">
          @for (v of variants; track v) {
            <div class="flex flex-col items-center gap-2">
              <tw-spinner [variant]="v" color="primary" size="lg" />
              <span class="text-xs text-fg-muted font-mono">{{ v }}</span>
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
        input maps to the semantic token palette. The default is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'current'</code>
        — the spinner inherits
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">currentColor</code>
        from its parent, which is what makes it drop into a button or form-field suffix without
        fighting the surrounding theming. Only set an explicit color when the spinner sits on a
        neutral surface and you want to tint it for semantic meaning (error retries, success flashes).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <div class="flex flex-wrap items-center gap-4">
                @for (c of colors; track c) {
                  <div class="flex flex-col items-center gap-1.5">
                    <tw-spinner [variant]="v" [color]="c" size="md" />
                    <span class="text-2xs text-fg-subtle font-mono">{{ c }}</span>
                  </div>
                }
              </div>
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
        Sizes follow the standard
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        scale (12–32px) plus
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'inherit'</code>,
        which sizes the spinner to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1em</code>. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for inline chrome (button icons, suffix slots),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        for panel-level loading, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        only for full-page or large overlay states.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-end gap-6">
          @for (s of sizes; track s) {
            <div class="flex flex-col items-center gap-2">
              <tw-spinner [size]="s" color="primary" />
              <span class="text-2xs text-fg-subtle font-mono">{{ s }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Track toggle -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Track ring</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">track</code>
        input adds a subtle ring behind the rotating stroke on the circular variant. It reads
        better on colored or busy backgrounds where the rotation otherwise fades in and out;
        disable it on plain surface backgrounds for a cleaner look. The input has no effect on
        the dots or bars variants.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-8">
          <div class="flex flex-col items-center gap-2">
            <tw-spinner [track]="true" color="primary" size="lg" />
            <span class="text-xs text-fg-muted font-mono">track: true</span>
          </div>
          <div class="flex flex-col items-center gap-2">
            <tw-spinner [track]="false" color="primary" size="lg" />
            <span class="text-xs text-fg-muted font-mono">track: false</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="trackSnippet" language="html" />
    </section>

    <!-- Inside buttons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside buttons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The spinner picks up the button's text color automatically via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="current"</code>
        — no need to match palettes by hand. Pair it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]</code>
        on the button so the button itself also blocks repeat clicks and sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code>.
        Click any button to see the loading state for two seconds.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button twButton variant="solid" color="primary" [loading]="loadingSolid()" (click)="toggleLoading('solid')">
            @if (loadingSolid()) { <tw-spinner size="sm" /> }
            Save
          </button>
          <button twButton variant="outline" color="info" [loading]="loadingOutline()" (click)="toggleLoading('outline')">
            @if (loadingOutline()) { <tw-spinner size="sm" /> }
            Fetch
          </button>
          <button twButton variant="ghost" color="neutral" [loading]="loadingGhost()" (click)="toggleLoading('ghost')">
            @if (loadingGhost()) { <tw-spinner size="sm" variant="dots" /> }
            Refresh
          </button>
          <button twButton variant="soft" color="error" [loading]="loadingSoft()" (click)="toggleLoading('soft')">
            @if (loadingSoft()) { <tw-spinner size="sm" /> }
            Delete
          </button>
        </div>
      </div>
      <tw-code-block [code]="buttonSnippet" language="html" />
    </section>

    <!-- Inside form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside form fields (async validation)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project the spinner into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSuffix]</code>
        slot on a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
        to signal async validation or pending lookups. The spinner inherits the suffix's muted
        text color and matches the input's height without extra styling; pass a descriptive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        so screen readers announce the pending operation. Type anything below to trigger the
        simulated validator.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-sm">
          <tw-form-field>
            <label twLabel>Username</label>
            <input twInput [formControl]="usernameCtrl" placeholder="Type to simulate validation" />
            @if (usernameCtrl.pending || validatingUsername()) {
              <tw-spinner twSuffix size="sm" label="Checking availability" />
            }
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Inline text -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inline with text</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="inherit"</code>
        is the only correct choice when the spinner sits next to running text — it binds the
        spinner's dimensions to the surrounding
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">font-size</code>
        so it scales with typography rather than fighting it. Leave
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        on the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'current'</code>
        so it follows the text color. Each line below uses a different font size — the spinner adapts.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3">
          <p class="text-xs text-fg-muted inline-flex items-center gap-1.5">
            <tw-spinner size="inherit" variant="dots" /> Syncing…
          </p>
          <p class="text-sm text-fg inline-flex items-center gap-2">
            <tw-spinner size="inherit" /> Loading dashboard
          </p>
          <p class="text-base text-info-700 inline-flex items-center gap-2">
            <tw-spinner size="inherit" variant="bars" /> Processing request
          </p>
          <p class="text-lg text-success-700 inline-flex items-center gap-2.5 font-medium">
            <tw-spinner size="inherit" /> Backing up files
          </p>
        </div>
      </div>
      <tw-code-block [code]="inlineSnippet" language="html" />
    </section>

    <!-- Centered in a card -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Centered loading region</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For region-level loading (a card body, a panel, a table that hasn't resolved), center a
        larger spinner inside the host container and stack a short label beneath it. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="xl"</code>
        so the indicator reads at a glance, and pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        that describes the specific work happening rather than a generic "Loading".
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center justify-center min-h-40 rounded-lg border border-border bg-surface">
          <div class="flex flex-col items-center gap-3">
            <tw-spinner size="xl" color="primary" label="Loading report" />
            <span class="text-sm text-fg-muted">Loading report…</span>
          </div>
        </div>
      </div>
      <tw-code-block [code]="centeredSnippet" language="html" />
    </section>

    <!-- Overlay over existing content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Overlay over existing content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The spinner itself doesn't ship overlay behavior — compose one by absolutely positioning
        a translucent container on top of your content region. This pattern is useful when the
        layout must remain visible (a dashboard showing stale data while new data loads) rather
        than disappearing into a skeleton. Click the button to toggle the overlay.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" color="neutral" size="sm" class="mb-4"
                (click)="overlayOpen.update(v => !v)">
          {{ overlayOpen() ? 'Hide overlay' : 'Show overlay' }}
        </button>
        <div class="relative rounded-lg border border-border bg-surface p-6 min-h-32">
          <h3 class="text-sm font-semibold mb-2">Dashboard</h3>
          <p class="text-sm text-fg-muted">Revenue is up 12% this quarter. Orders are trending stable.</p>
          @if (overlayOpen()) {
            <div class="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm rounded-[inherit]"
                 role="status" aria-live="polite">
              <tw-spinner size="xl" color="primary" label="Refreshing data" />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="overlaySnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Notice how
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color="current"</code>
        keeps the spinner visible on the sunken preview surface without explicit theming, and
        how turning
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">track</code>
        off on a coloured variant makes the rotation harder to read — a quick reminder that the
        ring earns its keep on busy backgrounds.
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
              @for (c of playColors; track c) {
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
              @for (s of playSizes; track s) {
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playTrack()"
                [class.!text-primary-700]="playTrack()"
                (click)="playTrack.update(v => !v)"
              >track</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken flex items-center justify-center text-fg">
          <tw-spinner
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [track]="playTrack()"
            label="Playground"
          />
        </div>
      </div>
    </section>
  `,
})
export class SpinnerExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly playColors = ['current', ...COLORS] as const;
  protected readonly playSizes = PLAY_SIZES;

  protected readonly loadingSolid = signal(false);
  protected readonly loadingOutline = signal(false);
  protected readonly loadingGhost = signal(false);
  protected readonly loadingSoft = signal(false);

  protected readonly overlayOpen = signal(false);
  protected readonly validatingUsername = signal(false);

  protected readonly usernameCtrl = new FormControl('');

  // Playground
  protected readonly playVariant = signal<SpinnerVariant>('circular');
  protected readonly playColor = signal<'current' | TwColor>('primary');
  protected readonly playSize = signal<SpinnerSize>('lg');
  protected readonly playTrack = signal(true);

  protected toggleLoading(key: 'solid' | 'outline' | 'ghost' | 'soft'): void {
    const sig = {
      solid: this.loadingSolid,
      outline: this.loadingOutline,
      ghost: this.loadingGhost,
      soft: this.loadingSoft,
    }[key];
    sig.set(true);
    setTimeout(() => sig.set(false), 2000);
  }

  constructor() {
    this.usernameCtrl.valueChanges.subscribe((v) => {
      if (!v) {
        this.validatingUsername.set(false);
        return;
      }
      this.validatingUsername.set(true);
      setTimeout(() => this.validatingUsername.set(false), 1200);
    });
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-spinner [variant]="v" color="primary" size="lg" />
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-spinner variant="circular" [color]="c" size="md" />
  <tw-spinner variant="dots"     [color]="c" size="md" />
  <tw-spinner variant="bars"     [color]="c" size="md" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-spinner [size]="s" color="primary" />
}`.trim();

  protected readonly trackSnippet = `<tw-spinner [track]="true"  color="primary" size="lg" />
<tw-spinner [track]="false" color="primary" size="lg" />`;

  protected readonly buttonSnippet = `<button twButton color="primary" [loading]="saving()" (click)="save()">
  @if (saving()) { <tw-spinner size="sm" /> }
  Save
</button>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Username</label>
  <input twInput [formControl]="usernameCtrl" />
  @if (usernameCtrl.pending) {
    <tw-spinner twSuffix size="sm" label="Checking availability" />
  }
</tw-form-field>`;

  protected readonly inlineSnippet = `<p class="text-xs inline-flex items-center gap-1.5">
  <tw-spinner size="inherit" variant="dots" /> Syncing…
</p>
<p class="text-lg text-success-700 inline-flex items-center gap-2.5">
  <tw-spinner size="inherit" /> Backing up files
</p>`;

  protected readonly centeredSnippet = `<div class="flex items-center justify-center min-h-40 rounded-lg border border-border bg-surface">
  <div class="flex flex-col items-center gap-3">
    <tw-spinner size="xl" color="primary" label="Loading report" />
    <span class="text-sm text-fg-muted">Loading report…</span>
  </div>
</div>`;

  protected readonly overlaySnippet = `<div class="relative">
  <!-- stale content stays visible -->
  <dashboard-panel />

  @if (loading()) {
    <div class="absolute inset-0 flex items-center justify-center bg-surface/70 backdrop-blur-sm rounded-[inherit]"
         role="status" aria-live="polite">
      <tw-spinner size="xl" color="primary" label="Refreshing data" />
    </div>
  }
</div>`;
}
