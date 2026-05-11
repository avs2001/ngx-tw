import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import {
  SelectComponent,
  SelectEmptyTemplateDirective,
  SelectHeaderTemplateDirective,
  SelectOptionTemplateDirective,
  SelectTriggerTemplateDirective,
} from 'ngx-tw/select';
import { ButtonDirective } from 'ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from 'ngx-tw/form-field';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

interface Country {
  readonly label: string;
  readonly value: string;
  readonly group?: string;
  readonly disabled?: boolean;
}

interface User {
  readonly id: number;
  readonly name: string;
  readonly email: string;
  readonly avatar: string;
  readonly disabled?: boolean;
}

const COUNTRIES: readonly Country[] = [
  { label: 'United States', value: 'us', group: 'Americas' },
  { label: 'Canada', value: 'ca', group: 'Americas' },
  { label: 'Brazil', value: 'br', group: 'Americas' },
  { label: 'United Kingdom', value: 'uk', group: 'Europe' },
  { label: 'Germany', value: 'de', group: 'Europe' },
  { label: 'France', value: 'fr', group: 'Europe' },
  { label: 'Spain', value: 'es', group: 'Europe' },
  { label: 'Italy', value: 'it', group: 'Europe' },
  { label: 'Romania', value: 'ro', group: 'Europe' },
  { label: 'Japan', value: 'jp', group: 'Asia' },
  { label: 'China', value: 'cn', group: 'Asia' },
  { label: 'India', value: 'in', group: 'Asia', disabled: true },
  { label: 'Australia', value: 'au', group: 'Oceania' },
];

const SIMPLE: readonly Country[] = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
];

const TAGS: readonly Country[] = [
  { label: 'Bug', value: 'bug' },
  { label: 'Feature', value: 'feature' },
  { label: 'Docs', value: 'docs' },
  { label: 'Performance', value: 'perf' },
  { label: 'Refactor', value: 'refactor' },
  { label: 'Security', value: 'security' },
];

const USERS: readonly User[] = [
  { id: 1, name: 'Alice Morgan', email: 'alice@acme.com', avatar: 'AM' },
  { id: 2, name: 'Ben Rivera', email: 'ben@acme.com', avatar: 'BR' },
  { id: 3, name: 'Chen Liu', email: 'chen@acme.com', avatar: 'CL' },
  { id: 4, name: 'Dana Khan', email: 'dana@acme.com', avatar: 'DK' },
  { id: 5, name: 'Erin Smith', email: 'erin@acme.com', avatar: 'ES', disabled: true },
];

