import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { AvatarComponent, AvatarGroupComponent } from 'ngx-tw/avatar';
import type { AvatarRounded, AvatarStatus } from 'ngx-tw/avatar';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const ROUNDED: AvatarRounded[] = ['full', 'lg', 'none'];
const STATUSES: AvatarStatus[] = ['online', 'busy', 'away', 'offline'];

const INITIAL_MAP: Record<TwColor, string> = {
  primary: 'PR',
  secondary: 'SC',
  accent: 'AC',
  neutral: 'NE',
  info: 'IN',
  success: 'SU',
  warning: 'WA',
  error: 'ER',
};

@Component({
  selector: 'app-avatar-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AvatarComponent, AvatarGroupComponent, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the background and text of the initials or fallback surface — it has no effect
        when an image loads successfully. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        as the default for generic users and roles, and reach for a semantic color
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>) only when
        the tint carries meaning — otherwise the palette reads as noise in a list of people.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (c of colors; track c) {
            <tw-avatar [initials]="initialMap[c]" [color]="c" [alt]="c" />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales the avatar's square dimensions and the initials font together, and also adjusts
        the status dot so it stays proportional. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inline with text (lists, chips, mentions),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for card headers and navigation, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for profile pages where the avatar is the focal element.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-end gap-4">
          @for (s of sizes; track s) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-avatar initials="JD" color="primary" [size]="s" alt="Jane Doe" />
              <span class="text-xs text-fg-muted font-mono">{{ s }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Rounded shapes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Rounded Shapes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rounded</code>
        input switches the avatar's shape independently of size. Stick to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">full</code>
        for people, who read as circles by convention; use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        for teams, organisations, projects, and bots so the different shape signals "not a person";
        reserve
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code>
        for logo-style marks that already have their own silhouette.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-4">
          @for (r of roundedOptions; track r) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-avatar initials="AC" color="accent" [rounded]="r" alt="Acme Corp" />
              <span class="text-xs text-fg-muted font-mono">{{ r }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="roundedSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The status dot automatically reseats itself for each shape — sitting inside the circle for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">full</code>
        and anchored to the corner for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">none</code>.
      </p>
    </section>

    <!-- Status indicators -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Status Indicators</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">status</code>
        input renders a small coloured dot with a surface-coloured ring so it reads cleanly against
        any background. The dot is decorative (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-hidden</code>)
        — always communicate the status in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alt</code>
        as well, so screen readers hear "Jane Doe, online" instead of just "Jane Doe".
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-6">
          @for (st of statuses; track st) {
            <div class="flex flex-col items-center gap-1.5">
              <tw-avatar initials="JD" color="primary" [status]="st" [alt]="'Jane Doe, ' + st" />
              <span class="text-xs text-fg-muted font-mono">{{ st }}</span>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="statusSnippet" language="html" />
    </section>

    <!-- Fallback cascade -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Fallback Cascade</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Avatar picks its content in priority order: image if
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">src</code>
        loads, otherwise initials if
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">initials</code>
        are present, otherwise projected content — with a default user silhouette as the final
        fallback. Provide an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">src</code>
        <em>and</em>
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">initials</code>
        together so broken or slow image URLs degrade gracefully without flashing a generic icon.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Image loads</p>
            <tw-avatar
              src="https://i.pravatar.cc/80?img=12"
              initials="JD"
              color="primary"
              alt="Jane Doe"
            />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Image fails, initials shown</p>
            <tw-avatar src="/broken-link.png" initials="JD" color="primary" alt="Jane Doe" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">No image or initials — default silhouette</p>
            <tw-avatar alt="Anonymous user" />
          </div>
        </div>
      </div>
      <tw-code-block [code]="fallbackSnippet" language="html" />
    </section>

    <!-- Custom projected content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Projected Content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project any SVG or icon as a child of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-avatar&gt;</code>
        to replace the default silhouette. The projected content renders only in fallback mode — it
        has no effect when an image loads or initials are set. Use this to represent bots, system
        accounts, and group entities with an icon that matches the avatar's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <tw-avatar color="accent" alt="Team channel" rounded="lg">
            <svg
              class="size-[60%] text-accent-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z"/>
            </svg>
          </tw-avatar>
          <tw-avatar color="warning" alt="Build bot" rounded="lg">
            <svg
              class="size-[60%] text-warning-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M10 2a.75.75 0 01.75.75v1.06A6.5 6.5 0 0116.5 10.25v.5A6.5 6.5 0 0110 17.25a6.5 6.5 0 01-6.5-6.5v-.5A6.5 6.5 0 019.25 3.81V2.75A.75.75 0 0110 2zM7.25 9.5a.75.75 0 100 1.5.75.75 0 000-1.5zm5.5 0a.75.75 0 100 1.5.75.75 0 000-1.5z"/>
            </svg>
          </tw-avatar>
          <tw-avatar color="success" alt="Verified account">
            <svg
              class="size-[60%] text-success-700"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path fill-rule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clip-rule="evenodd"/>
            </svg>
          </tw-avatar>
        </div>
      </div>
      <tw-code-block [code]="projectedSnippet" language="html" />
    </section>

    <!-- Avatar group -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Avatar Group</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-avatar-group&gt;</code>
        stacks its child avatars with a negative margin and a surface-coloured ring so the edges
        stay visible against any background. The group owns the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        — individual
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        inputs on the children are ignored — and the optional
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code>
        input hides the overflow and renders a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">+N</code>
        indicator.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Basic group</p>
            <tw-avatar-group ariaLabel="Project members">
              <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
              <tw-avatar initials="AB" color="success" alt="Alice Brown" />
              <tw-avatar initials="MK" color="accent" alt="Mike Keller" />
              <tw-avatar initials="SL" color="info" alt="Sarah Lee" />
            </tw-avatar-group>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">With max overflow</p>
            <tw-avatar-group [max]="3" ariaLabel="Project members">
              <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
              <tw-avatar initials="AB" color="success" alt="Alice Brown" />
              <tw-avatar initials="MK" color="accent" alt="Mike Keller" />
              <tw-avatar initials="SL" color="info" alt="Sarah Lee" />
              <tw-avatar initials="RW" color="warning" alt="Rob Ward" />
            </tw-avatar-group>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Sizes propagate</p>
            <div class="flex flex-wrap items-end gap-4">
              @for (s of sizes; track s) {
                <div class="flex flex-col items-center gap-1.5">
                  <tw-avatar-group [size]="s" ariaLabel="Team">
                    <tw-avatar initials="A" color="primary" alt="Alice" />
                    <tw-avatar initials="B" color="success" alt="Ben" />
                    <tw-avatar initials="C" color="accent" alt="Chen" />
                  </tw-avatar-group>
                  <span class="text-xs text-fg-muted font-mono">{{ s }}</span>
                </div>
              }
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="groupSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Toggle Mode to see the fallback cascade switch
        between initials and the default silhouette, and pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rounded="lg"</code>
        with a status to see the dot re-anchor to the corner.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Rounded</label>
            <div class="flex gap-1">
              @for (r of roundedOptions; track r) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playRounded() === r"
                  [class.!text-primary-700]="playRounded() === r"
                  (click)="playRounded.set(r)"
                >{{ r }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Status</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playStatus() === null"
                [class.!text-primary-700]="playStatus() === null"
                (click)="playStatus.set(null)"
              >none</button>
              @for (st of statuses; track st) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playStatus() === st"
                  [class.!text-primary-700]="playStatus() === st"
                  (click)="playStatus.set(st)"
                >{{ st }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Mode</label>
            <div class="flex gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playMode() === 'initials'"
                [class.!text-primary-700]="playMode() === 'initials'"
                (click)="playMode.set('initials')"
              >initials</button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playMode() === 'fallback'"
                [class.!text-primary-700]="playMode() === 'fallback'"
                (click)="playMode.set('fallback')"
              >fallback</button>
            </div>
          </div>
        </div>
        <div class="flex items-center justify-center p-8 rounded-lg bg-surface-sunken">
          <tw-avatar
            [initials]="playMode() === 'initials' ? 'JD' : null"
            [color]="playColor()"
            [size]="playSize()"
            [rounded]="playRounded()"
            [status]="playStatus()"
            alt="Playground avatar"
          />
        </div>
      </div>
    </section>
  `,
})
export class AvatarExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly roundedOptions = ROUNDED;
  protected readonly statuses = STATUSES;
  protected readonly initialMap = INITIAL_MAP;

  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playRounded = signal<AvatarRounded>('full');
  protected readonly playStatus = signal<AvatarStatus | null>(null);
  protected readonly playMode = signal<'initials' | 'fallback'>('initials');

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-avatar [initials]="initialMap[c]" [color]="c" [alt]="c" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-avatar initials="JD" color="primary" [size]="s" alt="Jane Doe" />
}`.trim();

  protected readonly roundedSnippet = `
@for (r of roundedOptions; track r) {
  <tw-avatar initials="AC" color="accent" [rounded]="r" alt="Acme Corp" />
}`.trim();

  protected readonly statusSnippet = `
@for (st of statuses; track st) {
  <tw-avatar
    initials="JD"
    color="primary"
    [status]="st"
    [alt]="'Jane Doe, ' + st"
  />
}`.trim();

  protected readonly fallbackSnippet = `<!-- Image loads -->
<tw-avatar
  src="https://i.pravatar.cc/80?img=12"
  initials="JD"
  color="primary"
  alt="Jane Doe"
/>

<!-- Image fails, initials take over -->
<tw-avatar src="/broken-link.png" initials="JD" color="primary" alt="Jane Doe" />

<!-- No image, no initials — default silhouette -->
<tw-avatar alt="Anonymous user" />`;

  protected readonly projectedSnippet = `<tw-avatar color="accent" alt="Team channel" rounded="lg">
  <svg class="size-[60%] text-accent-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="…users icon path…" />
  </svg>
</tw-avatar>

<tw-avatar color="warning" alt="Build bot" rounded="lg">
  <svg class="size-[60%] text-warning-700" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
    <path d="…bot icon path…" />
  </svg>
</tw-avatar>`;

  protected readonly groupSnippet = `<!-- Basic group -->
<tw-avatar-group ariaLabel="Project members">
  <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
  <tw-avatar initials="AB" color="success" alt="Alice Brown" />
  <tw-avatar initials="MK" color="accent"  alt="Mike Keller" />
  <tw-avatar initials="SL" color="info"    alt="Sarah Lee" />
</tw-avatar-group>

<!-- With max overflow -->
<tw-avatar-group [max]="3" ariaLabel="Project members">
  <tw-avatar initials="JD" color="primary" alt="Jane Doe" />
  <tw-avatar initials="AB" color="success" alt="Alice Brown" />
  <tw-avatar initials="MK" color="accent"  alt="Mike Keller" />
  <tw-avatar initials="SL" color="info"    alt="Sarah Lee" />
  <tw-avatar initials="RW" color="warning" alt="Rob Ward" />
</tw-avatar-group>

<!-- Sizes propagate -->
@for (s of sizes; track s) {
  <tw-avatar-group [size]="s" ariaLabel="Team">
    <tw-avatar initials="A" color="primary" alt="Alice" />
    <tw-avatar initials="B" color="success" alt="Ben" />
    <tw-avatar initials="C" color="accent"  alt="Chen" />
  </tw-avatar-group>
}`;
}
