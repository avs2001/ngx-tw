import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { BadgeComponent, BadgeDotDirective } from 'ngx-tw/badge';
import { ButtonDirective } from 'ngx-tw/button';
import { IconComponent } from 'ngx-tw/icon';
import { AvatarComponent } from 'ngx-tw/avatar';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { BadgeVariant } from 'ngx-tw/badge';

const VARIANTS: BadgeVariant[] = ['solid', 'outline', 'soft'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-badge-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [BadgeComponent, BadgeDotDirective, ButtonDirective, IconComponent, AvatarComponent, CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the badge's visual weight without changing its meaning. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        when the badge is the primary signal on the row (filled chips in a dashboard header),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        when it sits alongside heavier UI and needs a quieter presence, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        (the default) for everything in between — labels in tables, tags, counters.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (v of variants; track v) {
            <span twBadge [variant]="v">{{ v }}</span>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input maps the badge to a semantic palette. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        to encode status; use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">secondary</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accent</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for categorical tags. Every color works with every variant.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <div class="flex flex-wrap items-center gap-2">
                @for (c of colors; track c) {
                  <span twBadge [variant]="v" [color]="c">{{ c }}</span>
                }
              </div>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Color alone is not enough to communicate status to users who cannot distinguish the palette;
        pair it with an icon (see With Icons) or a text label whenever the badge conveys meaning.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input scales padding and font together. Default to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for standalone badges; drop to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code> or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        when the badge rides alongside dense text (table cells, list rows); reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code> or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        when the badge is a hero element.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-end gap-3">
          @for (s of sizes; track s) {
            <span twBadge [size]="s">{{ s }}</span>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-icon</code>
        inside the badge to reinforce its meaning. The badge detects the projected icon and reserves
        space for it automatically — no extra class wiring required. Icon size tracks the badge
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input, so the glyph always reads correctly next to the label.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Semantic usage</p>
            <div class="flex flex-wrap items-center gap-2">
              <span twBadge variant="soft" color="success"><tw-icon name="check-circle" />Verified</span>
              <span twBadge variant="soft" color="error"><tw-icon name="alert-triangle" />Critical</span>
              <span twBadge variant="soft" color="warning"><tw-icon name="alert-triangle" />Warning</span>
              <span twBadge variant="soft" color="info"><tw-icon name="info" />Info</span>
              <span twBadge variant="solid" color="primary"><tw-icon name="star" />Featured</span>
              <span twBadge variant="outline" color="neutral"><tw-icon name="lock" />Locked</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Across sizes</p>
            <div class="flex flex-wrap items-end gap-2">
              @for (s of sizes; track s) {
                <span twBadge variant="soft" color="primary" [size]="s"><tw-icon name="star" />{{ s }}</span>
              }
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Across variants</p>
            <div class="flex flex-wrap items-center gap-2">
              @for (v of variants; track v) {
                <span twBadge [variant]="v" color="error"><tw-icon name="alert-triangle" />{{ v }}</span>
              }
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="iconsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Icons inside a badge are decorative by default; the badge's text carries the meaning. If the
        badge contains only an icon and no label, add an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        to the host element so assistive tech can announce it.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Avatars</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-avatar</code>
        to label users, teams, or anything with an identity. The badge trims its left padding to sit
        the avatar flush against the edge and scales it with the badge
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>.
        Works with both image avatars and initials.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">With image</p>
            <div class="flex flex-wrap items-center gap-2">
              <span twBadge variant="soft" color="primary"><tw-avatar src="https://i.pravatar.cc/40?u=anna" alt="Anna" />Anna Smith</span>
              <span twBadge variant="outline" color="secondary"><tw-avatar src="https://i.pravatar.cc/40?u=bob" alt="Bob" />Bob Chen</span>
              <span twBadge variant="solid" color="accent"><tw-avatar src="https://i.pravatar.cc/40?u=clara" alt="Clara" />Clara Reyes</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">With initials</p>
            <div class="flex flex-wrap items-center gap-2">
              <span twBadge variant="soft" color="info"><tw-avatar initials="AS" color="info" />Anna Smith</span>
              <span twBadge variant="soft" color="success"><tw-avatar initials="BC" color="success" />Bob Chen</span>
              <span twBadge variant="soft" color="warning"><tw-avatar initials="CR" color="warning" />Clara Reyes</span>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Across sizes</p>
            <div class="flex flex-wrap items-end gap-2">
              @for (s of sizes; track s) {
                <span twBadge variant="soft" color="primary" [size]="s"><tw-avatar src="https://i.pravatar.cc/40?u=demo" alt="Demo" />{{ s }}</span>
              }
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="avatarsSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Pill Shape</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        to swap the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rounded-md</code>
        corners for a fully rounded shape. Use it for tags, chips, and status labels where the
        rounder silhouette reads as "addressable" — something a user can click, select, or dismiss.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (c of colors; track c) {
            <span twBadge [pill]="true" [color]="c">{{ c }}</span>
          }
        </div>
      </div>
      <tw-code-block [code]="pillSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Dot Indicator</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Use the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twBadgeDot</code>
        directive to render a small colored dot with no label, padding, or content. Use it for
        presence indicators, unread markers, or to signal a state next to an independent label.
        The dot size tracks the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (c of colors; track c) {
            <div class="flex items-center gap-2">
              <span twBadgeDot [color]="c"></span>
              <span class="text-xs text-fg-muted">{{ c }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="dotSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        A standalone dot has no text for screen readers. Pair it with a visible label (as above) or
        add an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        to the host that describes the state it represents. When the dot represents a value that
        actually changes (e.g. a new-messages indicator), set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[live]="true"</code>
        to expose the dot as an ARIA live region.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Dismissible</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissible</code>
        to show a trailing close button; it emits the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissed</code>
        output when clicked. The badge does not remove itself from the DOM — the parent is
        responsible for updating state (splicing the tag out of an array, for example) in response
        to the event.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (tag of tags(); track tag) {
            <span twBadge color="primary" [dismissible]="true" (dismissed)="removeTag(tag)">{{ tag }}</span>
          }
          @if (tags().length === 0) {
            <p class="text-sm text-fg-muted">All badges dismissed.</p>
          }
          @if (tags().length < allTags.length) {
            <button twButton variant="ghost" color="neutral" size="xs" (click)="resetTags()">Reset</button>
          }
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="dismissibleTsSnippet" language="ts" />
        <tw-code-block [code]="dismissibleHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissLabel</code>
        to localize the close-button
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[dismissLabel]="'Fermer'"</code>.
        The hit target meets the
        <a href="https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html" class="text-primary-600 hover:underline">WCAG 2.5.8</a>
        minimum (24px) and grows with the badge size.
      </p>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once to find the configuration you want. Start with the defaults
        (soft / primary / md, no pill or dot) for a neutral tag, then layer on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code> and a
        leading avatar to feel out a "user chip" shape, or flip to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dot</code>
        to preview presence-indicator output.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playPill()"
                [class.!text-primary-700]="playPill()"
                (click)="playPill.update(v => !v)"
              >pill</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDismissible()"
                [class.!text-primary-700]="playDismissible()"
                (click)="playDismissible.update(v => !v)"
              >dismissible</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDot()"
                [class.!text-primary-700]="playDot()"
                (click)="playDot.update(v => !v)"
              >dot</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Leading</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLeading() === 'none'"
                [class.!text-primary-700]="playLeading() === 'none'"
                (click)="playLeading.set('none')"
              >none</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLeading() === 'icon'"
                [class.!text-primary-700]="playLeading() === 'icon'"
                (click)="playLeading.set('icon')"
              >icon</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLeading() === 'avatar'"
                [class.!text-primary-700]="playLeading() === 'avatar'"
                (click)="playLeading.set('avatar')"
              >avatar</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-8 rounded-lg bg-surface-sunken">
          @if (playDot()) {
            <!--
              The dot indicator is rendered by a distinct directive ([twBadgeDot])
              because its shape — no padding, no children, no dismiss — is
              structurally different from the labelled badge. Variant, pill,
              dismissible, and leading toggles do not apply in dot mode.
            -->
            <span twBadgeDot [color]="playColor()" [size]="playSize()"></span>
          } @else {
            @switch (playLeading()) {
              @case ('icon') {
                <span
                  twBadge
                  [variant]="playVariant()"
                  [color]="playColor()"
                  [size]="playSize()"
                  [pill]="playPill()"
                  [dismissible]="playDismissible()"
                ><tw-icon name="star" />Badge</span>
              }
              @case ('avatar') {
                <span
                  twBadge
                  [variant]="playVariant()"
                  [color]="playColor()"
                  [size]="playSize()"
                  [pill]="playPill()"
                  [dismissible]="playDismissible()"
                ><tw-avatar src="https://i.pravatar.cc/40?u=play" alt="User" />Badge</span>
              }
              @default {
                <span
                  twBadge
                  [variant]="playVariant()"
                  [color]="playColor()"
                  [size]="playSize()"
                  [pill]="playPill()"
                  [dismissible]="playDismissible()"
                >Badge</span>
              }
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class BadgeExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly allTags = ['Angular', 'Tailwind', 'TypeScript', 'Vitest', 'CDK'];
  protected readonly tags = signal([...this.allTags]);

  protected readonly playVariant = signal<BadgeVariant>('soft');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playPill = signal(false);
  protected readonly playDismissible = signal(false);
  protected readonly playDot = signal(false);
  protected readonly playLeading = signal<'none' | 'icon' | 'avatar'>('none');

  removeTag(tag: string): void {
    this.tags.update(t => t.filter(item => item !== tag));
  }

  resetTags(): void {
    this.tags.set([...this.allTags]);
  }

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <span twBadge [variant]="v">{{ v }}</span>
}`.trim();

  protected readonly colorsSnippet = `
@for (v of variants; track v) {
  <div>
    <p>{{ v }}</p>
    @for (c of colors; track c) {
      <span twBadge [variant]="v" [color]="c">{{ c }}</span>
    }
  </div>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <span twBadge [size]="s">{{ s }}</span>
}`.trim();

  protected readonly iconsSnippet = `
<span twBadge variant="soft" color="success">
  <tw-icon name="check-circle" />Verified
</span>
<span twBadge variant="solid" color="primary">
  <tw-icon name="star" />Featured
</span>
<span twBadge variant="outline" color="neutral">
  <tw-icon name="lock" />Locked
</span>`.trim();

  protected readonly avatarsSnippet = `
<span twBadge variant="soft" color="primary">
  <tw-avatar src="/anna.jpg" alt="Anna" />Anna Smith
</span>
<span twBadge variant="soft" color="info">
  <tw-avatar initials="BC" color="info" />Bob Chen
</span>`.trim();

  protected readonly pillSnippet = `
@for (c of colors; track c) {
  <span twBadge [pill]="true" [color]="c">{{ c }}</span>
}`.trim();

  protected readonly dotSnippet = `
@for (c of colors; track c) {
  <div class="flex items-center gap-2">
    <span twBadgeDot [color]="c"></span>
    <span class="text-xs text-fg-muted">{{ c }}</span>
  </div>
}`.trim();

  protected readonly dismissibleTsSnippet = `
protected readonly allTags = ['Angular', 'Tailwind', 'TypeScript'];
protected readonly tags = signal([...this.allTags]);

removeTag(tag: string): void {
  this.tags.update(t => t.filter(item => item !== tag));
}`.trim();

  protected readonly dismissibleHtmlSnippet = `
@for (tag of tags(); track tag) {
  <span
    twBadge
    color="primary"
    [dismissible]="true"
    (dismissed)="removeTag(tag)"
  >{{ tag }}</span>
}`.trim();
}