const COLORS: TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-select-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SelectComponent,
    SelectOptionTemplateDirective,
    SelectTriggerTemplateDirective,
    SelectEmptyTemplateDirective,
    SelectHeaderTemplateDirective,
    ButtonDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
    JsonPipe,
  ],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the focused border, the active-option background, and the selected
        check mark. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main action surface, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the select drives a themed form region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not draw attention.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (c of colors; track c) {
            <tw-select
              [options]="simple"
              [color]="c"
              [(value)]="colorValues[c]"
              [placeholder]="c"
              [attr.aria-label]="'Color ' + c"
            />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the trigger's padding and font scale, as well as the density of the
        options inside the listbox. Match the size to neighbouring controls — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        select reads well inside a toolbar, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        suits a prominent filter control on a dashboard.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono">{{ s }}</span>
              <tw-select
                [options]="simple"
                [size]="s"
                [(value)]="sizeValues[s]"
                [placeholder]="'Choose a fruit (' + s + ')'"
                [attr.aria-label]="'Size ' + s"
                class="w-64"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Searchable -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Searchable</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[searchable]="true"</code>
        to render a search input at the top of the panel. The default predicate is a
        case-insensitive substring match on the option label — override it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filterPredicate</code>
        when you need to match on other fields. Reach for search once the list grows past
        roughly a dozen options.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="countries"
          [(value)]="searchValue"
          [searchable]="true"
          placeholder="Search for a country"
          aria-label="Country"
          class="w-72"
        />
        <p data-testid="output-searchable" class="text-xs text-fg-muted mt-4 font-mono">selected = {{ searchValue() ?? 'null' }}</p>
      </div>
      <tw-code-block [code]="searchableSnippet" language="html" />
    </section>

    <!-- Multi-select -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Multi-select</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        With
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[multiple]="true"</code>
        the value model becomes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">T[]</code>
        and the panel stays open after each selection. Multi-select pairs naturally with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">searchable</code>
        when users need to filter a long list of tags, assignees, or labels.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="tags"
          [(value)]="tagValues"
          [multiple]="true"
          [searchable]="true"
          placeholder="Add tags"
          aria-label="Tags"
          color="accent"
          class="w-80"
        />
        <p data-testid="output-multi-select" class="text-xs text-fg-muted mt-4 font-mono">
          selected = [{{ (tagValues() | json) }}]
        </p>
      </div>
      <tw-code-block [code]="multiSelectSnippet" language="html" />
    </section>

    <!-- Grouped options -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Grouped options</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Options sharing a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">group</code>
        property render under a labelled
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>
        region inside the listbox. Individual options can also be disabled — India in the
        example below never receives keyboard focus and cannot be selected.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="countries"
          [(value)]="groupValue"
          [searchable]="true"
          placeholder="Select a country"
          aria-label="Country"
          class="w-72"
        />
      </div>
      <tw-code-block [code]="groupedSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Disabling the select blocks trigger activation and panel open; the trigger keeps
        its value so users can still read the current selection.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        surfaces through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        on the trigger for assistive tech; wrap the select in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        to pair it with a visible asterisk and error region.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled with value</p>
            <tw-select
              [options]="simple"
              [value]="'apple'"
              [disabled]="true"
              aria-label="Disabled whole"
              class="w-64"
            />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled without value</p>
            <tw-select
              [options]="simple"
              [disabled]="true"
              placeholder="Not available"
              aria-label="Disabled empty"
              class="w-64"
            />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
            <tw-select
              [options]="simple"
              [required]="true"
              placeholder="Choose a fruit"
              aria-label="Required fruit"
              class="w-64"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The select implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works out of the box. Set the value programmatically with a signal and the
        trigger stays in sync; clearing writes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          name="fruitTd"
          [options]="simple"
          [(ngModel)]="tdFruit"
          placeholder="Choose a fruit"
          aria-label="Fruit (template-driven)"
          class="w-64"
        />
        <p data-testid="output-td-forms" class="text-xs text-fg-muted mt-3 font-mono">value = {{ tdFruit() ?? 'null' }}</p>
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

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        and the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>,
        and touched flags stay synchronised. Toggling disabled on the control also
        blocks the trigger — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="simple"
          [formControl]="reactiveCtrl"
          placeholder="Choose a fruit"
          aria-label="Fruit"
          class="w-64"
        />
        <p data-testid="output-reactive-forms" class="text-xs text-fg-muted mt-3 font-mono">
          control.value = {{ reactiveCtrl.value ?? 'null' }} · disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="reactiveCtrl.setValue('cherry')">Set cherry</button>
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="reactiveCtrl.reset()">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="toggleDisabled()">
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
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        so you can drive UI without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="simple"
          [formField]="signalForm.fruit"
          placeholder="Choose a fruit"
          aria-label="Fruit (signal forms)"
          class="w-64"
        />
        <p data-testid="output-signal-forms" class="text-xs text-fg-muted mt-3 font-mono">
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
      <h2 class="text-sm font-semibold mb-3">Inside form-field (auto-naked)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        When nested inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>,
        the select detects its parent and switches to a chrome-less naked variant — the
        form-field owns the border, focus ring, floating label, and hint/error regions.
        This is the preferred shape whenever the select sits next to labelled inputs.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <div class="max-w-sm">
            <tw-form-field>
              <label twLabel>Country</label>
              <tw-select
                [options]="countries"
                [(value)]="formFieldValue"
                [searchable]="true"
                aria-label="Country"
              />
              <span twHint>Pick the country where you live.</span>
            </tw-form-field>
          </div>

          <div class="max-w-sm">
            <tw-form-field appearance="filled" color="success">
              <label twLabel>Priority</label>
              <tw-select
                [options]="simple"
                [(value)]="priorityValue"
                aria-label="Priority"
              />
            </tw-form-field>
          </div>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Custom option template -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom option template</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twSelectOption</code>
        template to replace the default label with any markup — avatars, multi-line rows,
        status chips. The template context exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selected</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">active</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">index</code>
        so the template can render state without re-deriving it.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="users"
          [optionLabel]="userLabel"
          [optionValue]="userValue"
          [optionDisabled]="userDisabled"
          [(value)]="assigneeValue"
          [searchable]="true"
          [filterPredicate]="userFilter"
          placeholder="Assign a teammate"
          aria-label="Assignee"
          class="w-80"
        >
          <ng-template twSelectOption let-u let-selected="selected">
            <span
              class="flex items-center justify-center size-8 rounded-full bg-primary-100 text-primary-700 text-xs font-semibold shrink-0"
            >{{ asUser(u).avatar }}</span>
            <span class="flex-1 min-w-0">
              <span class="block truncate text-sm">{{ asUser(u).name }}</span>
              <span class="block truncate text-xs text-fg-muted">{{ asUser(u).email }}</span>
            </span>
            @if (selected) {
              <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4 shrink-0 text-primary-600">
                <path fill-rule="evenodd" d="M16.7 5.3a1 1 0 010 1.4l-7.2 7.3a1 1 0 01-1.4 0L3.3 9.3a1 1 0 111.4-1.4l3.8 3.8 6.8-6.9a1 1 0 011.4 0z" clip-rule="evenodd"/>
              </svg>
            }
          </ng-template>
        </tw-select>
      </div>
      <tw-code-block [code]="customOptionSnippet" language="html" />
    </section>

    <!-- Custom trigger -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom trigger</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twSelectTrigger</code>
        template replaces the trigger content entirely. Common uses: render multi-select
        values as chips, show an avatar next to a single-select value, or fall back to a
        prompt string when empty. The context exposes the current value,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open</code>,
        and the resolved selected option objects.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="tags"
          [(value)]="chipValues"
          [multiple]="true"
          [searchable]="true"
          placeholder="Choose tags"
          aria-label="Tags"
          class="w-80"
        >
          <ng-template twSelectTrigger let-empty="empty" let-selectedOptions="selectedOptions">
            @if (empty) {
              <span class="text-fg-subtle">Pick one or more tags…</span>
            } @else {
              <span class="flex flex-wrap gap-1">
                @for (opt of selectedOptions; track asCountry(opt).value) {
                  <span
                    class="inline-flex items-center gap-1 rounded-md bg-surface-muted px-2 py-0.5 text-xs text-fg"
                  >{{ asCountry(opt).label }}</span>
                }
              </span>
            }
          </ng-template>
        </tw-select>
      </div>
      <tw-code-block [code]="customTriggerSnippet" language="html" />
    </section>

    <!-- Custom empty + header -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom empty state &amp; header</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twSelectHeader</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twSelectFooter</code>
        for sticky content around the listbox, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twSelectEmpty</code>
        to replace the default "No results" message — the empty context receives the
        current search string so you can render a "Create X" action.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-select
          [options]="tags"
          [(value)]="fancyValue"
          [searchable]="true"
          placeholder="Search labels"
          aria-label="Labels"
          class="w-72"
        >
          <ng-template twSelectHeader>
            <p class="text-xs text-fg-muted font-medium">Project labels</p>
          </ng-template>
          <ng-template twSelectEmpty let-search>
            <div class="p-4 text-center text-sm text-fg-muted">
              No label matches <strong class="text-fg">"{{ search }}"</strong>.
              <button twButton variant="ghost" color="primary" size="xs" class="ml-1">
                Create
              </button>
            </div>
          </ng-template>
        </tw-select>
      </div>
      <tw-code-block [code]="customEmptySnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">multiple</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">searchable</code>
        to see the multi-select + filter experience, or try
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        alongside a non-primary color to match a themed form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playMultiple()"
                      [class.!text-primary-700]="playMultiple()"
                      (click)="playMultiple.update(v => !v)">multiple</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playSearchable()"
                      [class.!text-primary-700]="playSearchable()"
                      (click)="playSearchable.update(v => !v)">searchable</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playRequired()"
                      [class.!text-primary-700]="playRequired()"
                      (click)="playRequired.update(v => !v)">required</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-select
            [options]="countries"
            [color]="playColor()"
            [size]="playSize()"
            [multiple]="playMultiple()"
            [searchable]="playSearchable()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            [(value)]="playValue"
            placeholder="Pick one…"
            aria-label="Playground"
            class="w-80"
          />
          <p data-testid="output-playground" class="text-xs text-fg-muted mt-3 font-mono">
            value = {{ playValue() === null ? 'null' : (playValue() | json) }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class SelectExamples {
  protected readonly countries = COUNTRIES;
  protected readonly simple = SIMPLE;
  protected readonly tags = TAGS;
  protected readonly users = USERS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  // Single-value bindings
  protected readonly sizeValues: Record<TwSize, WritableSignal<string | readonly string[] | null>> = {
    xs: signal<string | readonly string[] | null>(null),
    sm: signal<string | readonly string[] | null>(null),
    md: signal<string | readonly string[] | null>('apple'),
    lg: signal<string | readonly string[] | null>(null),
    xl: signal<string | readonly string[] | null>(null),
  };

  protected readonly colorValues: Record<TwColor, WritableSignal<string | readonly string[] | null>> = {
    primary: signal<string | readonly string[] | null>('apple'),
    secondary: signal<string | readonly string[] | null>('banana'),
    accent: signal<string | readonly string[] | null>('cherry'),
    neutral: signal<string | readonly string[] | null>(null),
    info: signal<string | readonly string[] | null>('date'),
    success: signal<string | readonly string[] | null>('apple'),
    warning: signal<string | readonly string[] | null>('banana'),
    error: signal<string | readonly string[] | null>(null),
  };

  protected readonly searchValue = signal<string | readonly string[] | null>('de');
  protected readonly tagValues = signal<string | readonly string[] | null>(['bug', 'docs']);
  protected readonly groupValue = signal<string | readonly string[] | null>(null);
  protected readonly assigneeValue = signal<number | readonly number[] | null>(null);
  protected readonly chipValues = signal<string | readonly string[] | null>([]);
  protected readonly fancyValue = signal<string | readonly string[] | null>(null);
  protected readonly formFieldValue = signal<string | readonly string[] | null>(null);
  protected readonly priorityValue = signal<string | readonly string[] | null>(null);

  protected readonly tdFruit = signal<string | null>('apple');

  protected readonly reactiveCtrl = new FormControl<string | null>('banana');

  protected readonly signalModel = signal<{ fruit: string | null }>({ fruit: null });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.fruit);
  });

  // Template-cast helpers (strictTemplates doesn't carry generic T through *twSelectOption)
  protected asUser(u: unknown): User { return u as User; }
  protected asCountry(o: unknown): Country { return o as Country; }

  // User accessors
  protected readonly userLabel = (u: unknown): string => (u as User).name;
  protected readonly userValue = (u: unknown): number => (u as User).id;
  protected readonly userDisabled = (u: unknown): boolean => !!(u as User).disabled;
  protected readonly userFilter = (u: unknown, search: string): boolean => {
    const user = u as User;
    const s = search.toLowerCase();
    return user.name.toLowerCase().includes(s) || user.email.toLowerCase().includes(s);
  };

  // Playground
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playMultiple = signal(false);
  protected readonly playSearchable = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playValue = signal<string | readonly string[] | null>(null);

  protected toggleDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-select
    [options]="simple"
    [color]="c"
    [(value)]="colorValues[c]"
    [placeholder]="c"
    [attr.aria-label]="'Color ' + c"
  />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-select
    [options]="simple"
    [size]="s"
    [(value)]="sizeValues[s]"
    [placeholder]="'Choose a fruit (' + s + ')'"
    [attr.aria-label]="'Size ' + s"
  />
}`.trim();

  protected readonly searchableSnippet = `<tw-select
  [options]="countries"
  [(value)]="searchValue"
  [searchable]="true"
  placeholder="Search for a country"
  aria-label="Country"
