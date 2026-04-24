import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  ItemComponent,
  ItemLeadingDirective,
  ItemTitleDirective,
  ItemDescriptionDirective,
  ItemTrailingDirective,
} from 'ngx-tw/item';
import type { ItemAlign, ItemSize } from 'ngx-tw/item';
import { BadgeComponent } from 'ngx-tw/badge';
import { AvatarComponent } from 'ngx-tw/avatar';
import { ButtonDirective } from 'ngx-tw/button';
import { IconComponent } from 'ngx-tw/icon';
import { CodeBlockComponent } from 'ngx-tw/code-block';

interface Row {
  readonly id: string;
  readonly title: string;
  readonly code: string;
  readonly owner: string;
  readonly updatedAt: string;
}

interface Person {
  readonly name: string;
  readonly initials: string;
  readonly role: string;
  readonly status: 'active' | 'invited' | 'suspended';
}

const ROWS: readonly Row[] = [
  { id: '1', title: 'Billing export', code: 'BIL-52T22G5R-EIHR', owner: 'alice', updatedAt: 'Feb 23, 2026' },
  { id: '2', title: 'Production deployment', code: 'PRD-91XX83G-2ABCD', owner: 'marco', updatedAt: 'Mar 04, 2026' },
  { id: '3', title: 'Integration test', code: 'INT-40LM17K-7WVQR', owner: 'priya', updatedAt: 'Mar 11, 2026' },
];

const PEOPLE: readonly Person[] = [
  { name: 'Ada Lovelace', initials: 'AL', role: 'Engineering Lead', status: 'active' },
  { name: 'Grace Hopper', initials: 'GH', role: 'Principal Engineer', status: 'active' },
  { name: 'Linus Torvalds', initials: 'LT', role: 'Kernel Maintainer', status: 'invited' },
  { name: 'Margaret Hamilton', initials: 'MH', role: 'Software Architect', status: 'suspended' },
];

const SIZES: ItemSize[] = ['sm', 'md', 'lg'];
const ALIGNS: ItemAlign[] = ['start', 'center'];

