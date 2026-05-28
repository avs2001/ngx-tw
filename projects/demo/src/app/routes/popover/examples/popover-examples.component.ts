import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import {
  PopoverDirective,
  PopoverCloseDirective,
  POPOVER_DATA,
  POPOVER_REF,
  type PopoverPosition,
  type PopoverBackdrop,
  type PopoverRef,
  type PopoverTrigger,
} from '@cdevhub/ngx-tw/popover';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

const POSITIONS: PopoverPosition[] = [
  'top', 'top-start', 'top-end',
  'bottom', 'bottom-start', 'bottom-end',
  'left', 'left-start', 'left-end',
  'right', 'right-start', 'right-end',
];

const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const TRIGGERS: PopoverTrigger[] = ['click', 'focus', 'manual'];
const BACKDROPS: PopoverBackdrop[] = ['transparent', 'dimmed', 'none'];

interface UserProfile {
  readonly name: string;
  readonly handle: string;
  readonly role: string;
  readonly avatar: string;
  readonly email: string;
  readonly timezone: string;
}

const USER: UserProfile = {
  name: 'Margaret Hamilton',
  handle: '@mhamilton',
  role: 'Lead systems engineer',
  avatar: 'MH',
  email: 'margaret@acme.com',
  timezone: 'Boston (UTC−4)',
};

interface InviteCardData {
  readonly name: string;
  readonly team: string;
}

@Component({
  selector: 'app-popover-invite-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective],
  template: `
    <p class="text-sm font-semibold text-fg mb-1">Invite {{ data.name }}</p>
    <p class="text-sm text-fg-muted mb-3">They'll join the <strong>{{ data.team }}</strong> team as a viewer.</p>
    <div class="flex justify-end gap-2">
      <button twButton variant="ghost" size="sm" (click)="ref.close()">Cancel</button>
      <button twButton color="primary" size="sm" (click)="accept()">Send invite</button>
    </div>
  `,
})
class InviteCardComponent {
  protected readonly data = inject<InviteCardData>(POPOVER_DATA);
  protected readonly ref = inject<PopoverRef>(POPOVER_REF);

  protected accept(): void {
    this.ref.close();
  }
}

