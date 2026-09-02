import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  ComboboxComponent,
  ComboboxLoadingTemplateDirective,
  ComboboxOptionTemplateDirective,
} from '@cdevhub/ngx-tw/combobox';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

interface Fruit {
  readonly label: string;
  readonly value: string;
}

interface Country {
  readonly label: string;
  readonly value: string;
  readonly group: 'Americas' | 'Europe' | 'Asia' | 'Oceania';
}

interface User {
  readonly id: number;
  readonly name: string;
  readonly role: string;
  readonly avatarColor: 'primary' | 'success' | 'warning' | 'accent' | 'info';
}

const FRUITS: readonly Fruit[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot' },
  { label: 'Banana', value: 'banana' },
  { label: 'Blackberry', value: 'blackberry' },
  { label: 'Blueberry', value: 'blueberry' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
  { label: 'Kiwi', value: 'kiwi' },
  { label: 'Lemon', value: 'lemon' },
  { label: 'Mango', value: 'mango' },
  { label: 'Orange', value: 'orange' },
  { label: 'Peach', value: 'peach' },
];

const COUNTRIES: readonly Country[] = [
  { label: 'United States', value: 'us', group: 'Americas' },
  { label: 'Canada', value: 'ca', group: 'Americas' },
  { label: 'Brazil', value: 'br', group: 'Americas' },
  { label: 'Mexico', value: 'mx', group: 'Americas' },
  { label: 'United Kingdom', value: 'uk', group: 'Europe' },
  { label: 'Germany', value: 'de', group: 'Europe' },
  { label: 'France', value: 'fr', group: 'Europe' },
  { label: 'Spain', value: 'es', group: 'Europe' },
  { label: 'Italy', value: 'it', group: 'Europe' },
  { label: 'Romania', value: 'ro', group: 'Europe' },
  { label: 'Japan', value: 'jp', group: 'Asia' },
  { label: 'China', value: 'cn', group: 'Asia' },
  { label: 'India', value: 'in', group: 'Asia' },
  { label: 'Singapore', value: 'sg', group: 'Asia' },
  { label: 'Australia', value: 'au', group: 'Oceania' },
  { label: 'New Zealand', value: 'nz', group: 'Oceania' },
];

const USERS: readonly User[] = [
  { id: 1, name: 'Alice Morgan', role: 'Product Manager', avatarColor: 'primary' },
  { id: 2, name: 'Ben Rivera', role: 'Senior Engineer', avatarColor: 'success' },
  { id: 3, name: 'Chen Liu', role: 'Designer', avatarColor: 'accent' },
  { id: 4, name: 'Dana Khan', role: 'Engineering Lead', avatarColor: 'warning' },
  { id: 5, name: 'Erin Smith', role: 'Data Scientist', avatarColor: 'info' },
  { id: 6, name: 'Felix Tanaka', role: 'Researcher', avatarColor: 'primary' },
];

// Simulated server cache for the async example.
const SERVER_PEOPLE: readonly string[] = [
  'Ada Lovelace', 'Alan Turing', 'Barbara Liskov', 'Donald Knuth', 'Edsger Dijkstra',
  'Grace Hopper', 'John von Neumann', 'Linus Torvalds', 'Margaret Hamilton', 'Niklaus Wirth',
  'Radia Perlman', 'Tim Berners-Lee', 'Tony Hoare', 'Vint Cerf', 'Yukihiro Matsumoto',
];

interface FruitOption {
  readonly label: string;
  readonly value: string;
  readonly disabled?: boolean;
}

// Same shape as FRUITS plus a few disabled entries for the navigation-skip demo.
const FRUITS_WITH_DISABLED: readonly FruitOption[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Apricot', value: 'apricot', disabled: true },
  { label: 'Banana', value: 'banana' },
  { label: 'Blackberry', value: 'blackberry' },
  { label: 'Blueberry', value: 'blueberry', disabled: true },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry', disabled: true },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
];

// 120-entry list to demonstrate the internal scroll region.
const LONG_LIST: readonly { label: string; value: string }[] = Array.from({ length: 120 }, (_, i) => {
  const n = i + 1;
  return { label: `Item ${n.toString().padStart(3, '0')}`, value: `item-${n}` };
});

interface CountryCode {
  readonly label: string;
  readonly value: string;
}

const COUNTRY_CITIES: Readonly<Record<string, readonly CountryCode[]>> = {
  us: [
    { label: 'New York', value: 'nyc' },
    { label: 'San Francisco', value: 'sfo' },
    { label: 'Chicago', value: 'chi' },
    { label: 'Austin', value: 'aus' },
  ],
  uk: [
    { label: 'London', value: 'lon' },
    { label: 'Manchester', value: 'man' },
    { label: 'Edinburgh', value: 'edi' },
  ],
  de: [
    { label: 'Berlin', value: 'ber' },
    { label: 'Munich', value: 'muc' },
    { label: 'Hamburg', value: 'ham' },
  ],
  jp: [
    { label: 'Tokyo', value: 'tok' },
    { label: 'Osaka', value: 'osa' },
    { label: 'Kyoto', value: 'kyo' },
  ],
};

const LINKED_COUNTRIES: readonly CountryCode[] = [
  { label: 'United States', value: 'us' },
  { label: 'United Kingdom', value: 'uk' },
  { label: 'Germany', value: 'de' },
  { label: 'Japan', value: 'jp' },
];

const COLORS: readonly TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-combobox-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ComboboxComponent,
    ComboboxOptionTemplateDirective,
    ComboboxLoadingTemplateDirective,
    ButtonDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the input padding, the trigger font scale, and the density of the option
        rows inside the popover. Match the size to neighbouring controls — use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inside a toolbar and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        for a prominent filter at the top of a list view.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono">{{ s }}</span>
              <tw-combobox
                [options]="fruits"
                [size]="s"
                [placeholder]="'Type a fruit (' + s + ')'"
                [aria-label]="'Size ' + s"
                class="w-64"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the focus ring and the active-option highlight. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        on a hero form, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the combobox drives a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for inline controls that should fade into the background.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (c of colors; track c) {
            <tw-combobox
              [options]="fruits"
              [color]="c"
              [placeholder]="c"
              [aria-label]="'Color ' + c"
            />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Async server search -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Async server search</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For server-driven results, set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]="null"</code>
        to disable client filtering and subscribe to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(queryChange)</code>.
        The output is debounced by
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryDebounce</code>
        (default 150ms), so consumers don't need to debounce their own fetch. Drive the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">loading</code>
        input to surface a spinner while the request is in flight, and project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxLoading</code>
        for a skeleton row inside the popover.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="asyncResults()"
          [filterFn]="null"
          [loading]="asyncLoading()"
          (queryChange)="onAsyncQueryChange($event)"
          placeholder="Search computer scientists…"
          aria-label="Computer scientist"
          class="w-80"
        >
          <ng-template twComboboxLoading>
            <div class="p-3 text-sm text-fg-muted flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" class="size-4 shrink-0 animate-spin text-primary-500">
                <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="3" opacity="0.25" />
                <path d="M21 12a9 9 0 0 0-9-9" stroke="currentColor" stroke-width="3" stroke-linecap="round" />
              </svg>
              <span>Searching the directory…</span>
            </div>
          </ng-template>
        </tw-combobox>
        <p class="text-xs text-fg-muted mt-4 font-mono">
          query = "{{ asyncQuery() }}" · loading = {{ asyncLoading() }} · results = {{ asyncResults().length }}
        </p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="asyncTsSnippet" language="ts" />
        <tw-code-block [code]="asyncHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Grouped options -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Grouped options</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">optionGroup</code>
        accessor (or a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">group</code>
        field on the option) is provided, options that share a group render under a labelled
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>
        region. Group headers are not focusable and are skipped during arrow-key navigation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="countries"
          placeholder="Type a country…"
          aria-label="Country"
          class="w-80"
        />
      </div>
      <tw-code-block [code]="groupedSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Sort the source array by group before passing it in — the combobox renders group headers
        in the order it encounters them, so unsorted input produces fragmented sections.
      </p>
    </section>

    <!-- Strict mode -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Strict mode</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Enable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[strict]="true"</code>
        to reject free-text commits — unmatched input reverts to the last committed label on blur,
        and Enter without an active option is a no-op. Use strict mode whenever the consumer must
        choose one of the provided options (categories, statuses, foreign-key references).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [(value)]="strictValue"
          [strict]="true"
          placeholder="Pick a fruit (strict)"
          aria-label="Strict fruit"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ strictValue() ?? 'null' }}</p>
      </div>
      <tw-code-block [code]="strictSnippet" language="html" />
    </section>

    <!-- Free-text creation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Free-text creation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default (non-strict) combobox emits unmatched text via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueCommit</code>
        output with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">source: 'free-text'</code> —
        ideal for tag pickers, email recipients, or any flow where the user can add ad-hoc values.
        Listen for the event, push the raw string into your own collection, and clear the input.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [(inputValue)]="tagInput"
          (valueCommit)="onTagCommit($event)"
          placeholder="Type a tag and press Enter…"
          aria-label="Add a tag"
          class="w-80"
        />
        <div class="mt-4 flex flex-wrap gap-1.5">
          @if (tags().length === 0) {
            <p class="text-xs text-fg-subtle italic">No tags yet — type something and press Enter.</p>
          }
          @for (tag of tags(); track tag) {
            <span class="inline-flex items-center gap-1 rounded-md bg-primary-50 text-primary-700 px-2 py-0.5 text-xs font-medium">
              {{ tag }}
              <button
                type="button"
                class="text-primary-600 hover:text-primary-700 cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500 rounded"
                aria-label="Remove tag"
                (click)="removeTag(tag)"
              >&times;</button>
            </span>
          }
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="freeTextTsSnippet" language="ts" />
        <tw-code-block [code]="freeTextHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Custom option template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom option template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxOption</code>
        template to replace the default label row with rich content — avatars, multi-line rows,
        status chips. The context exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">option</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">active</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">index</code>
        so the template can render state without re-deriving it.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="users"
          [optionLabel]="userLabel"
          [optionValue]="userValue"
          placeholder="Assign a teammate…"
          aria-label="Assignee"
          class="w-96"
        >
          <ng-template twComboboxOption let-u let-selected="selected">
            <span [class]="userAvatarClasses(asUser(u))">{{ userInitials(asUser(u)) }}</span>
            <span class="flex-1 min-w-0">
              <span class="block truncate text-sm text-fg">{{ asUser(u).name }}</span>
              <span class="block truncate text-xs text-fg-muted">{{ asUser(u).role }}</span>
            </span>
            @if (selected) {
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4 shrink-0 text-primary-600">
                <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 0 1 0 1.4l-7.2 7.3a1 1 0 0 1-1.4 0L3.3 9.3a1 1 0 1 1 1.4-1.4l3.8 3.8 6.8-6.9a1 1 0 0 1 1.4 0Z" clip-rule="evenodd" />
              </svg>
            }
          </ng-template>
        </tw-combobox>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="customOptionTsSnippet" language="ts" />
        <tw-code-block [code]="customOptionHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The combobox implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so it composes with any
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>.
        Disabling the control disables the input; the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        stays the option value (or raw string in free-text mode).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [formControl]="reactiveCtrl"
          placeholder="Choose a fruit"
          aria-label="Fruit (reactive forms)"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">
          control.value = {{ reactiveCtrl.value ?? 'null' }} · disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveCtrl.setValue('cherry')">Set cherry</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveCtrl.reset()">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleReactiveDisabled()">
            {{ reactiveCtrl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The same
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>
        makes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        work out of the box. Use this shape for simple ad-hoc forms; for anything with validation
        or grouped state, prefer reactive or signal forms.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          name="fruitTd"
          [options]="fruits"
          [(ngModel)]="tdFruit"
          placeholder="Choose a fruit"
          aria-label="Fruit (template-driven)"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ tdFruit() ?? 'null' }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdFruit.set('banana')">Set banana</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdFruit.set(null)">Clear</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]="true"</code>
        blocks input, prevents the popover from opening, and applies
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-disabled="true"</code>;
        the current value stays readable so the disabled state never hides the user's selection.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[loading]="true"</code>
        keeps the input editable but signals that results are still arriving — pair it with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twComboboxLoading</code>
        template to render a custom skeleton row inside the popover.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Static disabled</p>
            <tw-combobox
              [options]="fruits"
              [disabled]="true"
              placeholder="Not available"
              aria-label="Disabled empty"
              class="w-64"
            />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Interactive toggle</p>
            <tw-combobox
              [options]="fruits"
              [disabled]="toggleDisabled()"
              placeholder="Type a fruit"
              aria-label="Toggle disabled"
              class="w-64"
            />
            <div class="mt-3">
              <button twButton variant="outline" color="neutral" size="xs" (click)="toggleDisabled.update(v => !v)">
                {{ toggleDisabled() ? 'Enable' : 'Disable' }}
              </button>
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Loading</p>
            <tw-combobox
              [options]="fruits"
              [loading]="true"
              placeholder="Loading results…"
              aria-label="Loading"
              class="w-64"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21 signal forms compose with any CVA — including the combobox. Build a model
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>,
        then bind a field with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        Validators like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required()</code>
        run reactively and the field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        without subscriptions.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [formField]="signalForm.fruit"
          placeholder="Choose a fruit"
          aria-label="Fruit (signal forms)"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">
          value = {{ signalForm.fruit().value() ?? 'null' }} ·
          touched = {{ signalForm.fruit().touched() }} ·
          valid = {{ signalForm.fruit().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fruit().value.set('cherry')">Set cherry</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fruit().reset()">Reset</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Inside form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside tw-form-field (auto-naked)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When nested inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>,
        the combobox detects its parent and strips every piece of trigger chrome — border,
        background, padding, focus ring — so the form-field owns the visual frame, floating
        label, and hint/error regions. Use this shape whenever the combobox sits next to other
        labelled controls.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <div class="max-w-sm">
            <tw-form-field>
              <label twLabel>Favourite fruit</label>
              <tw-combobox [options]="fruits" [(value)]="formFieldHintValue" aria-label="Fruit" />
              <span twHint>Pick anything sweet; free-text is allowed.</span>
            </tw-form-field>
          </div>
          <div class="max-w-sm">
            <tw-form-field>
              <label twLabel>Required fruit</label>
              <tw-combobox
                [options]="fruits"
                [formControl]="formFieldRequiredCtrl"
                aria-label="Required fruit"
              />
              @if (formFieldRequiredCtrl.touched && formFieldRequiredCtrl.hasError('required')) {
                <span twError>Pick a fruit before submitting.</span>
              }
            </tw-form-field>
            <div class="flex gap-2 mt-3">
              <button twButton variant="outline" color="neutral" size="xs" (click)="formFieldRequiredCtrl.markAsTouched()">Mark touched</button>
              <button twButton variant="outline" color="neutral" size="xs" (click)="formFieldRequiredCtrl.reset()">Reset</button>
            </div>
          </div>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Prefilled value -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Prefilled value</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a non-null initial
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        and the combobox resolves it against the options array on first render, writing the
        matching label into the input. Late-arriving options (e.g., async-loaded enumerations)
        reconcile automatically once they arrive.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [(value)]="prefilledValue"
          aria-label="Prefilled fruit"
          class="w-72"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ prefilledValue() ?? 'null' }}</p>
      </div>
      <tw-code-block [code]="prefilledSnippet" language="ts" />
    </section>

    <!-- Long list with internal scroll -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Long list with internal scroll</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When the option count exceeds the panel's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">panelMaxHeight</code>
        (256px by default), the listbox scrolls internally and keeps the active option in view
        as the user arrow-navigates. Increase
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">panelMaxHeight</code>
        for dense reference lists, decrease it for cramped UI shells.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="longList"
          [panelMaxHeight]="280"
          placeholder="Search 120 items…"
          aria-label="Long list"
          class="w-80"
        />
      </div>
      <tw-code-block [code]="longListSnippet" language="html" />
    </section>

    <!-- Custom filter -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom filter (fuzzy match)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default filter is a case-insensitive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">startsWith</code>
        on the label, which is right for autocomplete-style pickers. Override
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[filterFn]</code>
        whenever you want a different match rule — substring (shown here), fuzzy scoring, or
        multi-field matching. The function receives the raw option and the trimmed query.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [filterFn]="includesFilter"
          placeholder="Type any substring…"
          aria-label="Fuzzy fruit"
          class="w-80"
        />
      </div>
      <tw-code-block [code]="customFilterSnippet" language="ts" />
    </section>

    <!-- Disabled options -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled options</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Options carrying
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled: true</code>
        (or returning truthy from a custom
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[optionDisabled]</code>
        accessor) render with reduced opacity, are skipped during ArrowUp/ArrowDown navigation,
        and refuse to commit on Enter or click. Use this for inventory items that are temporarily
        unavailable.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruitsWithDisabled"
          placeholder="Some fruits are out of stock"
          aria-label="Disabled options"
          class="w-80"
        />
      </div>
      <tw-code-block [code]="disabledOptionsSnippet" language="ts" />
    </section>

    <!-- Min query length -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min query length</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[minQueryLength]</code>
        to suppress the panel until the user has typed enough to be useful — particularly
        valuable for server-driven searches where every keystroke costs a request. The popover
        opens automatically once the query reaches the threshold.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-combobox
          [options]="fruits"
          [minQueryLength]="2"
          placeholder="Type at least 2 characters…"
          aria-label="Min query length"
          class="w-80"
        />
      </div>
      <tw-code-block [code]="minQuerySnippet" language="html" />
    </section>

    <!-- Linked comboboxes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Linked comboboxes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Drive one combobox's options from another's value. Picking a country here narrows the
        city list; clearing the country resets the city. The pattern is purely reactive — derive
        the dependent options with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">computed()</code>,
        clear the dependent value when the source changes, and the form integration handles the
        rest.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap gap-4">
          <div class="w-64">
            <label class="block text-xs font-medium text-fg-muted mb-1">Country</label>
            <tw-combobox
              [options]="linkedCountries"
              [(value)]="linkedCountry"
              (valueCommit)="onCountryCommit()"
              placeholder="Pick a country"
              aria-label="Country"
            />
          </div>
          <div class="w-64">
            <label class="block text-xs font-medium text-fg-muted mb-1">City</label>
            <tw-combobox
              [options]="linkedCities()"
              [(value)]="linkedCity"
              [disabled]="!linkedCountry()"
              [placeholder]="linkedCountry() ? 'Pick a city' : 'Pick a country first'"
              aria-label="City"
            />
          </div>
        </div>
        <p class="text-xs text-fg-muted mt-4 font-mono">
          country = {{ linkedCountry() ?? 'null' }} · city = {{ linkedCity() ?? 'null' }}
        </p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="linkedTsSnippet" language="ts" />
        <tw-code-block [code]="linkedHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every meaningful input at once. Try toggling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">strict</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">clearable</code>
        off to see the locked-list pattern, or slide the debounce up and watch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">queryChange</code>
        delay accordingly.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-4 mb-6">
          <div class="flex flex-wrap gap-4">
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
              <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
              <div class="flex gap-1">
                @for (s of sizes; track s) {
                  <button twButton variant="ghost" color="neutral" size="xs"
                          [class.!bg-primary-100]="playSize() === s"
                          [class.!text-primary-700]="playSize() === s"
                          (click)="playSize.set(s)">{{ s }}</button>
                }
              </div>
            </div>
          </div>

          <div class="h-px bg-border"></div>

          <div class="flex flex-wrap gap-4">
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Behaviour</label>
              <div class="flex flex-wrap gap-1">
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playStrict()"
                        [class.!text-primary-700]="playStrict()"
                        (click)="playStrict.update(v => !v)">strict</button>
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playClearable()"
                        [class.!text-primary-700]="playClearable()"
                        (click)="playClearable.update(v => !v)">clearable</button>
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playShowChevron()"
                        [class.!text-primary-700]="playShowChevron()"
                        (click)="playShowChevron.update(v => !v)">showChevron</button>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">State</label>
              <div class="flex gap-1">
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playLoading()"
                        [class.!text-primary-700]="playLoading()"
                        (click)="playLoading.update(v => !v)">loading</button>
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playDisabled()"
                        [class.!text-primary-700]="playDisabled()"
                        (click)="playDisabled.update(v => !v)">disabled</button>
              </div>
            </div>
            <div class="min-w-[200px]">
              <label for="playgroundDebounce" class="block text-xs font-medium text-fg-muted mb-1">
                queryDebounce: <span class="font-mono">{{ playDebounce() }}ms</span>
              </label>
              <input
                id="playgroundDebounce"
                type="range"
                min="0"
                max="800"
                step="50"
                [value]="playDebounce()"
                (input)="onDebounceInput($event)"
                class="w-full accent-primary-500"
              />
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-combobox
            [options]="fruits"
            [color]="playColor()"
            [size]="playSize()"
            [strict]="playStrict()"
            [clearable]="playClearable()"
            [showChevron]="playShowChevron()"
            [loading]="playLoading()"
            [disabled]="playDisabled()"
            [queryDebounce]="playDebounce()"
            [(value)]="playValue"
            placeholder="Type a fruit…"
            aria-label="Playground"
            class="w-80"
          />
          <p class="text-xs text-fg-muted mt-4 font-mono">
            value = {{ playValue() === null ? 'null' : playValue() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class ComboboxExamples {
  protected readonly fruits = FRUITS;
  protected readonly countries = COUNTRIES;
  protected readonly users = USERS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly fruitsWithDisabled = FRUITS_WITH_DISABLED;
  protected readonly longList = LONG_LIST;
  protected readonly linkedCountries = LINKED_COUNTRIES;

  // ── Signal Forms ──
  protected readonly signalModel = signal<{ fruit: string | null }>({ fruit: null });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.fruit);
  });

  // ── Inside form-field ──
  protected readonly formFieldHintValue = signal<string | null>(null);
  protected readonly formFieldRequiredCtrl = new FormControl<string | null>(null, {
    validators: Validators.required,
  });

  // ── Prefilled value ──
  protected readonly prefilledValue = signal<string | null>('grape');

  // ── Custom filter ──
  protected readonly includesFilter = (option: unknown, query: string): boolean => {
    const trimmed = query.trim().toLowerCase();
    if (!trimmed) return true;
    return (option as FruitOption).label.toLowerCase().includes(trimmed);
  };

  // ── Linked comboboxes ──
  protected readonly linkedCountry = signal<string | null>(null);
  protected readonly linkedCity = signal<string | null>(null);
  protected readonly linkedCities = computed(() => {
    const country = this.linkedCountry();
    if (!country) return [] as readonly CountryCode[];
    return COUNTRY_CITIES[country] ?? [];
  });
  protected onCountryCommit(): void {
    // Reset the dependent value whenever the source changes.
    this.linkedCity.set(null);
  }

  // ── Strict mode ──
  protected readonly strictValue = signal<string | null>(null);

  // ── Free-text creation ──
  protected readonly tagInput = signal<string>('');
  protected readonly tags = signal<readonly string[]>([]);

  protected onTagCommit(event: { value: string | unknown; source: string }): void {
    if (event.source !== 'free-text') return;
    const raw = typeof event.value === 'string' ? event.value.trim() : '';
    if (!raw) return;
    if (this.tags().includes(raw)) return;
    this.tags.update((list) => [...list, raw]);
    this.tagInput.set('');
  }

  protected removeTag(tag: string): void {
    this.tags.update((list) => list.filter((t) => t !== tag));
  }

  // ── Async server search ──
  protected readonly asyncQuery = signal<string>('');
  protected readonly asyncLoading = signal<boolean>(false);
  protected readonly asyncResults = signal<readonly { label: string; value: string }[]>([]);
  private asyncFetchTimer: ReturnType<typeof setTimeout> | null = null;
  private asyncFetchToken = 0;

  protected onAsyncQueryChange(query: string): void {
    this.asyncQuery.set(query);
    if (this.asyncFetchTimer) {
      clearTimeout(this.asyncFetchTimer);
      this.asyncFetchTimer = null;
    }
    if (!query) {
      this.asyncResults.set([]);
      this.asyncLoading.set(false);
      return;
    }
    this.asyncLoading.set(true);
    const token = ++this.asyncFetchToken;
    this.asyncFetchTimer = setTimeout(() => {
      if (token !== this.asyncFetchToken) return;
      const q = query.toLowerCase();
      const hits = SERVER_PEOPLE.filter((name) => name.toLowerCase().includes(q)).map((name) => ({
        label: name,
        value: name.toLowerCase().replace(/\s+/g, '-'),
      }));
      this.asyncResults.set(hits);
      this.asyncLoading.set(false);
    }, 350);
  }

  // ── Custom option template ──
  protected readonly userLabel = (u: unknown): string => (u as User).name;
  protected readonly userValue = (u: unknown): number => (u as User).id;
  protected asUser(u: unknown): User {
    return u as User;
  }
  protected userInitials(u: User): string {
    return u.name
      .split(' ')
      .map((p) => p.charAt(0))
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }
  protected userAvatarClasses(u: User): string {
    const base =
      'flex items-center justify-center size-8 rounded-full text-xs font-semibold shrink-0';
    switch (u.avatarColor) {
      case 'primary':
        return `${base} bg-primary-100 text-primary-700`;
      case 'success':
        return `${base} bg-success-100 text-success-700`;
      case 'warning':
        return `${base} bg-warning-100 text-warning-700`;
      case 'accent':
        return `${base} bg-accent-100 text-accent-700`;
      case 'info':
        return `${base} bg-info-100 text-info-700`;
    }
  }

  // ── Reactive Forms ──
  protected readonly reactiveCtrl = new FormControl<string | null>('apple');
  protected toggleReactiveDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // ── Template-Driven Forms ──
  protected readonly tdFruit = signal<string | null>('apricot');

  // ── Disabled toggle ──
  protected readonly toggleDisabled = signal<boolean>(false);

  // ── Playground ──
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playStrict = signal<boolean>(false);
  protected readonly playClearable = signal<boolean>(true);
  protected readonly playShowChevron = signal<boolean>(true);
  protected readonly playLoading = signal<boolean>(false);
  protected readonly playDisabled = signal<boolean>(false);
  protected readonly playDebounce = signal<number>(150);
  protected readonly playValue = signal<string | null>(null);

  protected onDebounceInput(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.playDebounce.set(Number(target.value));
  }

  // ── Code snippets ──

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-combobox
    [options]="fruits"
    [size]="s"
    [placeholder]="'Type a fruit (' + s + ')'"
    [aria-label]="'Size ' + s"
  />
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-combobox
    [options]="fruits"
    [color]="c"
    [placeholder]="c"
    [aria-label]="'Color ' + c"
  />
}`.trim();

  protected readonly asyncTsSnippet = `protected readonly query = signal('');