/>`;

  protected readonly multiSelectSnippet = `<tw-select
  [options]="tags"
  [(value)]="tagValues"
  [multiple]="true"
  [searchable]="true"
  placeholder="Add tags"
  aria-label="Tags"
  color="accent"
/>`;

  protected readonly groupedSnippet = `// options: each has a \`group\` string; one has \`disabled: true\`
const countries = [
  { label: 'United States', value: 'us', group: 'Americas' },
  { label: 'Germany',       value: 'de', group: 'Europe'   },
  { label: 'India',         value: 'in', group: 'Asia', disabled: true },
  // …
];

<tw-select
  [options]="countries"
  [(value)]="groupValue"
  [searchable]="true"
  placeholder="Select a country"
  aria-label="Country"
/>`;

  protected readonly statesSnippet = `<!-- Disabled with value -->
<tw-select [options]="simple" [value]="'apple'" [disabled]="true" aria-label="Disabled whole" />

<!-- Disabled without value -->
<tw-select [options]="simple" [disabled]="true" placeholder="Not available" aria-label="Disabled empty" />

<!-- Required -->
<tw-select [options]="simple" [required]="true" placeholder="Choose a fruit" aria-label="Required fruit" />`;

  protected readonly tdTsSnippet = `protected readonly fruit = signal<string | null>('apple');`;

  protected readonly tdHtmlSnippet = `<tw-select
  name="fruit"
  [options]="simple"
  [(ngModel)]="fruit"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly fruitCtrl = new FormControl<string | null>('banana');`;

  protected readonly reactiveHtmlSnippet = `<tw-select
  [options]="simple"
  [formControl]="fruitCtrl"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly signalTsSnippet = `protected readonly model = signal<{ fruit: string | null }>({ fruit: null });
protected readonly fruitForm = form(this.model, (p) => {
  required(p.fruit);
});`;

  protected readonly signalHtmlSnippet = `<tw-select
  [options]="simple"
  [formField]="fruitForm.fruit"
  placeholder="Choose a fruit"
  aria-label="Fruit"
/>`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Country</label>
  <tw-select
    [options]="countries"
    [(value)]="country"
    [searchable]="true"
    aria-label="Country"
  />
  <span twHint>Pick the country where you live.</span>