@Component({
  selector: 'app-popover-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [PopoverDirective, PopoverCloseDirective, ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Positions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Positions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pick the placement relative to the trigger. The four base positions
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">right</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">left</code>) center the
        panel along the trigger's axis; the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-start</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-end</code>
        variants align it to the leading or trailing edge. CDK's flexible-connected strategy falls
        back automatically when there isn't enough space — so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>
        near the viewport's bottom edge will flip to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap gap-2">
          @for (pos of positions; track pos) {
            <button
              twButton variant="outline" size="sm"
              [twPopover]="posContent"
              [twPopoverPosition]="pos"
              twPopoverSize="sm"
            >{{ pos }}</button>
            <ng-template #posContent>
              <p class="text-sm text-fg">Position: <strong>{{ pos }}</strong></p>
            </ng-template>
          }
        </div>
      </div>
      <tw-code-block [code]="positionsSnippet" language="html" />
    </section>

    <!-- Triggers -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Triggers</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">click</code>
        (default) is the right fit for most cases — users can decide when to reveal the panel and
        it stays open while they interact with it.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">focus</code>
        opens on keyboard / pointer focus and closes on blur (unless focus moves into the panel)
        — useful for inline form hints that accompany a specific field.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">manual</code>
        disables all trigger interactions so you can drive open / close from your own logic via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twPopoverOpen)]</code>
        or the directive instance.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          @for (t of triggers; track t) {
            @if (t === 'manual') {
              <div class="inline-flex items-center gap-1">
                <button
                  twButton variant="outline" size="sm"
                  [twPopover]="triggerContent"
                  [twPopoverTriggerOn]="t"
                  #manualRef="twPopover"
                >{{ t }}</button>
                <button twButton variant="ghost" color="neutral" size="xs" (click)="manualRef.toggle()">toggle</button>
              </div>
            } @else {
              <button
                twButton variant="outline" size="sm"
                [twPopover]="triggerContent"
                [twPopoverTriggerOn]="t"
              >{{ t }}</button>
            }
            <ng-template #triggerContent>
              <p class="text-sm text-fg">Opened by <strong>{{ t }}</strong>.</p>
            </ng-template>
          }
        </div>
      </div>
      <tw-code-block [code]="triggersSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the panel's padding only — the panel grows to fit its content. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for tight contextual chips, the default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for confirmation prompts and profile cards, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for settings forms or anything with multiple groups of controls.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          @for (s of sizes; track s) {
            <button
              twButton variant="outline" size="sm"
              [twPopover]="sizeContent"
              [twPopoverSize]="s"
            >{{ s }}</button>
            <ng-template #sizeContent>
              <p class="text-sm text-fg">This popover uses size <strong>{{ s }}</strong>.</p>
            </ng-template>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Color Accents</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A colored top border marks the popover's purpose without coloring the whole panel. Reach
        for the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        accents for confirmation and destructive-action popovers; leave the color off for neutral
        information panels where the accent would add noise.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          @for (c of colors; track c) {
            <button
              twButton variant="outline" size="sm"
              [twPopover]="colorContent"
              [twPopoverColor]="c"
            >{{ c }}</button>
            <ng-template #colorContent>
              <p class="text-sm text-fg">Color accent: <strong>{{ c }}</strong></p>
            </ng-template>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Rich content patterns -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Rich Content Patterns</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Two realistic shapes you'll reach for the most. A <em>profile card</em> shows a user
        summary with secondary actions — bigger than a tooltip, smaller than a dialog. A
        <em>settings form</em> lets the user adjust a local preference inline without navigating
        away. Both keep the trigger on screen so the user's context is preserved.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Profile card</p>
          <button twButton variant="outline" [twPopover]="profileContent" twPopoverPosition="bottom-start" twPopoverSize="lg">
            <span class="inline-flex items-center gap-2">
              <span class="size-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-semibold">
                {{ user.avatar }}
              </span>
              {{ user.name }}
            </span>
          </button>
          <ng-template #profileContent>
            <div class="flex items-center gap-3 mb-3">
              <div class="size-12 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center font-semibold shrink-0">
                {{ user.avatar }}
              </div>
              <div class="min-w-0">
                <p class="text-sm font-semibold text-fg truncate">{{ user.name }}</p>
                <p class="text-xs text-fg-muted truncate">{{ user.handle }} · {{ user.role }}</p>
              </div>
            </div>
            <dl class="space-y-1.5 text-sm mb-4">
              <div class="flex gap-2">
                <dt class="text-fg-muted shrink-0 w-16">Email</dt>
                <dd class="text-fg truncate">{{ user.email }}</dd>
              </div>
              <div class="flex gap-2">
                <dt class="text-fg-muted shrink-0 w-16">Where</dt>
                <dd class="text-fg">{{ user.timezone }}</dd>
              </div>
            </dl>
            <div class="flex justify-end gap-2">
              <button twButton variant="ghost" size="sm" twPopoverClose>Close</button>
              <button twButton color="primary" size="sm">View profile</button>
            </div>
          </ng-template>
        </div>

        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Inline settings form</p>
          <button twButton variant="outline" [twPopover]="settingsContent" twPopoverSize="lg">
            Notifications
          </button>
          <ng-template #settingsContent let-close="close">
            <p class="text-sm font-semibold text-fg mb-3">Notification preferences</p>
            <div class="space-y-2.5 mb-4">
              <label class="flex items-start gap-3 text-sm">
                <input type="checkbox" class="mt-0.5 accent-primary-600" [checked]="pref().email" (change)="toggle('email')" />
                <span>
                  <span class="text-fg font-medium">Email digest</span>
                  <span class="block text-xs text-fg-muted">Weekly summary every Monday at 09:00.</span>
                </span>
              </label>
              <label class="flex items-start gap-3 text-sm">
                <input type="checkbox" class="mt-0.5 accent-primary-600" [checked]="pref().mentions" (change)="toggle('mentions')" />
                <span>
                  <span class="text-fg font-medium">Mentions &amp; replies</span>
                  <span class="block text-xs text-fg-muted">Real-time alerts when someone @mentions you.</span>
                </span>
              </label>
              <label class="flex items-start gap-3 text-sm">
                <input type="checkbox" class="mt-0.5 accent-primary-600" [checked]="pref().releases" (change)="toggle('releases')" />
                <span>
                  <span class="text-fg font-medium">Release notes</span>
                  <span class="block text-xs text-fg-muted">Heads-up on major product updates.</span>
                </span>
              </label>
            </div>
            <div class="flex justify-end gap-2 pt-2 border-t border-border-muted">
              <button twButton variant="ghost" size="sm" (click)="close()">Cancel</button>
              <button twButton color="primary" size="sm" (click)="savePrefs(close)">Save</button>
            </div>
          </ng-template>
        </div>
      </div>
      <tw-code-block [code]="richContentSnippet" language="html" />
    </section>

    <!-- Template context with data -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template Context</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass data to the template via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twPopoverData]</code>
        and receive it on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code>. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close</code>
        function is available on the template context as well — use it when you need to close
        after running some code (after saving, after a confirmation).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton [twPopover]="contextContent" [twPopoverData]="contextData" twPopoverColor="primary">
            Invite teammate
          </button>
          @if (lastInvite(); as name) {
            <span class="text-xs text-fg-muted">Last action: invited <strong class="text-fg">{{ name }}</strong></span>
          }
        </div>
        <ng-template #contextContent let-data let-close="close">
          <p class="text-sm font-semibold text-fg mb-1">Invite {{ data.name }}?</p>
          <p class="text-sm text-fg-muted mb-3">They'll receive an email with your team link.</p>
          <div class="flex justify-end gap-2">
            <button twButton variant="ghost" size="sm" (click)="close()">Cancel</button>
            <button twButton color="primary" size="sm" (click)="recordInvite(data.name, close)">Send invite</button>
          </div>
        </ng-template>
      </div>
      <tw-code-block [code]="contextSnippet" language="html" />
    </section>

    <!-- Component content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Component Content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a component class when the popover has enough state to deserve its own file. The
        projected component receives the data via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_DATA</code>
        and a ref with a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close()</code>
        method via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">POPOVER_REF</code>.
        This is the same pattern the Dialog and Toast services use, so the content can be reused
        across surfaces.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton [twPopover]="inviteCardComponent" [twPopoverData]="inviteData" twPopoverSize="lg" twPopoverColor="primary">
          Invite via component
        </button>
      </div>
      <tw-code-block [code]="componentTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="componentHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Close Directive -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Close Directive</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Drop
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twPopoverClose</code>
        on any element inside the panel and clicking it closes the popover. Use it on cancel /
        close buttons — it's cleaner than wiring <code class="font-mono">(click)="close()"</code>
        everywhere and still works when the template doesn't bind to the context at all.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" color="error" [twPopover]="closeDemoContent" twPopoverColor="error">
          Delete 3 items
        </button>
        <ng-template #closeDemoContent>
          <p class="text-sm text-fg font-semibold mb-1">Delete 3 items?</p>
          <p class="text-sm text-fg-muted mb-4">This permanently removes them from all your projects.</p>
          <div class="flex justify-end gap-2">
            <button twButton variant="ghost" size="sm" twPopoverClose>Cancel</button>
            <button twButton color="error" size="sm" twPopoverClose>Delete</button>
          </div>
        </ng-template>
      </div>
      <tw-code-block [code]="closeSnippet" language="html" />
    </section>

    <!-- Dismissal behavior -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Dismissal Behavior</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Three knobs control how users can close a popover besides pressing the trigger again.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">backdrop</code>
        picks between a transparent outside-click catcher (default), a dimmed overlay for modal
        feel, or none.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeOnOutside</code>
        only matters when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">backdrop="none"</code>
        — set it to false for popovers that should only close programmatically or via Escape.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closeOnEscape</code>
        is true by default and should stay true for any interactive content.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Backdrop</p>
          <div class="flex flex-wrap gap-2">
            @for (b of backdrops; track b) {
              <button
                twButton variant="outline" size="sm"
                [twPopover]="dismissContent"
                [twPopoverBackdrop]="b"
              >{{ b }}</button>
              <ng-template #dismissContent>
                <p class="text-sm text-fg">Backdrop: <strong>{{ b }}</strong></p>
              </ng-template>
            }
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">No-arrow variant</p>
          <button twButton variant="outline" size="sm" [twPopover]="noArrowContent" [twPopoverArrow]="false">
            Hidden arrow
          </button>
          <ng-template #noArrowContent>
            <p class="text-sm text-fg">No arrow indicator is drawn toward the trigger.</p>
          </ng-template>
        </div>
      </div>
      <tw-code-block [code]="dismissalSnippet" language="html" />
    </section>

    <!-- Programmatic control -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Programmatic Control</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Grab the directive via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">exportAs="twPopover"</code>
        and call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open()</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close()</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">toggle()</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reposition()</code>
        from your template or class. Pair with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">triggerOn="manual"</code>
        when you want to own the open/close flow entirely.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-2 flex-wrap">
          <button
            twButton variant="outline"
            [twPopover]="progContent"
            #pop="twPopover"
            twPopoverTriggerOn="manual"
          >Target</button>
          <button twButton size="sm" (click)="pop.open()">open()</button>
          <button twButton size="sm" variant="ghost" (click)="pop.close()">close()</button>
          <button twButton size="sm" variant="outline" (click)="pop.toggle()">toggle()</button>
        </div>
        <ng-template #progContent>
          <p class="text-sm text-fg">Opened programmatically via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">exportAs</code>.</p>
        </ng-template>
      </div>
      <tw-code-block [code]="programmaticSnippet" language="html" />
    </section>

    <!-- Two-way binding -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Two-way Open Binding</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(twPopoverOpen)]</code>
        mirrors the open state into a signal you control. Use it when the popover's visibility is
        part of your component's state — for example, when another action in the page needs to
        open or close the popover, or when you want to persist the open state across route
        changes.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3 flex-wrap">
          <button twButton [twPopover]="modelContent" [(twPopoverOpen)]="isOpen">
            Toggle popover
          </button>
          <span class="text-xs text-fg-muted font-mono">isOpen = {{ isOpen() }}</span>
          <button twButton variant="ghost" size="sm" (click)="isOpen.set(!isOpen())">
            Toggle externally
          </button>
        </div>
        <ng-template #modelContent>
          <p class="text-sm text-fg">This popover's state is mirrored in an external signal.</p>
        </ng-template>
      </div>
      <tw-code-block [code]="modelSnippet" language="html" />
    </section>

    <!-- Disabled -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twPopoverDisabled]="true"</code>
        suppresses every trigger interaction and force-closes the popover if it's already open.
        Pair it with a
        <a routerLink="/components/tooltip" class="text-primary-600 hover:underline">Tooltip</a>
        that explains <em>why</em> the popover is unavailable when the reason isn't obvious from
        context.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" [twPopover]="disabledContent" [twPopoverDisabled]="true">
          Disabled trigger
        </button>
        <ng-template #disabledContent>
          <p class="text-sm text-fg">This should never appear.</p>
        </ng-template>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every option that affects the panel's appearance and behavior. A realistic
        starting config is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom</code>
        position,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        size, no color accent, arrow on — the shape most confirmation popovers end up in. Flip
        the color to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        to see the destructive-action treatment.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Placement</p>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Position</label>
              <div class="flex flex-wrap gap-1">
                @for (pos of positions; track pos) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playPosition() === pos"
                    [class.!text-primary-700]="playPosition() === pos"
                    (click)="playPosition.set(pos)"
                  >{{ pos }}</button>
                }
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
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
                <label class="block text-xs font-medium text-fg-muted mb-1">Color accent</label>
                <div class="flex flex-wrap gap-1">
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playColor() === undefined"
                    [class.!text-primary-700]="playColor() === undefined"
                    (click)="playColor.set(undefined)"
                  >none</button>
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
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Behavior</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Backdrop</label>
                <div class="flex gap-1">
                  @for (b of backdrops; track b) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playBackdrop() === b"
                      [class.!text-primary-700]="playBackdrop() === b"
                      (click)="playBackdrop.set(b)"
                    >{{ b }}</button>
                  }
                </div>
              </div>
              <div class="flex items-end gap-1">
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playArrow()"
                  [class.!text-primary-700]="playArrow()"
                  (click)="playArrow.update(v => !v)"
                >arrow</button>
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playTrapFocus()"
                  [class.!text-primary-700]="playTrapFocus()"
                  (click)="playTrapFocus.update(v => !v)"
                >trap focus</button>
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playCloseOnEscape()"
                  [class.!text-primary-700]="playCloseOnEscape()"
                  (click)="playCloseOnEscape.update(v => !v)"
                >close on escape</button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-12 rounded-lg bg-surface-sunken flex items-center justify-center">
          <button
            twButton
            [twPopover]="playContent"
            [twPopoverPosition]="playPosition()"
            [twPopoverSize]="playSize()"
            [twPopoverColor]="playColor()"
            [twPopoverArrow]="playArrow()"
            [twPopoverBackdrop]="playBackdrop()"
            [twPopoverTrapFocus]="playTrapFocus()"
            [twPopoverCloseOnEscape]="playCloseOnEscape()"
          >Open popover</button>
          <ng-template #playContent>
            <p class="text-sm font-semibold text-fg mb-1">Playground popover</p>
            <p class="text-sm text-fg-muted mb-3">{{ playPosition() }} · {{ playSize() }}{{ playColor() ? ' · ' + playColor() : '' }}</p>
            <button twButton size="sm" variant="outline" twPopoverClose>Close</button>
          </ng-template>
        </div>
      </div>
    </section>
  `,
})
export class PopoverExamples {
  protected readonly positions = POSITIONS;
  protected readonly sizes = SIZES;
  protected readonly colors = COLORS;
  protected readonly triggers = TRIGGERS;
  protected readonly backdrops = BACKDROPS;

  protected readonly user = USER;

  protected readonly pref = signal({ email: true, mentions: true, releases: false });
  protected toggle(key: 'email' | 'mentions' | 'releases'): void {
    this.pref.update((p) => ({ ...p, [key]: !p[key] }));
  }
  protected savePrefs(close: () => void): void {
    // In a real app, persist this.pref() to a store / API.
    close();
  }

  protected readonly contextData = { name: 'Tomás Aguilar' };
  protected readonly lastInvite = signal<string | undefined>(undefined);
  protected recordInvite(name: string, close: () => void): void {
    this.lastInvite.set(name);
    close();
  }

  protected readonly inviteData: InviteCardData = {
    name: 'Erin Shaw',
    team: 'Design systems',
  };
  protected readonly inviteCardComponent = InviteCardComponent;

  protected readonly isOpen = signal(false);

  // Playground
  protected readonly playPosition = signal<PopoverPosition>('bottom');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playColor = signal<TwColor | undefined>(undefined);
  protected readonly playArrow = signal(true);
  protected readonly playBackdrop = signal<PopoverBackdrop>('transparent');
  protected readonly playTrapFocus = signal(true);
  protected readonly playCloseOnEscape = signal(true);

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly positionsSnippet = `@for (pos of positions; track pos) {
  <button
    twButton variant="outline" size="sm"
    [twPopover]="posContent"
    [twPopoverPosition]="pos"
  >{{ pos }}</button>

  <ng-template #posContent>
    <p>Position: <strong>{{ pos }}</strong></p>
  </ng-template>
}`;

  protected readonly triggersSnippet = `<!-- click (default) -->