protected readonly loading = signal(false);
protected readonly results = signal<readonly { label: string; value: string }[]>([]);

protected onQueryChange(q: string): void {
  this.query.set(q);
  if (!q) { this.results.set([]); this.loading.set(false); return; }
  this.loading.set(true);
  // Replace with your real HTTP call. queryChange is already debounced
  // by [queryDebounce] (default 150ms), so no extra debouncing is needed.
  setTimeout(() => {
    this.results.set(fetchPeople(q));
    this.loading.set(false);
  }, 350);
}`;

  protected readonly asyncHtmlSnippet = `<tw-combobox
  [options]="results()"
  [filterFn]="null"
  [loading]="loading()"
  (queryChange)="onQueryChange($event)"
  placeholder="Search computer scientists…"
  aria-label="Computer scientist"
>
  <ng-template twComboboxLoading>
    <div class="p-3 text-sm text-fg-muted">Searching the directory…</div>
  </ng-template>
</tw-combobox>`;

  protected readonly groupedSnippet = `// Each option carries a \`group\` field; options sharing
// a group render under a labelled role="group" header.
const countries = [
  { label: 'United States', value: 'us', group: 'Americas' },
  { label: 'Germany',       value: 'de', group: 'Europe'   },
  { label: 'Japan',         value: 'jp', group: 'Asia'     },
  // …
];