</tw-form-field>

<tw-form-field appearance="filled" color="success">
  <label twLabel>Priority</label>
  <tw-select [options]="simple" [(value)]="priority" aria-label="Priority" />
</tw-form-field>`;

  protected readonly customOptionSnippet = `<tw-select
  [options]="users"
  [optionLabel]="userLabel"
  [optionValue]="userValue"
  [optionDisabled]="userDisabled"
  [(value)]="assigneeValue"
  [searchable]="true"
  [filterPredicate]="userFilter"
  placeholder="Assign a teammate"
  aria-label="Assignee"
>
  <ng-template twSelectOption let-u let-selected="selected">
    <span class="avatar-chip">{{ u.avatar }}</span>
    <span class="flex-1 min-w-0">
      <span class="block truncate text-sm">{{ u.name }}</span>
      <span class="block truncate text-xs text-fg-muted">{{ u.email }}</span>
    </span>
    @if (selected) { <svg class="size-4 text-primary-600">…</svg> }
  </ng-template>
</tw-select>`;

  protected readonly customTriggerSnippet = `<tw-select
  [options]="tags"
  [(value)]="chipValues"
  [multiple]="true"
  [searchable]="true"
  placeholder="Choose tags"
  aria-label="Tags"
>
  <ng-template twSelectTrigger let-empty="empty" let-selectedOptions="selectedOptions">
    @if (empty) {
      <span class="text-fg-subtle">Pick one or more tags…</span>
    } @else {
      <span class="flex flex-wrap gap-1">
        @for (opt of selectedOptions; track opt.value) {
          <span class="tag-chip">{{ opt.label }}</span>
        }
      </span>
    }
  </ng-template>
</tw-select>`;

  protected readonly customEmptySnippet = `<tw-select [options]="tags" [(value)]="label" [searchable]="true" aria-label="Labels">
  <ng-template twSelectHeader>
    <p class="text-xs text-fg-muted font-medium">Project labels</p>
  </ng-template>
  <ng-template twSelectEmpty let-search>
    <div class="p-4 text-center text-sm text-fg-muted">
      No label matches <strong>"{{ search }}"</strong>.
      <button twButton variant="ghost" color="primary" size="xs">Create</button>
    </div>
  </ng-template>
</tw-select>`;
}
