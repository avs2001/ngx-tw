import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { SeparatorComponent } from '@cdevhub/ngx-tw/separator';
import type { SeparatorVariant, SeparatorWeight } from '@cdevhub/ngx-tw/separator';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor } from '@cdevhub/ngx-tw/core';

const VARIANTS: SeparatorVariant[] = ['solid', 'dashed', 'dotted'];
const WEIGHTS: SeparatorWeight[] = ['thin', 'medium', 'thick'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const ORIENTATIONS = ['horizontal', 'vertical'] as const;
type Orientation = (typeof ORIENTATIONS)[number];

@Component({
  selector: 'app-separator-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SeparatorComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input chooses the line stroke.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        is the quiet default for page- and section-level dividers,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dashed</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dotted</code>
        read as softer or more informal breaks — useful inside empty states, "optional"
        content, or draft zones where a solid line would feel too committed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (v of variants; track v) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
            <tw-separator [variant]="v" />
          </div>
        }
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the line with a semantic token.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        is the right default — it resolves to the theme's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">border</code>
        token and adapts automatically to light and dark mode. Reach for the semantic
        colors only when the divider is part of a themed region (a success banner, a
        warning surface) and should inherit that tint.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        @for (c of colors; track c) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ c }}</p>
            <tw-separator [color]="c" weight="medium" />
          </div>
        }
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Weights -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Weights</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Weight controls the line thickness.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">thin</code>
        (1px) is the right default for dense UI — inline row dividers, list separators,
        card footers.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">medium</code>
        (2px) and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">thick</code>
        (3px) suit larger section breaks — between a hero and the next block, or between
        unrelated groups of content in a long page.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (w of weights; track w) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ w }}</p>
            <tw-separator [weight]="w" />
          </div>
        }
      </div>
      <tw-code-block [code]="weightsSnippet" language="html" />
    </section>

    <!-- Orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation="vertical"</code>
        to render a column divider between inline items — toolbars, breadcrumbs, metadata
        rows, or pairs of buttons. The parent must have a fixed height or be a flex row
        with aligned items; the separator stretches to fill the cross axis.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3 h-10">
          <span class="text-sm text-fg">Profile</span>
          <tw-separator orientation="vertical" />
          <span class="text-sm text-fg">Billing</span>
          <tw-separator orientation="vertical" color="primary" weight="medium" />
          <span class="text-sm text-fg">Team</span>
        </div>
      </div>
      <tw-code-block [code]="orientationSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Vertical separators do not render projected labels — the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-content</code>
        slot is only active in horizontal orientation.
      </p>
    </section>

    <!-- With Labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Labels</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project any content — text, an icon, a small SVG — and it renders as a centered
        label flanked by two lines. The classic "OR" separator on sign-in forms is the
        canonical use case; an icon label works well for decorative section breaks on
        marketing pages.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-separator>OR</tw-separator>
        <tw-separator color="primary" variant="dashed">Continue with email</tw-separator>
        <tw-separator color="accent" weight="medium">
          <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
          </svg>
        </tw-separator>
      </div>
      <tw-code-block [code]="labelsSnippet" language="html" />
    </section>

    <!-- Decorative -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Decorative</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[decorative]="true"</code>
        when the line is purely visual and adds nothing to the document outline — a
        repeated divider inside a list, or a cosmetic break inside a hero. Decorative
        separators carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="none"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden="true"</code>,
        so screen readers skip past them instead of announcing every repetition.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <p class="text-sm text-fg">Featured articles</p>
        <tw-separator [decorative]="true" color="accent" variant="dotted" weight="medium" />
        <p class="text-sm text-fg-muted">The decorative divider above is ignored by assistive tech.</p>
      </div>
      <tw-code-block [code]="decorativeSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. A useful starting point: switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dashed</code>
        with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">medium</code>
        weight and toggle the label on to see the "OR" pattern, or flip to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        to preview the inline toolbar shape.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playVariant() === v"
                        [class.!text-primary-700]="playVariant() === v"
                        (click)="playVariant.set(v)">{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Weight</label>
            <div class="flex gap-1">
              @for (w of weights; track w) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playWeight() === w"
                        [class.!text-primary-700]="playWeight() === w"
                        (click)="playWeight.set(w)">{{ w }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playColor() === c"
                        [class.!text-primary-700]="playColor() === c"
                        (click)="playColor.set(c)">{{ c }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Orientation</label>
            <div class="flex gap-1">
              @for (o of orientations; track o) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playOrientation() === o"
                        [class.!text-primary-700]="playOrientation() === o"
                        (click)="playOrientation.set(o)">{{ o }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playLabel()"
                      [class.!text-primary-700]="playLabel()"
                      (click)="playLabel.update(v => !v)">label</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDecorative()"
                      [class.!text-primary-700]="playDecorative()"
                      (click)="playDecorative.update(v => !v)">decorative</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          @if (playOrientation() === 'horizontal') {
            <tw-separator
              class="w-full"
              [variant]="playVariant()"
              [weight]="playWeight()"
              [color]="playColor()"
              [decorative]="playDecorative()"
            >@if (playLabel()) { OR }</tw-separator>
          } @else {
            <div class="flex items-center justify-center gap-3 h-16">
              <span class="text-sm text-fg">Left</span>
              <tw-separator
                orientation="vertical"
                [variant]="playVariant()"
                [weight]="playWeight()"
                [color]="playColor()"
                [decorative]="playDecorative()"
              />
              <span class="text-sm text-fg">Right</span>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class SeparatorExamples {
  protected readonly variants = VARIANTS;
  protected readonly weights = WEIGHTS;
  protected readonly colors = COLORS;
  protected readonly orientations = ORIENTATIONS;

  protected readonly playVariant = signal<SeparatorVariant>('solid');
  protected readonly playWeight = signal<SeparatorWeight>('thin');
  protected readonly playColor = signal<TwColor>('neutral');
  protected readonly playOrientation = signal<Orientation>('horizontal');
  protected readonly playLabel = signal(false);
  protected readonly playDecorative = signal(false);

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-separator [variant]="v" />
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-separator [color]="c" weight="medium" />
}`.trim();

  protected readonly weightsSnippet = `
@for (w of weights; track w) {
  <tw-separator [weight]="w" />
}`.trim();

  protected readonly orientationSnippet = `<div class="flex items-center gap-3 h-10">
  <span>Profile</span>
  <tw-separator orientation="vertical" />
  <span>Billing</span>
  <tw-separator orientation="vertical" color="primary" weight="medium" />
  <span>Team</span>
</div>`;

  protected readonly labelsSnippet = `<tw-separator>OR</tw-separator>

<tw-separator color="primary" variant="dashed">Continue with email</tw-separator>

<tw-separator color="accent" weight="medium">
  <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
</tw-separator>`;

  protected readonly decorativeSnippet = `<p>Featured articles</p>
<tw-separator [decorative]="true" color="accent" variant="dotted" weight="medium" />
<p>The decorative divider above is ignored by assistive tech.</p>`;
}