<tw-combobox
  [options]="countries"
  placeholder="Type a country…"
  aria-label="Country"
/>`;

  protected readonly strictSnippet = `<tw-combobox
  [options]="fruits"
  [(value)]="fruit"
  [strict]="true"
  placeholder="Pick a fruit (strict)"
  aria-label="Strict fruit"
/>`;

  protected readonly freeTextTsSnippet = `protected readonly tagInput = signal('');
protected readonly tags = signal<readonly string[]>([]);

protected onTagCommit(event: TwComboboxValueCommitEvent<unknown>): void {
  if (event.source !== 'free-text') return;
  const raw = typeof event.value === 'string' ? event.value.trim() : '';
  if (!raw || this.tags().includes(raw)) return;
  this.tags.update(list => [...list, raw]);
  this.tagInput.set('');
}`;

  protected readonly freeTextHtmlSnippet = `<tw-combobox
  [options]="fruits"
  [(inputValue)]="tagInput"
  (valueCommit)="onTagCommit($event)"
  placeholder="Type a tag and press Enter…"
  aria-label="Add a tag"
/>

@for (tag of tags(); track tag) {
  <span class="tag-chip">{{ tag }}</span>
}`;

  protected readonly customOptionTsSnippet = `interface User {
  id: number;
  name: string;
  role: string;
}