@Component({
  selector: 'app-item-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ItemComponent,
    ItemLeadingDirective,
    ItemTitleDirective,
    ItemDescriptionDirective,
    ItemTrailingDirective,
    BadgeComponent,
    AvatarComponent,
    ButtonDirective,
    IconComponent,
    CodeBlockComponent,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input controls row padding, gap, and typography. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for table rows — title and description truncate to a single line each — use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for standard list rows, and reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        when the item is acting as a section header with a larger
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-base font-semibold</code>
        title.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised divide-y divide-border mb-4">
        @for (s of sizes; track s) {
          <div class="px-4 py-3">
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">size="{{ s }}"</p>
            <tw-item [size]="s">
              <div
                twItemLeading
                class="flex items-center justify-center rounded-lg bg-info-50 text-info-600"
                [class.size-8]="s !== 'lg'"
                [class.size-10]="s === 'lg'"
              >
                <tw-icon name="calendar" [size]="s === 'lg' ? 'sm' : 'xs'" />
              </div>
              <span twItemTitle>Scheduled report</span>
              <span twItemDescription>Ships every Monday at 09:00 UTC</span>
            </tw-item>
          </div>
        }
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The leading tile doesn't scale automatically — pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size-8</code>
        for <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        rows and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size-10</code>
        for <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        headers so the icon matches the title's optical weight.
      </p>
    </section>

    <!-- Alignment -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Alignment</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align</code>
        controls how the leading and trailing slots line up with the text stack. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">start</code>
        (the default) whenever a multi-line description is present — the icon sits on
        the title's baseline. Switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">center</code>
        for single-line rows, for list items without a description, or when the trailing
        slot holds a control that wants to be vertically centred on the whole row.
      </p>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
        <div class="rounded-lg border border-border p-4 bg-surface-raised">
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">align="start" (default)</p>
          <tw-item align="start">
            <tw-avatar twItemLeading initials="AL" size="md" />
            <span twItemTitle>Ada Lovelace</span>
            <span twItemDescription>
              Founder of scientific computing — authored the first published algorithm
              intended to be processed by a machine.
            </span>
          </tw-item>
        </div>
        <div class="rounded-lg border border-border p-4 bg-surface-raised">
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">align="center"</p>
          <tw-item align="center">
            <tw-avatar twItemLeading initials="GH" size="md" color="primary" />
            <span twItemTitle>Grace Hopper</span>
            <span twItemDescription>Pioneer of machine-independent programming.</span>
          </tw-item>
        </div>
      </div>
      <tw-code-block [code]="alignmentSnippet" language="html" />
    </section>

    <!-- Interactive -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Interactive</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[interactive]="true"</code>
        turns the row into a keyboard-activatable button — it gains
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="button"</code>,
        a hover background, a focus ring, and emits
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>
        on click, Enter, or Space.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]="true"</code>
        keeps the row rendered but removes it from the tab order and blocks the
        output; leave it
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        when the item is just layout and the projected children carry the semantics.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised overflow-hidden mb-4">
        <ul class="divide-y divide-border">
          @for (person of people; track person.name) {
            <li class="px-4">
              <tw-item
                align="center"
                [interactive]="true"
                [disabled]="person.status === 'suspended'"
                (selected)="onSelect(person)"
              >
                <tw-avatar twItemLeading [initials]="person.initials" size="sm" />
                <span twItemTitle class="flex items-center gap-2">
                  <span>{{ person.name }}</span>
                  @if (person.status === 'invited') {
                    <span twBadge color="warning" size="xs">Invited</span>
                  }
                  @if (person.status === 'suspended') {
                    <span twBadge color="error" size="xs">Suspended</span>
                  }
                </span>
                <span twItemDescription>{{ person.role }}</span>
                <tw-icon twItemTrailing name="chevron-right" size="sm" color="neutral" />
              </tw-item>
            </li>
          }
        </ul>
      </div>
      <p class="text-xs text-fg-muted mb-4 font-mono">
        last selected = {{ lastSelected() ?? '—' }}
      </p>
      <tw-code-block [code]="interactiveSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Reach for this mode on people pickers, settings rows, navigation lists — anywhere
        the whole row should feel like one target. When the row already wraps a native
        anchor or form control, leave
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">interactive</code>
        as <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        to avoid a nested interactive element.
      </p>
    </section>

    <!-- Table composition -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Table cell composition</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        At
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="sm"</code>
        the title and description truncate to a single line each, which is exactly what
        a data-table primary column wants: an icon or avatar, a bold label, and a subdued
        secondary identifier (code, email, path). The row stays aligned across every
        table cell because the typography and spacing come from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-item</code>
        rather than per-cell overrides.
      </p>
      <div class="rounded-lg border border-border bg-surface-raised overflow-hidden mb-4">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left border-b border-border">
              <th class="px-4 py-2 font-medium text-fg-muted">Item</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Owner</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Updated</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border">
            @for (row of rows; track row.id) {
              <tr>
                <td class="px-4 py-2">
                  <tw-item size="sm" align="center">
                    <div
                      twItemLeading
                      class="flex size-8 items-center justify-center rounded-lg bg-info-50 text-info-600"
                    >
                      <tw-icon name="file-text" size="xs" />
                    </div>
                    <span twItemTitle>{{ row.title }}</span>
                    <span twItemDescription>{{ row.code }}</span>
                  </tw-item>
                </td>
                <td class="px-4 py-2 text-fg">{{ row.owner }}</td>
                <td class="px-4 py-2 text-fg-muted">{{ row.updatedAt }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <tw-code-block [code]="tableSnippet" language="html" />
    </section>

    <!-- Rich content in slots -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Rich content in slots</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every slot accepts arbitrary markup, so composed rows can carry inline badges
        inside the title, a trailing action button, or a multi-line description with
        links. Because the slots are layout-only, the projected elements keep their
        native semantics — a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">button</code>
        in the trailing slot stays a real button with its own focus ring.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-item align="center">
          <div
            twItemLeading
            class="flex size-10 items-center justify-center rounded-lg bg-success-50 text-success-600"
          >
            <tw-icon name="package" size="sm" />
          </div>
          <span twItemTitle class="flex items-center gap-2">
            <span>Release v1.4.0</span>
            <span twBadge color="success" variant="soft" size="xs">Latest</span>
            <span twBadge color="info" variant="outline" size="xs">stable</span>
          </span>
          <span twItemDescription>Published 2 hours ago by the release bot.</span>
          <button twItemTrailing twButton size="xs" variant="outline" color="neutral">
            View notes
          </button>
        </tw-item>
      </div>
      <tw-code-block [code]="richSlotsSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Toggle every user-facing input at once. Flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">interactive</code>
        on, then watch the hover background, focus ring, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>
        counter react; try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="center"</code>
        with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="sm"</code>
        for a compact list row, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="start"</code>
        with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="lg"</code>
        for the section-header feel.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Align</label>
            <div class="flex gap-1">
              @for (a of aligns; track a) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playAlign() === a"
                  [class.!text-primary-700]="playAlign() === a"
                  (click)="playAlign.set(a)"
                >{{ a }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Interactive</label>
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="playInteractive()"
              [class.!text-primary-700]="playInteractive()"
              (click)="playInteractive.update(v => !v)"
            >{{ playInteractive() ? 'on' : 'off' }}</button>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Disabled</label>
            <button
              twButton variant="ghost" color="neutral" size="xs"
              [class.!bg-primary-100]="playDisabled()"
              [class.!text-primary-700]="playDisabled()"
              (click)="playDisabled.update(v => !v)"
            >{{ playDisabled() ? 'on' : 'off' }}</button>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-item
            [size]="playSize()"
            [align]="playAlign()"
            [interactive]="playInteractive()"
            [disabled]="playDisabled()"
            (selected)="playSelectedCount.update(c => c + 1)"
          >
            <div
              twItemLeading
              class="flex size-10 items-center justify-center rounded-lg bg-accent-50 text-accent-600"
            >
              <tw-icon name="play-circle" size="sm" />
            </div>
            <span twItemTitle>Playground item</span>
            <span twItemDescription>
              Activate the row to increment the counter — selected {{ playSelectedCount() }} time(s).
            </span>
          </tw-item>
        </div>
      </div>
    </section>
  `,
})
export class ItemExamples {
  protected readonly rows = ROWS;
  protected readonly people = PEOPLE;
  protected readonly sizes = SIZES;
  protected readonly aligns = ALIGNS;

  protected readonly lastSelected = signal<string | null>(null);
  protected readonly playSize = signal<ItemSize>('md');
  protected readonly playAlign = signal<ItemAlign>('start');
  protected readonly playInteractive = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playSelectedCount = signal(0);

  protected onSelect(person: Person): void {
    this.lastSelected.set(person.name);
  }

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-item [size]="s">
    <div twItemLeading class="flex items-center justify-center rounded-lg bg-info-50 text-info-600"
         [class.size-8]="s !== 'lg'" [class.size-10]="s === 'lg'">
      <tw-icon name="calendar" [size]="s === 'lg' ? 'sm' : 'xs'" />
    </div>
    <span twItemTitle>Scheduled report</span>
    <span twItemDescription>Ships every Monday at 09:00 UTC</span>
  </tw-item>
}`.trim();

  protected readonly alignmentSnippet = `<!-- align="start" — default, aligns leading slot to title baseline -->
<tw-item align="start">
  <tw-avatar twItemLeading initials="AL" size="md" />
  <span twItemTitle>Ada Lovelace</span>
  <span twItemDescription>
    Founder of scientific computing — authored the first published algorithm
    intended to be processed by a machine.
  </span>
</tw-item>

<!-- align="center" — vertically centres leading/trailing on the whole row -->
<tw-item align="center">
  <tw-avatar twItemLeading initials="GH" size="md" color="primary" />
  <span twItemTitle>Grace Hopper</span>
  <span twItemDescription>Pioneer of machine-independent programming.</span>
</tw-item>`;

  protected readonly interactiveSnippet = `
<ul class="divide-y divide-border rounded-lg border border-border bg-surface-raised overflow-hidden">
  @for (person of people; track person.name) {
    <li class="px-4">
      <tw-item
        align="center"
        [interactive]="true"
        [disabled]="person.status === 'suspended'"
        (selected)="onSelect(person)"
      >
        <tw-avatar twItemLeading [initials]="person.initials" size="sm" />
        <span twItemTitle class="flex items-center gap-2">
          <span>{{ person.name }}</span>
          @if (person.status === 'invited') {
            <span twBadge color="warning" size="xs">Invited</span>
          }
          @if (person.status === 'suspended') {
            <span twBadge color="error" size="xs">Suspended</span>
          }
        </span>
        <span twItemDescription>{{ person.role }}</span>
        <tw-icon twItemTrailing name="chevron-right" size="sm" color="neutral" />
      </tw-item>
    </li>
  }
</ul>`.trim();

  protected readonly tableSnippet = `
<table class="w-full text-sm">
  <thead>
    <tr class="bg-surface-muted text-left border-b border-border">
      <th class="px-4 py-2 font-medium text-fg-muted">Item</th>
      <th class="px-4 py-2 font-medium text-fg-muted">Owner</th>
      <th class="px-4 py-2 font-medium text-fg-muted">Updated</th>
    </tr>
  </thead>
  <tbody class="divide-y divide-border">
    @for (row of rows; track row.id) {
      <tr>
        <td class="px-4 py-2">
          <tw-item size="sm" align="center">
            <div twItemLeading class="flex size-8 items-center justify-center rounded-lg bg-info-50 text-info-600">
              <tw-icon name="file-text" size="xs" />
            </div>
            <span twItemTitle>{{ row.title }}</span>
            <span twItemDescription>{{ row.code }}</span>
          </tw-item>
        </td>
        <td class="px-4 py-2 text-fg">{{ row.owner }}</td>
        <td class="px-4 py-2 text-fg-muted">{{ row.updatedAt }}</td>
      </tr>
    }
  </tbody>
</table>`.trim();

  protected readonly richSlotsSnippet = `<tw-item align="center">
  <div twItemLeading class="flex size-10 items-center justify-center rounded-lg bg-success-50 text-success-600">
    <tw-icon name="package" size="sm" />
  </div>
  <span twItemTitle class="flex items-center gap-2">
    <span>Release v1.4.0</span>
    <span twBadge color="success" variant="soft" size="xs">Latest</span>
    <span twBadge color="info" variant="outline" size="xs">stable</span>
  </span>
  <span twItemDescription>Published 2 hours ago by the release bot.</span>
  <button twItemTrailing twButton size="xs" variant="outline" color="neutral">
    View notes
  </button>
</tw-item>`;
}
