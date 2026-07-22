import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { TransferComponent, TransferItemDefDirective } from '@cdevhub/ngx-tw/transfer';
import { AvatarComponent } from '@cdevhub/ngx-tw/avatar';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import {
  FormFieldComponent,
  LabelDirective,
  HintDirective,
  ErrorDirective,
} from '@cdevhub/ngx-tw/form-field';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

// ── Demo data ─────────────────────────────────────────────────────

interface Person {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly initials: string;
  readonly color: TwColor;
}

const TEAM: readonly Person[] = [
  { id: 'ada', name: 'Ada Lovelace', email: 'ada@acme.dev', initials: 'AL', color: 'primary' },
  { id: 'grace', name: 'Grace Hopper', email: 'grace@acme.dev', initials: 'GH', color: 'info' },
  { id: 'alan', name: 'Alan Turing', email: 'alan@acme.dev', initials: 'AT', color: 'success' },
  { id: 'katherine', name: 'Katherine Johnson', email: 'kj@acme.dev', initials: 'KJ', color: 'accent' },
  { id: 'linus', name: 'Linus Torvalds', email: 'linus@acme.dev', initials: 'LT', color: 'warning' },
  { id: 'margaret', name: 'Margaret Hamilton', email: 'mh@acme.dev', initials: 'MH', color: 'secondary' },
  { id: 'dennis', name: 'Dennis Ritchie', email: 'dennis@acme.dev', initials: 'DR', color: 'error' },
  { id: 'barbara', name: 'Barbara Liskov', email: 'barbara@acme.dev', initials: 'BL', color: 'neutral' },
];

interface Scope {
  readonly key: string;
  readonly label: string;
  readonly locked?: boolean;
}

const SCOPES: readonly Scope[] = [
  { key: 'read:billing', label: 'Read billing' },
  { key: 'write:billing', label: 'Manage billing' },
  { key: 'read:members', label: 'View members', locked: true },
  { key: 'write:members', label: 'Invite & remove members' },
  { key: 'deploy', label: 'Deploy to production' },
  { key: 'audit', label: 'Read audit log' },
  { key: 'admin', label: 'Org administration', locked: true },
];

const SMALL_SCOPES: readonly Scope[] = SCOPES.slice(0, 4);

const TIMEZONES: readonly string[] = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Europe/Bucharest',
  'Africa/Cairo',
  'Asia/Dubai',
  'Asia/Kolkata',
  'Asia/Tokyo',
  'Australia/Sydney',
  'Pacific/Auckland',
];

const SIZES3 = ['sm', 'md', 'lg'] as const;
const ALL_SIZES: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const LIST_HEIGHTS = [200, 240, 320] as const;