<button twButton [twPopover]="content" twPopoverTriggerOn="click">click</button>

<!-- focus — opens on focus, closes on blur -->
<button twButton [twPopover]="content" twPopoverTriggerOn="focus">focus</button>

<!-- manual — drive open/close from code -->
<button twButton [twPopover]="content" twPopoverTriggerOn="manual" #p="twPopover">manual</button>
<button twButton (click)="p.toggle()">toggle</button>`;

  protected readonly sizesSnippet = `@for (s of sizes; track s) {
  <button twButton [twPopover]="content" [twPopoverSize]="s">{{ s }}</button>
}`;

  protected readonly colorsSnippet = `@for (c of colors; track c) {
  <button twButton [twPopover]="content" [twPopoverColor]="c">{{ c }}</button>
}`;

  protected readonly richContentSnippet = `<!-- Profile card -->
<button twButton [twPopover]="profileContent" twPopoverPosition="bottom-start" twPopoverSize="lg">
  <span class="inline-flex items-center gap-2">
    <span class="size-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center">
      {{ user.avatar }}
    </span>
    {{ user.name }}
  </span>
</button>
<ng-template #profileContent>
  <div class="flex items-center gap-3 mb-3">
    <div class="size-12 rounded-full bg-primary-100 text-primary-700">{{ user.avatar }}</div>
    <div>
      <p class="font-semibold">{{ user.name }}</p>
      <p class="text-xs text-fg-muted">{{ user.handle }} · {{ user.role }}</p>
    </div>
  </div>
  <!-- details + actions -->
  <div class="flex justify-end gap-2">
    <button twButton variant="ghost" size="sm" twPopoverClose>Close</button>
    <button twButton color="primary" size="sm">View profile</button>
  </div>