protected readonly userLabel = (u: unknown) => (u as User).name;
protected readonly userValue = (u: unknown) => (u as User).id;`;

  protected readonly customOptionHtmlSnippet = `<tw-combobox
  [options]="users"
  [optionLabel]="userLabel"
  [optionValue]="userValue"
  placeholder="Assign a teammate…"
  aria-label="Assignee"
>
  <ng-template twComboboxOption let-u let-selected="selected">
    <span class="avatar-chip">{{ initials(u) }}</span>
    <span class="flex-1 min-w-0">
      <span class="block truncate text-sm text-fg">{{ u.name }}</span>
      <span class="block truncate text-xs text-fg-muted">{{ u.role }}</span>
    </span>
    @if (selected) { <svg class="size-4 text-primary-600">…</svg> }
  </ng-template>
</tw-combobox>`;

  protected readonly reactiveTsSnippet = `protected readonly fruitCtrl = new FormControl<string | null>('apple');`;

  protected readonly reactiveHtmlSnippet = `<tw-combobox
  [options]="fruits"
  [formControl]="fruitCtrl"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly tdTsSnippet = `protected readonly fruit = signal<string | null>('apricot');`;

  protected readonly tdHtmlSnippet = `<tw-combobox
  name="fruit"
  [options]="fruits"
  [(ngModel)]="fruit"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly signalTsSnippet = `protected readonly model = signal<{ fruit: string | null }>({ fruit: null });
