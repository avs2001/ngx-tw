import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import {
  CollapsibleComponent,
  CollapsibleGroupComponent,
  CollapsibleTriggerDirective,
  CollapsibleIconDirective,
} from 'ngx-tw/collapsible';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { CollapsibleVariant } from 'ngx-tw/collapsible';

const VARIANTS: CollapsibleVariant[] = ['default', 'bordered', 'ghost', 'filled'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-collapsible-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CollapsibleComponent,
    CollapsibleGroupComponent,
    CollapsibleTriggerDirective,
    CollapsibleIconDirective,
    ButtonDirective,
    CodeBlockComponent,
    TitleCasePipe,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the panel's visual weight without changing its behavior. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>
        for stacked rows separated by a single divider,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>
        when each panel needs to read as its own card,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        for low-emphasis disclosures inside an existing surface, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        when you want to tint the whole panel with a semantic color.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3">
          @for (v of variants; track v) {
            <tw-collapsible [variant]="v">
              <button twCollapsibleTrigger>{{ v | titlecase }} variant</button>
              <p>This is the <strong>{{ v }}</strong> variant of the collapsible component.</p>
            </tw-collapsible>
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
        input applies to the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bordered</code>
        variants — filled tints the trigger, content, and chevron; bordered only tints the
        outline. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ghost</code>
        variants ignore color so they can sit calmly inside a themed surface.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Filled</p>
            <div class="space-y-2">
              @for (c of colors; track c) {
                <tw-collapsible variant="filled" [color]="c">
                  <button twCollapsibleTrigger>{{ c | titlecase }}</button>
                  <p>Filled variant with {{ c }} color applied.</p>
                </tw-collapsible>
              }
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Bordered</p>
            <div class="space-y-2">
              @for (c of colors; track c) {
                <tw-collapsible variant="bordered" [color]="c">
                  <button twCollapsibleTrigger>{{ c | titlecase }}</button>
                  <p>Bordered variant with {{ c }} color applied.</p>
                </tw-collapsible>
              }
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales the trigger's padding and font, and the content region's padding to
        match. Match the size to the surrounding density —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        reads well in a sidebar of FAQs, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        suits a hero-level disclosure on a marketing page.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-3">
          @for (s of sizes; track s) {
            <tw-collapsible variant="bordered" [size]="s">
              <button twCollapsibleTrigger>Size: {{ s }}</button>
              <p>Content with <strong>{{ s }}</strong> padding applied to trigger and body.</p>
            </tw-collapsible>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        input dims the panel and blocks toggle interactions — both pointer and keyboard. A
        disabled trigger is also skipped over by group arrow-key navigation, so users move
        directly to the next enabled panel.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
            <div class="space-y-2">
              <tw-collapsible variant="bordered" [disabled]="true">
                <button twCollapsibleTrigger>This panel is disabled</button>
                <p>You should never see this content.</p>
              </tw-collapsible>
              <tw-collapsible variant="bordered">
                <button twCollapsibleTrigger>This panel is enabled</button>
                <p>This one toggles normally.</p>
              </tw-collapsible>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Custom Icon -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Icon</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an element marked with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCollapsibleIcon</code>
        to replace the default chevron. The directive applies the standard size and
        transition classes; combine it with a two-way bound
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(open)]</code>
        if you need to swap between two SVG paths — a plus / minus pair is the most
        common variation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-collapsible variant="bordered" [(open)]="customIconOpen">
          <button twCollapsibleTrigger>
            Custom icon collapsible
            <svg twCollapsibleIcon xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              @if (customIconOpen()) {
                <path fill-rule="evenodd" d="M4 10a.75.75 0 01.75-.75h10.5a.75.75 0 010 1.5H4.75A.75.75 0 014 10z" clip-rule="evenodd"/>
              } @else {
                <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
              }
            </svg>
          </button>
          <p>This collapsible uses a plus/minus icon instead of the default chevron.</p>
        </tw-collapsible>
      </div>
      <tw-code-block [code]="customIconSnippet" language="html" />
    </section>

    <!-- Accordion Mode -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accordion Mode</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Wrap a set of panels in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-collapsible-group</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[accordion]="true"</code>
        to enforce a single-open invariant — opening one panel closes the others. The
        group's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
        is a single string in this mode, matching the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        of each child.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-collapsible-group [accordion]="true" [(value)]="accordionValue">
          <tw-collapsible value="about" variant="filled" color="primary">
            <button twCollapsibleTrigger>About</button>
            <p>Learn about the project, its goals, and the team behind it.</p>
          </tw-collapsible>
          <tw-collapsible value="features" variant="filled" color="primary">
            <button twCollapsibleTrigger>Features</button>
            <p>Discover all the features: semantic theming, accessibility, signal-based APIs, and more.</p>
          </tw-collapsible>
          <tw-collapsible value="faq" variant="filled" color="primary">
            <button twCollapsibleTrigger>FAQ</button>
            <p>Frequently asked questions about installation, configuration, and usage patterns.</p>
          </tw-collapsible>
        </tw-collapsible-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ accordionDisplay() }}</p>
      </div>
      <tw-code-block [code]="accordionSnippet" language="html" />
    </section>

    <!-- Independent Group -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Independent Group</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Drop the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accordion</code>
        flag and the same group lets any number of panels stay open simultaneously. The
        group's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(value)]</code>
        becomes a string array of currently open panel values. Group keyboard navigation
        (ArrowUp/Down, Home/End) works identically to accordion mode.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-collapsible-group [(value)]="groupValue">
          <tw-collapsible value="html" variant="bordered">
            <button twCollapsibleTrigger>HTML</button>
            <p>HyperText Markup Language — the standard markup language for documents on the web.</p>
          </tw-collapsible>
          <tw-collapsible value="css" variant="bordered">
            <button twCollapsibleTrigger>CSS</button>
            <p>Cascading Style Sheets — a style sheet language for describing presentation of a document.</p>
          </tw-collapsible>
          <tw-collapsible value="js" variant="bordered">
            <button twCollapsibleTrigger>JavaScript</button>
            <p>A programming language that is one of the core technologies of the World Wide Web.</p>
          </tw-collapsible>
        </tw-collapsible-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ groupValueDisplay() }}</p>
      </div>
      <tw-code-block [code]="independentGroupSnippet" language="html" />
    </section>

    <!-- keepAlive -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">keepAlive Mode</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        By default, content is destroyed when a panel closes — child components
        re-initialize and any in-progress fetches re-fire on the next open. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[keepAlive]="true"</code>
        to render the content on first open and keep it in the DOM thereafter, hidden
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display: none</code>.
        Reach for it when the panel hosts a stateful child or expensive data — increment
        both counters below, then close and reopen each panel to see the difference.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-2">
          <tw-collapsible variant="bordered" [keepAlive]="true" [(open)]="keepAliveOpen">
            <button twCollapsibleTrigger>keepAlive = true (state preserved)</button>
            <div class="flex items-center gap-3">
              <span class="text-sm">Counter: <strong>{{ keepAliveCounter() }}</strong></span>
              <button twButton variant="soft" color="primary" size="xs" (click)="incrementKeepAlive()">Increment</button>
            </div>
          </tw-collapsible>
          <tw-collapsible variant="bordered" [(open)]="destroyOpen">
            <button twCollapsibleTrigger>keepAlive = false (state reset on each open)</button>
            <div class="flex items-center gap-3">
              <span class="text-sm">Counter: <strong>{{ destroyCounter() }}</strong></span>
              <button twButton variant="soft" color="primary" size="xs" (click)="incrementDestroy()">Increment</button>
            </div>
          </tw-collapsible>
        </div>
      </div>
      <tw-code-block [code]="keepAliveSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        with a non-neutral color to see the tinted variant, switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        to see the trigger and content padding scale together, or flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">keepAlive</code>
        on and off to compare destroy-on-close vs. preserve behavior.
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
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="toggleDisabled()"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playKeepAlive()"
                [class.!text-primary-700]="playKeepAlive()"
                (click)="toggleKeepAlive()"
              >keepAlive</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-collapsible
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [disabled]="playDisabled()"
            [keepAlive]="playKeepAlive()"
          >
            <button twCollapsibleTrigger>Playground Collapsible</button>
            <p>Customize the collapsible using the controls above. This content is interactive and fully configurable.</p>
          </tw-collapsible>
        </div>
      </div>
    </section>
  `,
})
export class CollapsibleExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly customIconOpen = signal(false);
  protected readonly accordionValue = signal<string | string[]>('');
  protected readonly groupValue = signal<string | string[]>([]);
  protected readonly keepAliveOpen = signal(false);
  protected readonly destroyOpen = signal(false);
  protected readonly keepAliveCounter = signal(0);
  protected readonly destroyCounter = signal(0);

  protected readonly accordionDisplay = computed(() => {
    const val = this.accordionValue();
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'none';
    return val || 'none';
  });

  protected readonly groupValueDisplay = computed(() => {
    const val = this.groupValue();
    if (Array.isArray(val)) return val.length > 0 ? `[${val.join(', ')}]` : '[]';
    return val || 'none';
  });

  protected readonly playVariant = signal<CollapsibleVariant>('default');
  protected readonly playColor = signal<TwColor>('neutral');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playDisabled = signal(false);
  protected readonly playKeepAlive = signal(false);

  protected incrementKeepAlive(): void {
    this.keepAliveCounter.update((n) => n + 1);
  }

  protected incrementDestroy(): void {
    this.destroyCounter.update((n) => n + 1);
  }

  protected toggleDisabled(): void {
    this.playDisabled.update((v) => !v);
  }

  protected toggleKeepAlive(): void {
    this.playKeepAlive.update((v) => !v);
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-collapsible [variant]="v">
    <button twCollapsibleTrigger>{{ v | titlecase }} variant</button>
    <p>This is the <strong>{{ v }}</strong> variant of the collapsible component.</p>
  </tw-collapsible>
}`.trim();

  protected readonly colorsSnippet = `<!-- Filled -->
@for (c of colors; track c) {
  <tw-collapsible variant="filled" [color]="c">
    <button twCollapsibleTrigger>{{ c | titlecase }}</button>
    <p>Filled variant with {{ c }} color applied.</p>
  </tw-collapsible>
}

<!-- Bordered -->
@for (c of colors; track c) {
  <tw-collapsible variant="bordered" [color]="c">
    <button twCollapsibleTrigger>{{ c | titlecase }}</button>
    <p>Bordered variant with {{ c }} color applied.</p>
  </tw-collapsible>
}`;

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-collapsible variant="bordered" [size]="s">
    <button twCollapsibleTrigger>Size: {{ s }}</button>
    <p>Content with <strong>{{ s }}</strong> padding applied to trigger and body.</p>
  </tw-collapsible>
}`.trim();

  protected readonly statesSnippet = `<tw-collapsible variant="bordered" [disabled]="true">
  <button twCollapsibleTrigger>This panel is disabled</button>
  <p>You should never see this content.</p>