</ng-template>

<!-- Inline settings form -->
<button twButton [twPopover]="settingsContent" twPopoverSize="lg">Notifications</button>
<ng-template #settingsContent let-close="close">
  <p class="font-semibold">Notification preferences</p>
  <!-- checkboxes wired to this.pref() -->
  <div class="flex justify-end gap-2">
    <button twButton variant="ghost" size="sm" (click)="close()">Cancel</button>
    <button twButton color="primary" size="sm" (click)="savePrefs(close)">Save</button>
  </div>
</ng-template>`;

  protected readonly contextSnippet = `<button
  twButton
  [twPopover]="content"
  [twPopoverData]="contextData"
  twPopoverColor="primary"
>Invite teammate</button>

<ng-template #content let-data let-close="close">
  <p class="font-semibold">Invite {{ data.name }}?</p>
  <p class="text-fg-muted">They'll receive an email with your team link.</p>
  <div class="flex justify-end gap-2">
    <button twButton variant="ghost" size="sm" (click)="close()">Cancel</button>
    <button twButton color="primary" size="sm" (click)="recordInvite(data.name, close)">
      Send invite
    </button>
  </div>
</ng-template>`;

  protected readonly componentTsSnippet = `@Component({
  selector: 'app-invite-card',
  imports: [ButtonDirective],
  template: \`
    <p class="font-semibold">Invite {{ data.name }}</p>
    <p class="text-fg-muted">They'll join the <strong>{{ data.team }}</strong> team.</p>
    <div class="flex justify-end gap-2">
      <button twButton variant="ghost" size="sm" (click)="ref.close()">Cancel</button>
      <button twButton color="primary" size="sm" (click)="accept()">Send invite</button>
    </div>
  \`,
})
class InviteCardComponent {
  protected readonly data = inject<InviteCardData>(POPOVER_DATA);
  protected readonly ref  = inject<PopoverRef>(POPOVER_REF);

  protected accept(): void {
    // …save, then close
    this.ref.close();
  }
}`;

  protected readonly componentHtmlSnippet = `<button
  twButton
  [twPopover]="InviteCardComponent"
  [twPopoverData]="{ name: 'Erin Shaw', team: 'Design systems' }"
  twPopoverSize="lg"
  twPopoverColor="primary"
>Invite via component</button>`;

  protected readonly closeSnippet = `<button twButton [twPopover]="confirm" twPopoverColor="error">Delete 3 items</button>

<ng-template #confirm>
  <p class="font-semibold">Delete 3 items?</p>
  <p class="text-fg-muted">This permanently removes them from all your projects.</p>
  <div class="flex justify-end gap-2">
    <!-- twPopoverClose fires close() on click with no wiring on your side -->
    <button twButton variant="ghost" size="sm" twPopoverClose>Cancel</button>
    <button twButton color="error"  size="sm" twPopoverClose>Delete</button>
  </div>
</ng-template>`;

  protected readonly dismissalSnippet = `<!-- Backdrop variants -->
<button twButton [twPopover]="c" twPopoverBackdrop="transparent">transparent (default)</button>
<button twButton [twPopover]="c" twPopoverBackdrop="dimmed">dimmed</button>
<button twButton [twPopover]="c" twPopoverBackdrop="none">none</button>

<!-- Stop closing on outside click (backdrop="none" only) -->
<button twButton [twPopover]="c"
  twPopoverBackdrop="none"
  [twPopoverCloseOnOutside]="false"
>Sticky popover</button>

<!-- Arrow indicator -->
<button twButton [twPopover]="c" [twPopoverArrow]="false">Hidden arrow</button>`;

  protected readonly programmaticSnippet = `<button
  twButton
  [twPopover]="content"
  #pop="twPopover"
  twPopoverTriggerOn="manual"
>Target</button>

<button twButton (click)="pop.open()">open()</button>
<button twButton (click)="pop.close()">close()</button>
<button twButton (click)="pop.toggle()">toggle()</button>
<button twButton (click)="pop.reposition()">reposition()</button>`;

  protected readonly modelSnippet = `protected readonly isOpen = signal(false);

<button twButton [twPopover]="content" [(twPopoverOpen)]="isOpen">
  Toggle popover
</button>
<span>isOpen = {{ isOpen() }}</span>
<button twButton (click)="isOpen.set(!isOpen())">Toggle externally</button>`;

  protected readonly disabledSnippet = `<button twButton [twPopover]="content" [twPopoverDisabled]="true">
  Disabled trigger
</button>`;
}
