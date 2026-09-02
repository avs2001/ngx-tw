import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FlipCardComponent,
  type FlipCardDirection,
  type FlipCardTrigger,
  type FlipCardVariant,
} from '@cdevhub/ngx-tw/flip-card';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

const VARIANTS: FlipCardVariant[] = ['outlined', 'elevated', 'ghost'];
const DIRECTIONS: FlipCardDirection[] = ['horizontal', 'vertical'];
const TRIGGERS: FlipCardTrigger[] = ['click', 'hover', 'both', 'manual'];

@Component({
  selector: 'app-flip-card-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FlipCardComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the card's chrome without changing its behavior. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>
        when the card should float above the page (marketing grids, feature highlights),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>
        when it sits inside a denser layout (team pages, product lists), and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        when only the flipping content should carry visual weight.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (v of variants; track v) {
            <div class="h-48">
              <tw-flip-card [variant]="v" class="h-full w-full">
                <div slot="front" class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                  <p class="text-xs uppercase tracking-wide text-fg-muted mb-1">Variant</p>
                  <p class="text-lg font-semibold text-fg">{{ v }}</p>
                </div>
                <div slot="back" class="flex h-full w-full flex-col items-center justify-center gap-1 p-4 text-center">
                  <p class="text-xs uppercase tracking-wide text-fg-muted">Flipped</p>
                  <p class="text-sm text-fg">The chrome is {{ v }}; the flip is the same across all three.</p>
                </div>
              </tw-flip-card>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Both faces inherit the variant's surface and border treatment, so the front and
        back look like the same card with different content — never like two different
        components glued together.
      </p>
    </section>

    <!-- Direction -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Direction</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">horizontal</code>
        rotates around the Y axis (left/right flip) and is the default — it reads as
        "flipping a card over." Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        (X axis, top/bottom flip) when the back content logically extends or reveals
        information below the front — e.g., a stat flipping up to show its trend.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (d of directions; track d) {
            <div class="h-48">
              <tw-flip-card [direction]="d" class="h-full w-full">
                <div slot="front" class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                  <p class="text-xs uppercase tracking-wide text-fg-muted mb-1">Direction</p>
                  <p class="text-lg font-semibold text-fg">{{ d }}</p>
                </div>
                <div slot="back" class="flex h-full w-full flex-col items-center justify-center p-4 text-center">
                  <p class="text-sm text-fg">Rotates around the {{ d === 'horizontal' ? 'Y' : 'X' }} axis.</p>
                </div>
              </tw-flip-card>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="directionSnippet" language="html" />
    </section>

    <!-- Triggers -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Triggers</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">trigger</code>
        input controls what flips the card.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">both</code>
        (the default) enables click and hover;
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">click</code>
        limits interaction to explicit toggles (friendlier for keyboard and touch);
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hover</code>
        is best for decorative cards in marketing grids; and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>
        disables all built-in triggers and defers to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(flipped)]</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          @for (t of triggers; track t) {
            <div class="h-40">
              <tw-flip-card [trigger]="t" variant="elevated" class="h-full w-full">
                <div slot="front" class="flex h-full w-full flex-col items-center justify-center p-3 text-center">
                  <p class="text-xs uppercase tracking-wide text-fg-muted mb-1">Trigger</p>
                  <p class="text-sm font-semibold text-fg">{{ t }}</p>
                </div>
                <div slot="back" class="flex h-full w-full items-center justify-center p-3 text-center">
                  <p class="text-xs text-fg">Back face for <strong>{{ t }}</strong></p>
                </div>
              </tw-flip-card>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="triggersSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>
        card above won't respond to pointer interaction — its face is controlled by a
        parent component. See the <strong>Manual control</strong> section below for a
        working example.
      </p>
    </section>

    <!-- Manual control -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Manual control</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(flipped)]</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">trigger="manual"</code>
        when flipping should be driven by surrounding UI — a toggle button, a stepper,
        a form submission. The card's host becomes a live region and announces face
        changes to screen readers.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-col items-center gap-4">
          <div class="h-48 w-72">
            <tw-flip-card
              trigger="manual"
              variant="elevated"
              aria-label="Invoice #00412 summary"
              [(flipped)]="manualFlipped"
              class="h-full w-full"
            >
              <div slot="front" class="flex h-full w-full flex-col items-center justify-center p-6 text-center">
                <p class="text-xs uppercase tracking-wide text-fg-muted mb-1">Invoice</p>
                <p class="text-2xl font-semibold text-fg">#00412</p>
                <p class="text-xs text-fg-muted mt-1">Use the button below to flip</p>
              </div>
              <div slot="back" class="flex h-full w-full flex-col justify-center gap-2 p-6">
                <p class="text-xs uppercase tracking-wide text-fg-muted">Line items</p>
                <ul class="text-sm text-fg space-y-1">
                  <li class="flex justify-between"><span>Annual plan</span><span>$1,188</span></li>
                  <li class="flex justify-between"><span>Team seats × 4</span><span>$960</span></li>
                  <li class="flex justify-between"><span>Support add-on</span><span>$240</span></li>
                </ul>
              </div>
            </tw-flip-card>
          </div>
          <button
            twButton
            variant="solid"
            color="primary"
            size="sm"
            (click)="manualFlipped.update(v => !v)"
          >
            {{ manualFlipped() ? 'Show summary' : 'Show line items' }}
          </button>
        </div>
      </div>
      <tw-code-block [code]="manualTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="manualHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Disabled -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        input freezes whichever face is currently visible. All triggers — click, hover,
        Enter, Space — are ignored, and the host drops out of the tab order. The visual
        treatment is a dimmed overlay with a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">not-allowed</code>
        cursor.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div class="h-44">
            <tw-flip-card disabled variant="elevated" class="h-full w-full">
              <div slot="front" class="flex h-full w-full items-center justify-center p-4 text-center">
                <p class="text-sm font-semibold text-fg">Disabled · front locked</p>
              </div>
              <div slot="back" class="flex h-full w-full items-center justify-center p-4 text-center">
                <p class="text-sm text-fg">This face cannot be reached by interaction.</p>
              </div>
            </tw-flip-card>
          </div>
          <div class="h-44">
            <tw-flip-card disabled [flipped]="true" variant="elevated" class="h-full w-full">
              <div slot="front" class="flex h-full w-full items-center justify-center p-4 text-center">
                <p class="text-sm text-fg">Initial face — hidden behind.</p>
              </div>
              <div slot="back" class="flex h-full w-full items-center justify-center p-4 text-center">
                <p class="text-sm font-semibold text-fg">Disabled · back locked</p>
              </div>
            </tw-flip-card>
          </div>
        </div>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Good starting points:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">elevated</code>
        + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">both</code>
        for a classic product card; or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outlined</code>
        + <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>
        + the Flipped toggle for a controlled reveal. When trigger is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>,
        the card no longer responds to pointer interaction — use the Flipped control
        instead.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-6 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Direction</label>
            <div class="flex gap-1">
              @for (d of directions; track d) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playDirection() === d"
                  [class.!text-primary-700]="playDirection() === d"
                  (click)="playDirection.set(d)"
                >{{ d }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Trigger</label>
            <div class="flex gap-1">
              @for (t of triggers; track t) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playTrigger() === t"
                  [class.!text-primary-700]="playTrigger() === t"
                  (click)="playTrigger.set(t)"
                >{{ t }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Flags</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playFlipped()"
                [class.!text-primary-700]="playFlipped()"
                (click)="playFlipped.update(v => !v)"
              >flipped</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <div class="mx-auto h-56 w-80">
            <tw-flip-card
              [variant]="playVariant()"
              [direction]="playDirection()"
              [trigger]="playTrigger()"
              [disabled]="playDisabled()"
              [(flipped)]="playFlipped"
              class="h-full w-full"
            >
              <div slot="front" class="flex h-full w-full flex-col items-center justify-center gap-1 p-6 text-center">
                <p class="text-xs uppercase tracking-wide text-fg-muted">Product</p>
                <p class="text-xl font-semibold text-fg">Nebula Headphones</p>
                <p class="text-xs text-fg-muted mt-1">$249 · Matte Graphite</p>
              </div>
              <div slot="back" class="flex h-full w-full flex-col justify-center gap-2 p-6">
                <p class="text-xs uppercase tracking-wide text-fg-muted">Specs</p>
                <ul class="text-sm text-fg space-y-1">
                  <li>40 mm dynamic drivers</li>
                  <li>Active noise cancelling</li>
                  <li>Up to 38 hours of playback</li>
                  <li>Multipoint Bluetooth 5.3</li>
                </ul>
              </div>
            </tw-flip-card>
          </div>
        </div>
      </div>
    </section>
  `,
})
export class FlipCardExamples {
  protected readonly variants = VARIANTS;
  protected readonly directions = DIRECTIONS;
  protected readonly triggers = TRIGGERS;

  protected readonly manualFlipped = signal(false);

  protected readonly playVariant = signal<FlipCardVariant>('elevated');
  protected readonly playDirection = signal<FlipCardDirection>('horizontal');
  protected readonly playTrigger = signal<FlipCardTrigger>('both');
  protected readonly playDisabled = signal(false);
  protected readonly playFlipped = signal(false);

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-flip-card [variant]="v" class="h-48 w-full">
    <div slot="front">Variant: {{ v }}</div>
    <div slot="back">The chrome is {{ v }}; the flip is the same.</div>
  </tw-flip-card>
}`.trim();

  protected readonly directionSnippet = `
@for (d of directions; track d) {
  <tw-flip-card [direction]="d" class="h-48 w-full">
    <div slot="front">Direction: {{ d }}</div>
    <div slot="back">Rotates around the {{ d === 'horizontal' ? 'Y' : 'X' }} axis.</div>
  </tw-flip-card>
}`.trim();

  protected readonly triggersSnippet = `
@for (t of triggers; track t) {
  <tw-flip-card [trigger]="t" variant="elevated" class="h-40 w-full">
    <div slot="front">Trigger: {{ t }}</div>
    <div slot="back">Back face for {{ t }}</div>
  </tw-flip-card>
}`.trim();

  protected readonly manualTsSnippet = `readonly manualFlipped = signal(false);`;

  protected readonly manualHtmlSnippet = `<tw-flip-card
  trigger="manual"
  variant="elevated"
  aria-label="Invoice #00412 summary"
  [(flipped)]="manualFlipped"
  class="h-48 w-72"
>
  <div slot="front">Invoice #00412</div>
  <div slot="back">
    <ul>
      <li>Annual plan — $1,188</li>
      <li>Team seats × 4 — $960</li>
      <li>Support add-on — $240</li>
    </ul>
  </div>
</tw-flip-card>

<button twButton (click)="manualFlipped.update(v => !v)">
  {{ manualFlipped() ? 'Show summary' : 'Show line items' }}
</button>`;

  protected readonly disabledSnippet = `<!-- Locked showing the front face -->
<tw-flip-card disabled variant="elevated" class="h-44 w-full">
  <div slot="front">Disabled · front locked</div>
  <div slot="back">This face cannot be reached.</div>
</tw-flip-card>

<!-- Locked showing the back face -->
<tw-flip-card disabled [flipped]="true" variant="elevated" class="h-44 w-full">
  <div slot="front">Hidden behind.</div>
  <div slot="back">Disabled · back locked</div>
</tw-flip-card>`;
}
