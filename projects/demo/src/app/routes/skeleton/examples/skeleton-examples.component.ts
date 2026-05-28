import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { SkeletonComponent } from '@cdevhub/ngx-tw/skeleton';
import type { SkeletonAnimation, SkeletonShape } from '@cdevhub/ngx-tw/skeleton';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

const SHAPES: SkeletonShape[] = ['text', 'rectangle', 'circle'];
const ANIMATIONS: SkeletonAnimation[] = ['pulse', 'wave', 'none'];
const LINE_CHOICES: readonly number[] = [1, 2, 3, 5];
const WIDTH_CHOICES: readonly (string | number | undefined)[] = [undefined, '50%', 240];
const HEIGHT_CHOICES: readonly (string | number | undefined)[] = [undefined, '1rem', '4rem'];

interface Article {
  readonly title: string;
  readonly author: string;
  readonly excerpt: string;
}

const SAMPLE_ARTICLES: Article[] = [
  {
    title: 'The case for accessible loading states',
    author: 'Mira Hassan',
    excerpt:
      'Skeleton placeholders communicate progress without animation overhead — a small UX win that adds up across a busy dashboard.',
  },
  {
    title: 'Theming Tailwind v4 with semantic tokens',
    author: 'Theo Park',
    excerpt:
      'Using surface and foreground tokens lets every consumer rebrand without touching component internals. Here is the long version.',
  },
  {
    title: 'Designing for Angular signals',
    author: 'Lina Okafor',
    excerpt:
      'Component APIs feel different when every input is reactive. We re-examine how to compose, derive, and connect state.',
  },
];

