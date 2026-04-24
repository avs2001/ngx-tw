import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { TitleCasePipe } from '@angular/common';
import {
  TabsComponent,
  TabComponent,
  TabTriggerDirective,
  TabContentDirective,
} from 'ngx-tw/tabs';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';
import type { TabsVariant } from 'ngx-tw/tabs';

const VARIANTS: TabsVariant[] = ['underline', 'enclosed', 'pill'];
const COLORS: TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

const MAILBOXES = [
  { value: 'inbox', label: 'Inbox', count: 12 },
  { value: 'starred', label: 'Starred', count: 3 },
  { value: 'archive', label: 'Archive', count: 0 },
] as const;

@Component({
  selector: 'app-tabs-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TabsComponent,
    TabComponent,
    TabTriggerDirective,
    TabContentDirective,
    ButtonDirective,
    CodeBlockComponent,
    TitleCasePipe,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input chooses the visual treatment of the tab strip. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">underline</code>
        for most in-page content switching — it's the quietest and blends into document flow.
        Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>
        when tabs need to read as distinct folder-like surfaces, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        when the tablist sits on a muted background or acts as a standalone control cluster.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <tw-tabs [variant]="v" [(value)]="variantTabs[v]">
                <tw-tab value="account" label="Account">
                  <p class="text-sm text-fg">Manage your profile, email address, and password.</p>
                  <p class="text-sm text-fg-muted mt-1">Changes take effect the next time you sign in.</p>
                </tw-tab>
                <tw-tab value="notifications" label="Notifications">
                  <p class="text-sm text-fg">Control how we contact you about activity on your account.</p>
                  <p class="text-sm text-fg-muted mt-1">You can always pause notifications for up to two weeks.</p>
                </tw-tab>
                <tw-tab value="security" label="Security">
                  <p class="text-sm text-fg">Review recent sessions and configure two-factor authentication.</p>
                  <p class="text-sm text-fg-muted mt-1">We recommend enabling 2FA for every account.</p>
                </tw-tab>
              </tw-tabs>
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
        input tints the active-tab indicator and text. Stick with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main content surface; the semantic colors
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>)
        are worth reaching for when the tablist is part of a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        is the right pick when the tabs shouldn't attract attention away from their content.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (c of colors; track c) {
            <div class="rounded-lg border border-border-muted p-3 bg-surface">
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ c }}</p>
              <tw-tabs [color]="c" variant="underline" [(value)]="colorTabs[c]">
                @for (m of mailboxes; track m.value) {
                  <tw-tab [value]="m.value" [label]="m.label">
                    <div class="flex items-center justify-between">
                      <p class="text-sm text-fg">{{ m.label }}</p>
                      <span class="text-xs font-mono text-fg-muted">{{ m.count }} unread</span>
                    </div>
                  </tw-tab>
                }
              </tw-tabs>
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
        Size controls the trigger padding and font scale. Match the size to the content the tabs
        sit beside —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inside dense toolbars,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        as the default for page-level tabs, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for prominent hero sections and marketing pages.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ s }}</p>
              <tw-tabs [size]="s" variant="pill" [(value)]="sizeTabs[s]">
                <tw-tab value="details" label="Details">
                  <p class="text-sm text-fg-muted">Product details, pricing, and availability.</p>
                </tw-tab>
                <tw-tab value="shipping" label="Shipping">
                  <p class="text-sm text-fg-muted">Delivery options and estimated arrival window.</p>
                </tw-tab>
                <tw-tab value="reviews" label="Reviews">
                  <p class="text-sm text-fg-muted">Customer reviews with star ratings and photos.</p>
                </tw-tab>
              </tw-tabs>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Vertical Orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation="vertical"</code>
        to place the tablist on the side. Vertical tabs shine on settings screens and
        admin interfaces where long labels would wrap uncomfortably in a horizontal strip.
        Arrow key bindings flip accordingly — ArrowDown and ArrowUp become the primary
        navigation keys.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          @for (v of variants; track v) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
              <tw-tabs orientation="vertical" [variant]="v" [(value)]="verticalTabs[v]">
                <tw-tab value="general" label="General">
                  <p class="text-sm text-fg">Workspace name, default timezone, and language.</p>
                  <p class="text-sm text-fg-muted mt-1">Applies to everyone on the team unless overridden per member.</p>
                </tw-tab>
                <tw-tab value="privacy" label="Privacy">
                  <p class="text-sm text-fg">Data retention, analytics, and third-party integrations.</p>
                  <p class="text-sm text-fg-muted mt-1">Changing retention will delete older data on the next daily job.</p>
                </tw-tab>
                <tw-tab value="billing" label="Billing">
                  <p class="text-sm text-fg">Current plan, invoices, and payment methods.</p>
                  <p class="text-sm text-fg-muted mt-1">Next charge on the 1st of next month.</p>
                </tw-tab>
              </tw-tabs>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="verticalSnippet" language="html" />
    </section>

    <!-- Fitted -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Fitted (Equal Width)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[fitted]="true"</code>
        every trigger stretches to fill the tablist's width equally. Use it when the tabs
        represent parallel options of roughly equal weight — editor / preview, week / month,
        or any A / B split — and the container has a fixed width.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs [fitted]="true" variant="enclosed" [(value)]="fittedTab">
          <tw-tab value="code" label="Code">
            <pre class="text-xs font-mono text-fg whitespace-pre overflow-x-auto p-3 rounded-md bg-surface-sunken border border-border">function greet(name) {{ '{' }}
  return &#96;Hello, &#36;{{ '{' }}name{{ '}' }}&#33;&#96;;
{{ '}' }}</pre>
          </tw-tab>
          <tw-tab value="preview" label="Preview">
            <div class="p-4 rounded-md bg-surface-sunken border border-border">
              <p class="text-sm text-fg">Hello, world!</p>
              <p class="text-xs text-fg-muted mt-1">Rendered output appears here.</p>
            </div>
          </tw-tab>
        </tw-tabs>
      </div>
      <tw-code-block [code]="fittedSnippet" language="html" />
    </section>

    <!-- Disabled tab -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled Tab</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]="true"</code>
        on an individual
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-tab</code>
        to prevent selection. Disabled tabs are skipped by keyboard navigation and their
        triggers carry
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>,
        so assistive tech announces them correctly. Prefer disabling over hiding when the
        tab will become available again shortly — hidden tabs break muscle memory.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs [(value)]="disabledTab">
          <tw-tab value="draft" label="Draft">
            <p class="text-sm text-fg">Your post is saved as a draft. You can edit freely.</p>
          </tw-tab>
          <tw-tab value="scheduled" label="Scheduled" [disabled]="true">
            <p class="text-sm text-fg-muted">Upgrade to Pro to schedule posts in advance.</p>
          </tw-tab>
          <tw-tab value="published" label="Published">
            <p class="text-sm text-fg">Published posts are visible to your audience.</p>
          </tw-tab>
        </tw-tabs>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Closable tabs -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Closable Tabs</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[closable]="true"</code>
        on a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-tab</code>
        to render a dismiss button inside its trigger. The component emits the tab's value
        through the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(closed)</code>
        output — the parent is responsible for actually removing it from the backing collection.
        If the active tab is closed, selection moves to the nearest enabled sibling.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs [(value)]="closableTab" (closed)="closeTab($event)">
          <tw-tab value="home" label="Home">
            <p class="text-sm text-fg">Home is always pinned — notice the missing close button.</p>
          </tw-tab>
          @for (tab of closableTabs(); track tab) {
            <tw-tab [value]="tab" [label]="tab | titlecase" [closable]="true">
              <p class="text-sm text-fg">{{ tab | titlecase }} pane content.</p>
              <p class="text-sm text-fg-muted mt-1">Click the × in the trigger to close this tab.</p>
            </tw-tab>
          }
        </tw-tabs>
        @if (closableTabs().length < allClosable.length) {
          <button twButton variant="ghost" color="neutral" size="xs" class="mt-3" (click)="resetClosable()">Reset tabs</button>
        }
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="closableTsSnippet" language="ts" />
        <tw-code-block [code]="closableHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Lazy content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Lazy Content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[lazy]="true"</code>
        on a tab and project its body through an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-template[twTabContent]</code>.
        The panel's contents are not instantiated until the tab becomes active for the first
        time, which is worth it when a panel mounts an expensive subtree — a chart, a data
        grid, or anything that fetches on init. Once activated, the panel stays alive so its
        state is preserved when the user switches away and back.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs [(value)]="lazyTab">
          <tw-tab value="overview" label="Overview">
            <p class="text-sm text-fg">This panel is rendered eagerly with the tabs.</p>
            <p class="text-sm text-fg-muted mt-1">Page opened at {{ mountedAt }}.</p>
          </tw-tab>
          <tw-tab value="analytics" label="Analytics" [lazy]="true">
            <ng-template twTabContent>
              <p class="text-sm text-fg">Pretend this pulled down a chart library on demand.</p>
              <p class="text-sm text-fg-muted mt-1">First mounted at {{ now() }} — it stays alive after that.</p>
            </ng-template>
          </tw-tab>
          <tw-tab value="activity" label="Activity Log" [lazy]="true">
            <ng-template twTabContent>
              <p class="text-sm text-fg">Activity feed loaded lazily.</p>
              <p class="text-sm text-fg-muted mt-1">First mounted at {{ now() }}.</p>
            </ng-template>
          </tw-tab>
        </tw-tabs>
      </div>
      <tw-code-block [code]="lazySnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Lazy panels that need a fresh mount on every activation aren't supported today — the
        component keeps the panel alive once rendered. If you need teardown-on-deselect, toggle
        the panel's rendering manually with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&#64;if</code>
        inside the tab body.
      </p>
    </section>

    <!-- Custom trigger with icons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Triggers with Icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ng-template[twTabTrigger]</code>
        to fully customize the trigger — useful for icon-and-label pairs, badges with unread
        counts, or avatars. The template context exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">active</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        when you need to render different markup per state.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tabs variant="pill" color="accent" [(value)]="iconTab">
          <tw-tab value="dashboard">
            <ng-template twTabTrigger>
              <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M10.75 2a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h6.5a.75.75 0 00.75-.75v-8.5a.75.75 0 00-.75-.75h-6.5zM2.75 2a.75.75 0 00-.75.75v4.5c0 .414.336.75.75.75h6.5a.75.75 0 00.75-.75v-4.5A.75.75 0 009.25 2h-6.5zM2 12.75a.75.75 0 01.75-.75h6.5a.75.75 0 01.75.75v4.5a.75.75 0 01-.75.75h-6.5a.75.75 0 01-.75-.75v-4.5zM12.75 14a.75.75 0 00-.75.75v2.5c0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75v-2.5a.75.75 0 00-.75-.75h-4.5z"/>
              </svg>
              Dashboard
            </ng-template>
            <p class="text-sm text-fg">Top-level KPIs and the last 30 days of traffic.</p>
          </tw-tab>
          <tw-tab value="analytics">
            <ng-template twTabTrigger>
              <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M15.5 2A1.5 1.5 0 0014 3.5v13a1.5 1.5 0 001.5 1.5h1a1.5 1.5 0 001.5-1.5v-13A1.5 1.5 0 0016.5 2h-1zM9.5 6A1.5 1.5 0 008 7.5v9A1.5 1.5 0 009.5 18h1a1.5 1.5 0 001.5-1.5v-9A1.5 1.5 0 0010.5 6h-1zM3.5 10A1.5 1.5 0 002 11.5v5A1.5 1.5 0 003.5 18h1A1.5 1.5 0 006 16.5v-5A1.5 1.5 0 004.5 10h-1z"/>
              </svg>
              Analytics
            </ng-template>
            <p class="text-sm text-fg">Funnel, retention, and cohort breakdowns.</p>
          </tw-tab>
          <tw-tab value="reports">
            <ng-template twTabTrigger let-ctx>
              <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zM10 8a.75.75 0 01.75.75v1.5h1.5a.75.75 0 010 1.5h-1.5v1.5a.75.75 0 01-1.5 0v-1.5h-1.5a.75.75 0 010-1.5h1.5v-1.5A.75.75 0 0110 8z" clip-rule="evenodd"/>
              </svg>
              Reports
              <span class="ml-1 inline-flex items-center justify-center min-w-5 px-1 rounded-full text-2xs font-medium bg-accent-100 text-accent-700">2</span>
              @if (ctx?.active) { <span class="sr-only">(selected)</span> }
            </ng-template>
            <p class="text-sm text-fg">Scheduled reports delivered to your inbox each Monday.</p>
          </tw-tab>
        </tw-tabs>
      </div>
      <tw-code-block [code]="customTriggerSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once. Controls are grouped into
        <em>Appearance</em>
        (variant / color / size) and
        <em>Layout</em>
        (orientation / fitted). Try switching to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        with a saturated color, or to a vertical
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enclosed</code>
        layout, to get a feel for how variants adapt.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Appearance</p>
            <div class="flex flex-wrap gap-4">
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
            </div>
          </div>
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-2">Layout</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Orientation</label>
                <div class="flex gap-1">
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="!playVertical()"
                    [class.!text-primary-700]="!playVertical()"
                    (click)="playVertical.set(false)"
                  >horizontal</button>
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playVertical()"
                    [class.!text-primary-700]="playVertical()"
                    (click)="playVertical.set(true)"
                  >vertical</button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Fitted</label>
                <div class="flex gap-1">
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playFitted()"
                    [class.!text-primary-700]="playFitted()"
                    (click)="playFitted.update(v => !v)"
                  >{{ playFitted() ? 'on' : 'off' }}</button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-tabs
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [orientation]="playVertical() ? 'vertical' : 'horizontal'"
            [fitted]="playFitted()"
            [(value)]="playTab"
          >
            <tw-tab value="profile" label="Profile">
              <p class="text-sm text-fg">Public profile information visible to teammates.</p>
            </tw-tab>
            <tw-tab value="team" label="Team">
              <p class="text-sm text-fg">Team members, invitations, and role assignments.</p>
            </tw-tab>
            <tw-tab value="integrations" label="Integrations">
              <p class="text-sm text-fg">Connected services and API tokens.</p>
            </tw-tab>
          </tw-tabs>
        </div>
      </div>
    </section>
  `,
})
export class TabsExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly mailboxes = MAILBOXES;

  // Per-variant active tabs
  protected readonly variantTabs: Record<TabsVariant, WritableSignal<string>> = {
    underline: signal('account'),
    enclosed: signal('notifications'),
    pill: signal('security'),
  };

  // Per-color active tabs
  protected readonly colorTabs: Record<TwColor, WritableSignal<string>> = {
    primary: signal('inbox'),
    secondary: signal('inbox'),
    accent: signal('starred'),
    neutral: signal('inbox'),
    info: signal('inbox'),
    success: signal('archive'),
    warning: signal('starred'),
    error: signal('inbox'),
  };

  // Per-size active tabs
  protected readonly sizeTabs: Record<TwSize, WritableSignal<string>> = {
    xs: signal('details'),
    sm: signal('details'),
    md: signal('shipping'),
    lg: signal('reviews'),
    xl: signal('details'),
  };

  // Vertical per-variant
  protected readonly verticalTabs: Record<TabsVariant, WritableSignal<string>> = {
    underline: signal('general'),
    enclosed: signal('privacy'),
    pill: signal('billing'),
  };

  protected readonly fittedTab = signal('code');
  protected readonly disabledTab = signal('draft');
  protected readonly closableTab = signal('home');
  protected readonly lazyTab = signal('overview');
  protected readonly iconTab = signal('dashboard');

  // Closable tabs
  protected readonly allClosable = ['draft', 'review', 'published'];
  protected readonly closableTabs = signal([...this.allClosable]);

  protected readonly mountedAt = new Date().toLocaleTimeString();

  closeTab(value: string): void {
    this.closableTabs.update(tabs => tabs.filter(t => t !== value));
    if (this.closableTab() === value) {
      this.closableTab.set('home');
    }
  }

  resetClosable(): void {
    this.closableTabs.set([...this.allClosable]);
  }

  // Playground
  protected readonly playVariant = signal<TabsVariant>('underline');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playFitted = signal(false);
  protected readonly playVertical = signal(false);
  protected readonly playTab = signal('profile');

  now(): string {
    return new Date().toLocaleTimeString();
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-tabs [variant]="v" [(value)]="variantTabs[v]">
    <tw-tab value="account" label="Account">…</tw-tab>
    <tw-tab value="notifications" label="Notifications">…</tw-tab>
    <tw-tab value="security" label="Security">…</tw-tab>
  </tw-tabs>
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-tabs [color]="c" variant="underline" [(value)]="colorTabs[c]">
    @for (m of mailboxes; track m.value) {
      <tw-tab [value]="m.value" [label]="m.label">…</tw-tab>
    }
  </tw-tabs>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-tabs [size]="s" variant="pill" [(value)]="sizeTabs[s]">
    <tw-tab value="details" label="Details">…</tw-tab>
    <tw-tab value="shipping" label="Shipping">…</tw-tab>
    <tw-tab value="reviews" label="Reviews">…</tw-tab>
  </tw-tabs>
}`.trim();

  protected readonly verticalSnippet = `<tw-tabs orientation="vertical" [variant]="v" [(value)]="tab">
  <tw-tab value="general" label="General">…</tw-tab>
  <tw-tab value="privacy" label="Privacy">…</tw-tab>
  <tw-tab value="billing" label="Billing">…</tw-tab>
</tw-tabs>`;

  protected readonly fittedSnippet = `<tw-tabs [fitted]="true" variant="enclosed" [(value)]="tab">
  <tw-tab value="code" label="Code">…</tw-tab>
  <tw-tab value="preview" label="Preview">…</tw-tab>
</tw-tabs>`;

  protected readonly disabledSnippet = `<tw-tabs [(value)]="tab">
  <tw-tab value="draft" label="Draft">…</tw-tab>
  <tw-tab value="scheduled" label="Scheduled" [disabled]="true">…</tw-tab>
  <tw-tab value="published" label="Published">…</tw-tab>
</tw-tabs>`;

  protected readonly closableTsSnippet = `protected readonly allTabs = ['draft', 'review', 'published'];
protected readonly openTabs = signal([...this.allTabs]);
protected readonly active = signal('home');

closeTab(value: string): void {
  this.openTabs.update(tabs => tabs.filter(t => t !== value));
  if (this.active() === value) this.active.set('home');
}`;

  protected readonly closableHtmlSnippet = `<tw-tabs [(value)]="active" (closed)="closeTab($event)">
  <tw-tab value="home" label="Home">…</tw-tab>
  @for (tab of openTabs(); track tab) {
    <tw-tab [value]="tab" [label]="tab | titlecase" [closable]="true">…</tw-tab>
  }
</tw-tabs>`;

  protected readonly lazySnippet = `<tw-tabs [(value)]="tab">
  <tw-tab value="overview" label="Overview">Rendered eagerly</tw-tab>

  <tw-tab value="analytics" label="Analytics" [lazy]="true">
    <ng-template twTabContent>
      <!-- Mounted only on first activation -->
      <app-analytics-chart />
    </ng-template>
  </tw-tab>

  <tw-tab value="activity" label="Activity Log" [lazy]="true">
    <ng-template twTabContent>
      <app-activity-feed />
    </ng-template>
  </tw-tab>
</tw-tabs>`;

  protected readonly customTriggerSnippet = `<tw-tabs variant="pill" color="accent" [(value)]="tab">
  <tw-tab value="dashboard">
    <ng-template twTabTrigger>
      <svg class="size-4 shrink-0" aria-hidden="true">…</svg>
      Dashboard
    </ng-template>
    …
  </tw-tab>

  <tw-tab value="reports">
    <ng-template twTabTrigger let-ctx>
      <svg class="size-4 shrink-0" aria-hidden="true">…</svg>
      Reports
      <span class="badge">2</span>
      @if (ctx.active) { <span class="sr-only">(selected)</span> }
    </ng-template>
    …
  </tw-tab>
</tw-tabs>`;
}