</tw-collapsible>

<tw-collapsible variant="bordered">
  <button twCollapsibleTrigger>This panel is enabled</button>
  <p>This one toggles normally.</p>
</tw-collapsible>`;

  protected readonly customIconSnippet = `<tw-collapsible variant="bordered" [(open)]="open">
  <button twCollapsibleTrigger>
    Custom icon collapsible
    <svg twCollapsibleIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
      @if (open()) {
        <path d="…minus path…"/>
      } @else {
        <path d="…plus path…"/>
      }
    </svg>
  </button>
  <p>This collapsible uses a plus/minus icon instead of the default chevron.</p>
</tw-collapsible>`;

  protected readonly accordionSnippet = `<tw-collapsible-group [accordion]="true" [(value)]="active">
  <tw-collapsible value="about" variant="filled" color="primary">
    <button twCollapsibleTrigger>About</button>
    <p>Learn about the project…</p>
  </tw-collapsible>
  <tw-collapsible value="features" variant="filled" color="primary">
    <button twCollapsibleTrigger>Features</button>
    <p>Discover all the features…</p>
  </tw-collapsible>
  <tw-collapsible value="faq" variant="filled" color="primary">
    <button twCollapsibleTrigger>FAQ</button>
    <p>Frequently asked questions…</p>
  </tw-collapsible>
</tw-collapsible-group>`;

  protected readonly independentGroupSnippet = `<tw-collapsible-group [(value)]="open">
  <tw-collapsible value="html" variant="bordered">
    <button twCollapsibleTrigger>HTML</button>
    <p>HyperText Markup Language…</p>
  </tw-collapsible>
  <tw-collapsible value="css" variant="bordered">
    <button twCollapsibleTrigger>CSS</button>
    <p>Cascading Style Sheets…</p>
  </tw-collapsible>
  <tw-collapsible value="js" variant="bordered">
    <button twCollapsibleTrigger>JavaScript</button>
    <p>A programming language…</p>
  </tw-collapsible>
</tw-collapsible-group>`;

  protected readonly keepAliveSnippet = `<tw-collapsible variant="bordered" [keepAlive]="true" [(open)]="open">
  <button twCollapsibleTrigger>State preserved across toggles</button>
  <div class="flex items-center gap-3">
    <span>Counter: <strong>{{ counter() }}</strong></span>
    <button twButton variant="soft" color="primary" size="xs" (click)="increment()">
      Increment
    </button>
  </div>
</tw-collapsible>`;
}