protected readonly fruitForm = form(this.model, (p) => {
  required(p.fruit);
});`;

  protected readonly signalHtmlSnippet = `<tw-combobox
  [options]="fruits"
  [formField]="fruitForm.fruit"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Favourite fruit</label>
  <tw-combobox [options]="fruits" [(value)]="value" aria-label="Fruit" />
  <span twHint>Pick anything sweet; free-text is allowed.</span>
</tw-form-field>

<tw-form-field>
  <label twLabel>Required fruit</label>
  <tw-combobox [options]="fruits" [formControl]="ctrl" aria-label="Required fruit" />
  @if (ctrl.touched && ctrl.hasError('required')) {
    <span twError>Pick a fruit before submitting.</span>
  }
</tw-form-field>`;

  protected readonly prefilledSnippet = `protected readonly value = signal<string | null>('grape');
// The combobox resolves the value against \`options\` on first render and writes
// "Grape" into the input. Late-arriving options are reconciled automatically.`;

  protected readonly longListSnippet = `<tw-combobox
  [options]="longList"
  [panelMaxHeight]="280"
  placeholder="Search 120 items…"
  aria-label="Long list"
/>`;

  protected readonly customFilterSnippet = `// Match anywhere in the label, not just the prefix.
protected readonly includesFilter = (option: unknown, query: string): boolean => {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (option as FruitOption).label.toLowerCase().includes(q);
};

// <tw-combobox [options]="fruits" [filterFn]="includesFilter" />`;

  protected readonly disabledOptionsSnippet = `const fruits = [
  { label: 'Apple',      value: 'apple' },
  { label: 'Apricot',    value: 'apricot', disabled: true },
  { label: 'Banana',     value: 'banana' },
  { label: 'Blueberry',  value: 'blueberry', disabled: true },
  // …
];
// Disabled options skip during arrow navigation and refuse to commit.`;

  protected readonly minQuerySnippet = `<tw-combobox
  [options]="fruits"
  [minQueryLength]="2"
  placeholder="Type at least 2 characters…"
  aria-label="Min query length"
/>`;

  protected readonly linkedTsSnippet = `protected readonly country = signal<string | null>(null);
protected readonly city = signal<string | null>(null);
protected readonly cities = computed(() => COUNTRY_CITIES[this.country() ?? ''] ?? []);

protected onCountryCommit(): void {
  // Reset the dependent value whenever the source changes.
  this.city.set(null);
}`;

  protected readonly linkedHtmlSnippet = `<tw-combobox
  [options]="countries"
  [(value)]="country"
  (valueCommit)="onCountryCommit()"
  aria-label="Country"
/>
<tw-combobox
  [options]="cities()"
  [(value)]="city"
  [disabled]="!country()"
  [placeholder]="country() ? 'Pick a city' : 'Pick a country first'"
  aria-label="City"
/>`;

  protected readonly statesSnippet = `<!-- Static disabled -->
<tw-combobox [options]="fruits" [disabled]="true" placeholder="Not available" aria-label="Disabled" />

<!-- Interactive toggle -->
<tw-combobox [options]="fruits" [disabled]="off()" placeholder="Type a fruit" aria-label="Toggle" />
<button twButton (click)="off.update(v => !v)">{{ off() ? 'Enable' : 'Disable' }}</button>

<!-- Loading: input stays editable; popover shows the loading template -->
<tw-combobox [options]="fruits" [loading]="true" placeholder="Loading results…" aria-label="Loading" />`;
}