@Component({
  selector: 'app-skeleton-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [SkeletonComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Shapes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Shapes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The shape chooses the placeholder's geometry. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text</code>
        for a single text-line stub that flows with surrounding copy,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rectangle</code>
        for free-form blocks like images or cards, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">circle</code>
        for avatar and icon placeholders.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (s of shapes; track s) {
            <div class="flex flex-col gap-2">
              <div class="flex items-center justify-center min-h-20 rounded-md bg-surface p-4 border border-border-muted">
                @switch (s) {
                  @case ('text') { <tw-skeleton shape="text" /> }
                  @case ('rectangle') { <tw-skeleton shape="rectangle" height="4rem" /> }
                  @case ('circle') { <tw-skeleton shape="circle" [width]="56" [height]="56" /> }
                }
              </div>
              <span class="text-xs text-fg-muted font-mono">shape="{{ s }}"</span>
            </div>
          }
        </div>
      </div>

      <tw-code-block [code]="shapesSnippet" language="html" />
    </section>

    <!-- Animations -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Animations</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Animations carry the "loading" signal. Prefer
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pulse</code>
        as the calm default, reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">wave</code>
        when the skeleton sits above the fold and needs more presence, and pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code>
        for dense grids where animation would feel busy.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          @for (a of animations; track a) {
            <div class="flex flex-col gap-2">
              <tw-skeleton shape="rectangle" [animation]="a" height="3rem" />
              <span class="text-xs text-fg-muted font-mono">animation="{{ a }}"</span>
            </div>
          }
        </div>
      </div>

      <tw-code-block [code]="animationsSnippet" language="html" />

      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Every animation halts under
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code> —
        the placeholder stays visible but stops moving, so the accessibility setting doesn't hide the loading state.
      </p>
    </section>

    <!-- Multi-line text -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multi-line text</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines</code> greater than 1
        to render a stack of text-line skeletons. The final row is automatically shortened to 60% width so the
        block reads as a paragraph instead of a rectangle. Only applies when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">shape="text"</code>.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-mono text-fg-muted mb-2">[lines]="1"</p>
          <tw-skeleton />
        </div>
        <div>
          <p class="text-xs font-mono text-fg-muted mb-2">[lines]="3"</p>
          <tw-skeleton [lines]="3" />
        </div>
        <div>
          <p class="text-xs font-mono text-fg-muted mb-2">[lines]="5"</p>
          <tw-skeleton [lines]="5" />
        </div>
      </div>

      <tw-code-block [code]="multiLineSnippet" language="html" />
    </section>

    <!-- Custom dimensions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom dimensions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size the placeholder to match the content it replaces. Numbers are treated as pixels; strings like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'50%'</code> or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'12rem'</code> pass through
        verbatim. You can also override classes — <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twMerge</code>
        lets a custom radius win over the shape default.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <tw-skeleton shape="rectangle" [width]="240" [height]="24" />
        <tw-skeleton shape="rectangle" width="80%" height="2rem" />
        <tw-skeleton shape="rectangle" width="100%" height="3rem" class="rounded-lg" />
      </div>

      <tw-code-block [code]="dimensionsSnippet" language="html" />
    </section>

    <!-- Stand-alone announcement -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Stand-alone announcement</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When a single skeleton owns the entire loading region (a hero placeholder, a one-off card), set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">announce</code> so screen readers
        hear a polite "Loading" notice. For lists or grids of skeletons, prefer letting the parent region
        announce instead — otherwise each row triggers its own notification.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-skeleton shape="rectangle" height="10rem" announce />
      </div>

      <tw-code-block [code]="announceSnippet" language="html" />
    </section>

    <!-- Card placeholder recipe -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Card placeholder</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Compose the three shapes to mirror a card's final layout. Match each placeholder to the element it
        replaces — media block, avatar, title line, body paragraph — so the transition to real content stays
        stable.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="rounded-lg border border-border bg-surface p-4 max-w-sm">
          <tw-skeleton shape="rectangle" height="9rem" class="mb-4" />
          <div class="flex items-center gap-3 mb-3">
            <tw-skeleton shape="circle" [width]="32" [height]="32" />
            <div class="flex-1">
              <tw-skeleton width="60%" />
            </div>
          </div>
          <tw-skeleton [lines]="3" />
        </div>
      </div>

      <tw-code-block [code]="cardSnippet" language="html" />
    </section>

    <!-- List placeholder + reload -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">List placeholder with reload</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Click <strong>Reload</strong> to swap the rendered list for skeleton rows for a moment. The parent
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ul</code> carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-busy</code> and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="polite"</code>, so the
        skeletons stay silent and the region announces the state change once.
      </p>

      <div class="rounded-lg border border-border bg-surface-raised mb-4">
        <div class="flex items-center justify-between px-4 py-3 border-b border-border">
          <span class="text-sm font-medium">Recent articles</span>
          <button twButton variant="outline" color="neutral" size="sm" (click)="reload()" [disabled]="loading()">
            {{ loading() ? 'Loading…' : 'Reload' }}
          </button>
        </div>
        <ul class="divide-y divide-border-muted" [attr.aria-busy]="loading()" aria-live="polite">
          @if (loading()) {
            @for (_ of placeholderRows; track $index) {
              <li class="flex items-start gap-3 px-4 py-4">
                <tw-skeleton shape="circle" [width]="40" [height]="40" />
                <div class="flex-1 min-w-0">
                  <tw-skeleton width="55%" class="mb-2" />
                  <tw-skeleton [lines]="2" />
                </div>
              </li>
            }
          } @else {
            @for (article of articles; track article.title) {
              <li class="flex items-start gap-3 px-4 py-4">
                <div class="flex items-center justify-center size-10 rounded-full bg-primary-50 text-primary-600 text-sm font-semibold shrink-0">
                  {{ initials(article.author) }}
                </div>
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-fg truncate">{{ article.title }}</p>
                  <p class="text-sm text-fg-muted leading-snug mt-0.5">{{ article.excerpt }}</p>
                </div>
              </li>
            }
          }
        </ul>
      </div>

      <div class="space-y-3">
        <tw-code-block [code]="listTsSnippet" language="ts" />
        <tw-code-block [code]="listHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input to explore how shape, animation, dimensions, and multi-line mode interact.
        Start with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">shape="text"</code>
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lines="3"</code> for a
        paragraph stub; switch to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">circle</code>
        with a fixed width to preview an avatar placeholder.
      </p>

      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Shape</label>
            <div class="flex gap-1">
              @for (s of shapes; track s) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playShape() === s"
                  [class.!text-primary-700]="playShape() === s"
                  (click)="playShape.set(s)"
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Animation</label>
            <div class="flex gap-1">
              @for (a of animations; track a) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playAnimation() === a"
                  [class.!text-primary-700]="playAnimation() === a"
                  (click)="playAnimation.set(a)"
                >
                  {{ a }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Lines</label>
            <div class="flex gap-1">
              @for (n of lineChoices; track n) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [disabled]="playShape() !== 'text'"
                  [class.!bg-primary-100]="playLines() === n"
                  [class.!text-primary-700]="playLines() === n"
                  (click)="playLines.set(n)"
                >
                  {{ n }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Width</label>
            <div class="flex gap-1">
              @for (w of widthChoices; track $index) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playWidth() === w"
                  [class.!text-primary-700]="playWidth() === w"
                  (click)="playWidth.set(w)"
                >
                  {{ widthLabel(w) }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Height</label>
            <div class="flex gap-1">
              @for (h of heightChoices; track $index) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playHeight() === h"
                  [class.!text-primary-700]="playHeight() === h"
                  (click)="playHeight.set(h)"
                >
                  {{ heightLabel(h) }}
                </button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Announce</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playAnnounce()"
                [class.!text-primary-700]="playAnnounce()"
                (click)="playAnnounce.update((v) => !v)"
              >
                {{ playAnnounce() ? 'on' : 'off' }}
              </button>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-skeleton
            [shape]="playShape()"
            [animation]="playAnimation()"
            [lines]="playLines()"
            [width]="playWidth()"
            [height]="playHeight()"
            [announce]="playAnnounce()"
          />
        </div>

        <p class="text-xs text-fg-muted mt-4 font-mono">{{ playSummary() }}</p>
      </div>
    </section>
  `,
})
export class SkeletonExamples {
  protected readonly shapes = SHAPES;
  protected readonly animations = ANIMATIONS;
  protected readonly lineChoices = LINE_CHOICES;
  protected readonly widthChoices = WIDTH_CHOICES;
  protected readonly heightChoices = HEIGHT_CHOICES;
  protected readonly placeholderRows = [0, 1, 2];
  protected readonly articles = SAMPLE_ARTICLES;

  protected readonly loading = signal(false);

  protected readonly playShape = signal<SkeletonShape>('text');
  protected readonly playAnimation = signal<SkeletonAnimation>('pulse');
  protected readonly playLines = signal<number>(3);
  protected readonly playWidth = signal<string | number | undefined>(undefined);
  protected readonly playHeight = signal<string | number | undefined>(undefined);
  protected readonly playAnnounce = signal(false);

  protected readonly playSummary = computed(() => {
    const parts = [
      `shape="${this.playShape()}"`,
      `animation="${this.playAnimation()}"`,
      `lines=${this.playLines()}`,
      `width=${this.formatDim(this.playWidth())}`,
      `height=${this.formatDim(this.playHeight())}`,
      `announce=${this.playAnnounce()}`,
    ];
    return parts.join(' · ');
  });

  protected reload(): void {
    this.loading.set(true);
    setTimeout(() => this.loading.set(false), 1800);
  }

  protected initials(name: string): string {
    return name
      .split(' ')
      .map((part) => part[0] ?? '')
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }

  protected widthLabel(value: string | number | undefined): string {
    return value === undefined ? 'auto' : String(value);
  }

  protected heightLabel(value: string | number | undefined): string {
    return value === undefined ? 'auto' : String(value);
  }

  private formatDim(value: string | number | undefined): string {
    if (value === undefined) return 'auto';
    return typeof value === 'number' ? `${value}px` : value;
  }

  protected readonly shapesSnippet = `
@for (s of shapes; track s) {
  @switch (s) {
    @case ('text')      { <tw-skeleton shape="text" /> }
    @case ('rectangle') { <tw-skeleton shape="rectangle" height="4rem" /> }
    @case ('circle')    { <tw-skeleton shape="circle" [width]="56" [height]="56" /> }
  }
}`.trim();

  protected readonly animationsSnippet = `
@for (a of animations; track a) {
  <tw-skeleton shape="rectangle" [animation]="a" height="3rem" />
}`.trim();

  protected readonly multiLineSnippet = `
<tw-skeleton />
<tw-skeleton [lines]="3" />
<tw-skeleton [lines]="5" />`.trim();

  protected readonly dimensionsSnippet = `
<tw-skeleton shape="rectangle" [width]="240" [height]="24" />
<tw-skeleton shape="rectangle" width="80%" height="2rem" />
<tw-skeleton shape="rectangle" width="100%" height="3rem" class="rounded-lg" />`.trim();

  protected readonly announceSnippet = `<tw-skeleton shape="rectangle" height="10rem" announce />`;

  protected readonly cardSnippet = `
<div class="rounded-lg border border-border bg-surface p-4 max-w-sm">
  <tw-skeleton shape="rectangle" height="9rem" class="mb-4" />
  <div class="flex items-center gap-3 mb-3">
    <tw-skeleton shape="circle" [width]="32" [height]="32" />
    <div class="flex-1">
      <tw-skeleton width="60%" />
    </div>
  </div>
  <tw-skeleton [lines]="3" />
</div>`.trim();

  protected readonly listTsSnippet = `
protected readonly loading = signal(false);
protected readonly placeholderRows = [0, 1, 2];

protected reload(): void {
  this.loading.set(true);
  setTimeout(() => this.loading.set(false), 1800);
}`.trim();

  protected readonly listHtmlSnippet = `
<ul [attr.aria-busy]="loading()" aria-live="polite">
  @if (loading()) {
    @for (_ of placeholderRows; track $index) {
      <li>
        <tw-skeleton shape="circle" [width]="40" [height]="40" />
        <div>
          <tw-skeleton width="55%" class="mb-2" />
          <tw-skeleton [lines]="2" />
        </div>
      </li>
    }
  } @else {
    @for (article of articles; track article.title) {
      <li>…real content…</li>
    }
  }
</ul>`.trim();
}