@Component({
  selector: 'app-transfer-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TransferComponent,
    TransferItemDefDirective,
    AvatarComponent,
    ButtonDirective,
    CodeBlockComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.size</code>
        config sets row and control density across the shared
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwSize</code>
        scale. Because a transfer is two panels plus a control column, it reads best at
        full width — reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        in dense admin screens and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        when the shuttle is the primary task on the page.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          @for (size of sizes3; track size) {
            <div>
              <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ size }}</p>
              <tw-transfer
                [data]="smallScopes"
                [keyFn]="scopeKey"
                [labelFn]="scopeLabel"
                [display]="{ size: size, listHeight: 'auto' }"
                [ngModel]="['read:billing']"
                aria-label="Scopes ({{ size }})"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Search & Select-all -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Search &amp; Select-all</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Turn on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display.showSearch</code>
        to filter each panel, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showSelectAll</code>
        (on by default) for the tri-state header checkbox. Both scope to the filtered list:
        searching, then ticking select-all, checks only the visible matches — the natural
        shape for long option sets like time zones.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="timezones"
          [keyFn]="identity"
          [(ngModel)]="zones"
          [display]="{ showSearch: true, listHeight: 260 }"
          [labels]="{ sourceTitle: 'All time zones', targetTitle: 'Working hours', searchPlaceholder: 'Filter zones…' }"
          aria-label="Time zones"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ zones().length }} zone(s)</p>
      </div>
      <tw-code-block [code]="searchSnippet" language="html" />
    </section>

    <!-- Custom Item Template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Item Template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twTransferItem</code>
        template to render rich rows — here an avatar with a name over a muted email. The
        component still owns the check glyph, selection, and keyboard behavior; you own the
        content. The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelFn</code>
        still drives search and typeahead, so keep it meaningful.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="team"
          [keyFn]="personKey"
          [labelFn]="personLabel"
          [(ngModel)]="reviewers"
          [display]="{ showSearch: true, listHeight: 300 }"
          [labels]="{ sourceTitle: 'Directory', targetTitle: 'Reviewers', searchPlaceholder: 'Search people…' }"
          aria-label="Reviewers"
        >
          <ng-template twTransferItem let-item let-side="side">
            <tw-avatar
              [initials]="$any(item).initials"
              [color]="$any(item).color"
              size="sm"
              class="shrink-0"
            />
            <div class="min-w-0 flex-1">
              <p class="truncate text-fg">{{ $any(item).name }}</p>
              <p class="truncate text-xs text-fg-muted">{{ $any(item).email }}</p>
            </div>
          </ng-template>
        </tw-transfer>
        <p class="text-xs text-fg-muted mt-4 font-mono">reviewers = [{{ reviewers().join(', ') }}]</p>
      </div>
      <tw-code-block [code]="templateHtmlSnippet" language="html" />
      <tw-code-block [code]="templateTsSnippet" language="ts" class="mt-3 block" />
    </section>

    <!-- One-Way -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">One-Way</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">behavior.oneWay</code>
        when items should only flow source → target. The ← button is removed, so once an
        item is added it stays — useful for append-only pickers like notification channels.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [(ngModel)]="channels"
          [behavior]="{ oneWay: true }"
          [labels]="{ sourceTitle: 'Available', targetTitle: 'Enabled (no undo)' }"
          aria-label="Channels (one-way)"
        />
      </div>
      <tw-code-block [code]="oneWaySnippet" language="html" />
    </section>

    <!-- Disabled Items -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled Items</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">behavior.disabledItem</code>
        predicate locks individual rows: they render as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled</code>
        and are excluded from select-all and every move. Here required scopes can't be
        revoked and restricted ones can't be granted, while the rest move freely.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [behavior]="{ disabledItem: isLocked }"
          [ngModel]="['read:members', 'deploy']"
          [labels]="{ sourceTitle: 'Available scopes', targetTitle: 'Granted' }"
          aria-label="Scopes with locked rows"
        />
      </div>
      <tw-code-block [code]="disabledHtmlSnippet" language="html" />
      <tw-code-block [code]="disabledTsSnippet" language="ts" class="mt-3 block" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The control implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        round-trips the target-keys array. Setting it programmatically re-splits the panels
        immediately.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          name="tdScopes"
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [(ngModel)]="tdGranted"
          aria-label="Scopes (template-driven)"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">value = [{{ tdGranted().join(', ') }}]</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdGranted.set(['deploy', 'audit'])">Set deploy, audit</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdGranted.set([])">Clear</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>;
        value, disabled, and touched stay synchronised. Disabling through the form blocks the
        whole control — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [formControl]="reactiveCtrl"
          aria-label="Scopes (reactive)"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = [{{ reactiveCtrl.value.join(', ') }}] · disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveCtrl.setValue(['deploy'])">Set deploy</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveCtrl.reset([])">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleDisabled()">
            {{ reactiveCtrl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and bind a field with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>
        without any subscription.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-transfer
          [data]="scopes"
          [keyFn]="scopeKey"
          [labelFn]="scopeLabel"
          [formField]="signalForm.scopes"
          aria-label="Scopes (signal forms)"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = [{{ signalForm.scopes().value().join(', ') }}] · touched = {{ signalForm.scopes().touched() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.scopes().value.set(['audit'])">Set audit</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.scopes().value.set([])">Clear</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Inside form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside form-field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Nest the transfer in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        to get a label, hint, and validation error region. Below, a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        validator surfaces an error until at least one reviewer is assigned — blur the
        control with an empty target to see it.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-2xl">
          <label twLabel>Required reviewers</label>
          <tw-transfer
            [data]="team"
            [keyFn]="personKey"
            [labelFn]="personLabel"
            [formControl]="ffReviewers"
            aria-label="Required reviewers"
          />
          <span twHint>Assign at least one reviewer before publishing.</span>
          <span twError match="required">Select at least one reviewer.</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every display and behavior knob at once. The controls are split into
        display options (density, height, search, select-all) and behavior options (one-way),
        plus a global disabled toggle.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-x-8 gap-y-4 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wide">Display</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
                <div class="flex gap-1">
                  @for (s of allSizes; track s) {
                    <button
                      twButton
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      [class.!bg-primary-100]="playSize() === s"
                      [class.!text-primary-700]="playSize() === s"
                      (click)="playSize.set(s)"
                    >
                      {{ s }}
                    </button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">List height</label>
                <div class="flex gap-1">
                  @for (h of listHeights; track h) {
                    <button
                      twButton
                      variant="ghost"
                      color="neutral"
                      size="xs"
                      [class.!bg-primary-100]="playListHeight() === h"
                      [class.!text-primary-700]="playListHeight() === h"
                      (click)="playListHeight.set(h)"
                    >
                      {{ h }}
                    </button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Search</label>
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playSearch()"
                  [class.!text-primary-700]="playSearch()"
                  (click)="playSearch.set(!playSearch())"
                >
                  {{ playSearch() ? 'on' : 'off' }}
                </button>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Select-all</label>
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playSelectAll()"
                  [class.!text-primary-700]="playSelectAll()"
                  (click)="playSelectAll.set(!playSelectAll())"
                >
                  {{ playSelectAll() ? 'on' : 'off' }}
                </button>
              </div>
            </div>
          </div>

          <div>
            <p class="text-xs font-semibold text-fg-muted mb-2 uppercase tracking-wide">Behavior</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">One-way</label>
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playOneWay()"
                  [class.!text-primary-700]="playOneWay()"
                  (click)="playOneWay.set(!playOneWay())"
                >
                  {{ playOneWay() ? 'on' : 'off' }}
                </button>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Disabled</label>
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playDisabled()"
                  [class.!text-primary-700]="playDisabled()"
                  (click)="playDisabled.set(!playDisabled())"
                >
                  {{ playDisabled() ? 'on' : 'off' }}
                </button>
              </div>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-transfer
            [data]="scopes"
            [keyFn]="scopeKey"
            [labelFn]="scopeLabel"
            [(ngModel)]="playValue"
            [display]="playDisplay()"
            [behavior]="playBehavior()"
            [disabled]="playDisabled()"
            [labels]="{ sourceTitle: 'Available scopes', targetTitle: 'Granted' }"
            aria-label="Playground"
          />
        </div>
      </div>
    </section>
  `,
})
export class TransferExamples {
  protected readonly team = TEAM;
  protected readonly scopes = SCOPES;
  protected readonly smallScopes = SMALL_SCOPES;
  protected readonly timezones = TIMEZONES;
  protected readonly sizes3 = SIZES3;
  protected readonly allSizes = ALL_SIZES;
  protected readonly listHeights = LIST_HEIGHTS;

  // Accessors
  protected readonly scopeKey = (s: Scope): string => s.key;
  protected readonly scopeLabel = (s: Scope): string => s.label;
  protected readonly isLocked = (s: Scope): boolean => !!s.locked;
  protected readonly personKey = (p: Person): string => p.id;
  protected readonly personLabel = (p: Person): string => p.name;
  protected readonly identity = (tz: string): string => tz;

  // Readouts / models
  protected readonly zones = signal<readonly string[]>(['Europe/Bucharest', 'UTC']);
  protected readonly reviewers = signal<readonly string[]>(['grace']);
  protected readonly channels = signal<readonly string[]>([]);

  // Forms
  protected readonly tdGranted = signal<readonly string[]>(['read:members']);
  protected readonly reactiveCtrl = new FormControl<readonly string[]>(['deploy'], {
    nonNullable: true,
  });
  protected readonly signalModel = signal<{ scopes: readonly string[] }>({ scopes: ['audit'] });
  protected readonly signalForm = form(this.signalModel);
  protected readonly ffReviewers = new FormControl<readonly string[]>([], {
    nonNullable: true,
    validators: Validators.required,
  });

  protected toggleDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // Playground state
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playListHeight = signal<number>(240);
  protected readonly playSearch = signal(true);
  protected readonly playSelectAll = signal(true);
  protected readonly playOneWay = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playValue = signal<readonly string[]>(['read:members']);

  protected readonly playDisplay = computed(() => ({
    size: this.playSize(),
    listHeight: this.playListHeight(),
    showSearch: this.playSearch(),
    showSelectAll: this.playSelectAll(),
  }));

  protected readonly playBehavior = computed(() => ({
    oneWay: this.playOneWay(),
  }));

  // ── Snippets ──

  protected readonly sizesSnippet = `@for (size of sizes; track size) {
  <tw-transfer
    [data]="scopes"
    [keyFn]="scopeKey"
    [labelFn]="scopeLabel"
    [display]="{ size: size, listHeight: 'auto' }"
    [ngModel]="['read:billing']"
  />
}`;

  protected readonly searchSnippet = `<tw-transfer
  [data]="timezones"
  [keyFn]="identity"
  [(ngModel)]="zones"
  [display]="{ showSearch: true, listHeight: 260 }"
  [labels]="{ sourceTitle: 'All time zones', targetTitle: 'Working hours' }"
/>`;

  protected readonly templateHtmlSnippet = `<tw-transfer
  [data]="team"
  [keyFn]="personKey"
  [labelFn]="personLabel"
  [(ngModel)]="reviewers"
  [display]="{ showSearch: true, listHeight: 300 }"
>
  <ng-template twTransferItem let-item let-side="side">
    <tw-avatar [initials]="item.initials" [color]="item.color" size="sm" />
    <div class="min-w-0 flex-1">
      <p class="truncate">{{ item.name }}</p>
      <p class="truncate text-xs text-fg-muted">{{ item.email }}</p>
    </div>
  </ng-template>
</tw-transfer>`;

  protected readonly templateTsSnippet = `interface Person {
  id: string;
  name: string;
  email: string;
  initials: string;
  color: TwColor;
}

protected readonly team: Person[] = [/* … */];
protected readonly reviewers = signal<readonly string[]>(['grace']);
protected readonly personKey = (p: Person) => p.id;
protected readonly personLabel = (p: Person) => p.name;`;

  protected readonly oneWaySnippet = `<tw-transfer
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [(ngModel)]="channels"
  [behavior]="{ oneWay: true }"
  [labels]="{ sourceTitle: 'Available', targetTitle: 'Enabled (no undo)' }"
/>`;

  protected readonly disabledHtmlSnippet = `<tw-transfer
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [behavior]="{ disabledItem: isLocked }"
  [ngModel]="['read:members', 'deploy']"
/>`;

  protected readonly disabledTsSnippet = `interface Scope { key: string; label: string; locked?: boolean; }

// Locked scopes can't be granted or revoked.
protected readonly isLocked = (s: Scope) => !!s.locked;`;

  protected readonly tdTsSnippet = `protected readonly tdGranted = signal<readonly string[]>(['read:members']);`;

  protected readonly tdHtmlSnippet = `<tw-transfer
  name="tdScopes"
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [(ngModel)]="tdGranted"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly reactiveCtrl = new FormControl<readonly string[]>(
  ['deploy'],
  { nonNullable: true },
);`;

  protected readonly reactiveHtmlSnippet = `<tw-transfer
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [formControl]="reactiveCtrl"
/>`;

  protected readonly signalTsSnippet = `import { form } from '@angular/forms/signals';

protected readonly signalModel = signal<{ scopes: readonly string[] }>({ scopes: ['audit'] });
protected readonly signalForm = form(this.signalModel);`;

  protected readonly signalHtmlSnippet = `<tw-transfer
  [data]="scopes"
  [keyFn]="scopeKey"
  [labelFn]="scopeLabel"
  [formField]="signalForm.scopes"
/>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Required reviewers</label>
  <tw-transfer
    [data]="team"
    [keyFn]="personKey"
    [labelFn]="personLabel"
    [formControl]="ffReviewers"
  />
  <span twHint>Assign at least one reviewer before publishing.</span>
  <span twError match="required">Select at least one reviewer.</span>
</tw-form-field>`;
}
