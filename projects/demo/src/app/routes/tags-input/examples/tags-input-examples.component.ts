import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
  type WritableSignal,
} from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
  TagsInputComponent,
  type TwTagCompareFn,
  type TwTagFactory,
  type TwTagLabelFn,
} from '@cdevhub/ngx-tw/tags-input';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import {
  FormFieldComponent,
  HintDirective,
  ErrorDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

interface Assignee {
  readonly id: string;
  readonly name: string;
}

const COLORS: TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-tags-input-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TagsInputComponent,
    ButtonDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    CodeBlockComponent,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the container's focus ring and the chip accent. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main input on a form, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the field drives a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (c of colors; track c) {
            <tw-tags-input
              [color]="c"
              [(ngModel)]="colorValues[c]"
              [placeholder]="c + '…'"
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
        Size controls the container padding, chip density, and text scale. Match it to neighbouring
        controls — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        tags input fits a compact filter bar, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        suits a prominent recipients field.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono shrink-0">{{ s }}</span>
              <tw-tags-input
                [size]="s"
                [(ngModel)]="sizeValues[s]"
                placeholder="Add a tag…"
                [attr.aria-label]="'Size ' + s"
                class="flex-1"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Separators -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Separators &amp; paste</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">separatorKeys</code>
        lists the keys and characters that commit the typed text. The default is Enter and comma;
        add
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">' '</code>
        (space) or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">';'</code>
        for inputs where users paste delimited lists. Pasting splits on the single-character
        separators while preserving interior whitespace — paste
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">New York, Los Angeles</code>
        and you get two tags, not four.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Comma &amp; Enter (default)</p>
            <tw-tags-input [(ngModel)]="cityValues" placeholder="Paste comma-separated cities…" aria-label="Cities" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Space &amp; semicolon</p>
            <tw-tags-input
              [separatorKeys]="spaceSeparators"
              [(ngModel)]="hashtagValues"
              color="accent"
              placeholder="Type hashtags, space to commit…"
              aria-label="Hashtags"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="separatorsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'Enter'</code>
        is a key name, not a character, so it never splits pasted text — only single-character
        separators do.
      </p>
    </section>

    <!-- Max & duplicates -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Limits &amp; duplicates</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxTags</code>
        caps the number of tags — further commits are blocked and announced to screen readers. By
        default a tag equal to an existing one (per
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compareWith</code>) is
        dropped; set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">allowDuplicates</code>
        to keep repeats.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Max 5 skills</p>
            <tw-tags-input [maxTags]="5" [(ngModel)]="skillValues" placeholder="Add up to 5 skills…" aria-label="Skills" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Duplicates allowed</p>
            <tw-tags-input [allowDuplicates]="true" [(ngModel)]="dupValues" placeholder="Repeats are kept…" aria-label="With duplicates" />
          </div>
        </div>
      </div>
      <tw-code-block [code]="limitsSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Disabling the control blocks typing and chip removal while keeping the current chips
        readable.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        surfaces through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        on the inner input; wrap the control in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>
        to pair it with a visible asterisk and error region.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled with values</p>
            <tw-tags-input [disabled]="true" [(ngModel)]="disabledValues" aria-label="Disabled" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
            <tw-tags-input [required]="true" [(ngModel)]="requiredValues" placeholder="At least one tag…" aria-label="Required tags" />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Object tags -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Object tags</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The value type is generic. Supply
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">createTag</code>
        to turn typed text into an object,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tagLabel</code>
        to render its chip, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">compareWith</code>
        so deduplication compares by identity rather than reference. Here each tag is an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ '{' }} id, name {{ '}' }}</code>
        assignee keyed by a normalized id.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tags-input
          [createTag]="assigneeFactory"
          [tagLabel]="assigneeLabel"
          [compareWith]="assigneeCompare"
          [(ngModel)]="assigneeValues"
          color="info"
          placeholder="Add an assignee…"
          aria-label="Assignees"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ assigneeSummary() }}</p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="objectTsSnippet" language="ts" />
        <tw-code-block [code]="objectHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The control implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        round-trips the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">string[]</code>
        value. Setting it programmatically updates the chips immediately.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tags-input
          name="tagsTd"
          [(ngModel)]="tdTags"
          placeholder="Add a label…"
          aria-label="Labels (template-driven)"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">value = [{{ tdTags().join(', ') }}]</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdTags.set(['bug', 'feature'])">Set bug, feature</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdTags.set([])">Clear</button>
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
        value, disabled, and touched flags stay synchronised. Disabling the control through the form
        also blocks the input — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tags-input [formControl]="reactiveCtrl" placeholder="Add a label…" aria-label="Labels" />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = [{{ reactiveCtrl.value.join(', ') }}] · disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="reactiveCtrl.setValue(['urgent', 'review'])">Set tags</button>
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
        without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-tags-input [formField]="signalForm.labels" placeholder="Add a label…" aria-label="Labels (signal forms)" />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = [{{ signalForm.labels().value().join(', ') }}] · touched = {{ signalForm.labels().touched() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.labels().value.set(['docs'])">Set docs</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.labels().value.set([])">Clear</button>
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
        When nested inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>,
        the tags input strips its own border so the form-field owns the border, focus ring, floating
        label, and hint/error regions. This is the preferred shape next to other labelled fields.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6 max-w-md">
          <tw-form-field>
            <label twLabel>Recipients</label>
            <tw-tags-input [(ngModel)]="ffRecipients" aria-label="Recipients" />
            <span twHint>Press Enter or comma after each address.</span>
          </tw-form-field>

          <tw-form-field color="success">
            <label twLabel>Tags</label>
            <tw-tags-input [formControl]="ffTagsCtrl" aria-label="Tags" />
            <span twError match="required">Add at least one tag.</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Try a non-primary color with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">addOnBlur</code>
        for a quick-entry field, or set a low
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxTags</code>
        and watch commits get blocked once the limit is hit.
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
            <div class="flex flex-wrap gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playAddOnBlur()"
                      [class.!text-primary-700]="playAddOnBlur()"
                      (click)="playAddOnBlur.update(toggle)">addOnBlur</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playAllowDuplicates()"
                      [class.!text-primary-700]="playAllowDuplicates()"
                      (click)="playAllowDuplicates.update(toggle)">allowDuplicates</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(toggle)">disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playRequired()"
                      [class.!text-primary-700]="playRequired()"
                      (click)="playRequired.update(toggle)">required</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Max</label>
            <div class="flex gap-1">
              @for (m of maxOptions; track m) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playMax() === m"
                        [class.!text-primary-700]="playMax() === m"
                        (click)="playMax.set(m)">{{ m === undefined ? 'none' : m }}</button>
              }
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-tags-input
            [color]="playColor()"
            [size]="playSize()"
            [addOnBlur]="playAddOnBlur()"
            [allowDuplicates]="playAllowDuplicates()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            [maxTags]="playMax()"
            [(ngModel)]="playValues"
            placeholder="Type and press Enter…"
            aria-label="Playground"
          />
          <p class="text-xs text-fg-muted mt-3 font-mono">value = [{{ playValues().join(', ') }}]</p>
        </div>
      </div>
    </section>
  `,
})
export class TagsInputExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly toggle = (v: boolean): boolean => !v;

  protected readonly colorValues: Record<TwColor, WritableSignal<string[]>> = {
    primary: signal(['design', 'frontend']),
    secondary: signal(['ops']),
    accent: signal(['featured']),
    neutral: signal(['draft']),
    info: signal(['note']),
    success: signal(['shipped']),
    warning: signal(['review']),
    error: signal(['blocked']),
  };

  protected readonly sizeValues: Record<TwSize, WritableSignal<string[]>> = {
    xs: signal(['xs']),
    sm: signal(['sm']),
    md: signal(['urgent', 'review']),
    lg: signal(['lg']),
    xl: signal(['xl']),
  };

  protected readonly spaceSeparators: readonly string[] = ['Enter', ' ', ';'];

  protected readonly cityValues = signal<string[]>(['New York', 'Los Angeles']);
  protected readonly hashtagValues = signal<string[]>(['angular', 'tailwind']);
  protected readonly skillValues = signal<string[]>(['TypeScript', 'RxJS']);
  protected readonly dupValues = signal<string[]>(['apple', 'apple']);
  protected readonly disabledValues = signal<string[]>(['locked', 'readonly']);
  protected readonly requiredValues = signal<string[]>([]);

  // Object tags
  protected readonly assigneeValues = signal<Assignee[]>([
    { id: 'alice', name: 'Alice' },
    { id: 'ben', name: 'Ben' },
  ]);
  protected readonly assigneeFactory: TwTagFactory<Assignee> = (text) => ({
    id: text.trim().toLowerCase(),
    name: text.trim(),
  });
  protected readonly assigneeLabel: TwTagLabelFn<Assignee> = (a) => a.name;
  protected readonly assigneeCompare: TwTagCompareFn<Assignee> = (a, b) => a.id === b.id;
  protected readonly assigneeSummary = computed(() =>
    this.assigneeValues().map((a) => a.name).join(', '),
  );

  // Forms
  protected readonly tdTags = signal<string[]>(['bug']);
  protected readonly reactiveCtrl = new FormControl<string[]>(['urgent'], { nonNullable: true });
  protected readonly signalModel = signal<{ labels: string[] }>({ labels: ['docs'] });
  protected readonly signalForm = form(this.signalModel);

  // Form-field
  protected readonly ffRecipients = signal<string[]>(['alice@acme.com']);
  protected readonly ffTagsCtrl = new FormControl<string[]>([], {
    nonNullable: true,
    validators: Validators.required,
  });

  // Playground
  protected readonly maxOptions: readonly (number | undefined)[] = [undefined, 3, 5];
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playAddOnBlur = signal(false);
  protected readonly playAllowDuplicates = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playMax = signal<number | undefined>(undefined);
  protected readonly playValues = signal<string[]>(['design', 'frontend']);

  protected toggleDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-tags-input
    [color]="c"
    [(ngModel)]="colorValues[c]"
    [placeholder]="c + '…'"
    [attr.aria-label]="'Color ' + c"
  />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-tags-input
    [size]="s"
    [(ngModel)]="sizeValues[s]"
    placeholder="Add a tag…"
    [attr.aria-label]="'Size ' + s"
  />
}`.trim();

  protected readonly separatorsSnippet = `<!-- Default: Enter + comma -->
<tw-tags-input [(ngModel)]="cities" placeholder="Paste comma-separated cities…" aria-label="Cities" />

<!-- Custom: Enter + space + semicolon -->
<tw-tags-input
  [separatorKeys]="['Enter', ' ', ';']"
  [(ngModel)]="hashtags"
  color="accent"
  placeholder="Type hashtags, space to commit…"
  aria-label="Hashtags"
/>`;

  protected readonly limitsSnippet = `<!-- Cap at 5 tags -->
<tw-tags-input [maxTags]="5" [(ngModel)]="skills" placeholder="Add up to 5 skills…" aria-label="Skills" />

<!-- Keep duplicates -->
<tw-tags-input [allowDuplicates]="true" [(ngModel)]="tags" aria-label="With duplicates" />`;

  protected readonly statesSnippet = `<!-- Disabled with values -->
<tw-tags-input [disabled]="true" [(ngModel)]="tags" aria-label="Disabled" />

<!-- Required -->
<tw-tags-input [required]="true" [(ngModel)]="tags" placeholder="At least one tag…" aria-label="Required tags" />`;

  protected readonly objectTsSnippet = `interface Assignee { id: string; name: string; }

protected readonly assignees = signal<Assignee[]>([
  { id: 'alice', name: 'Alice' },
  { id: 'ben', name: 'Ben' },
]);

protected readonly factory = (text: string): Assignee => ({
  id: text.trim().toLowerCase(),
  name: text.trim(),
});
protected readonly label = (a: Assignee) => a.name;
protected readonly compare = (a: Assignee, b: Assignee) => a.id === b.id;`;

  protected readonly objectHtmlSnippet = `<tw-tags-input
  [createTag]="factory"
  [tagLabel]="label"
  [compareWith]="compare"
  [(ngModel)]="assignees"
  color="info"
  placeholder="Add an assignee…"
  aria-label="Assignees"
/>`;

  protected readonly tdTsSnippet = `protected readonly tags = signal<string[]>(['bug']);`;

  protected readonly tdHtmlSnippet = `<tw-tags-input
  name="tags"
  [(ngModel)]="tags"
  placeholder="Add a label…"
  aria-label="Labels"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly tagsCtrl = new FormControl<string[]>(['urgent'], { nonNullable: true });`;

  protected readonly reactiveHtmlSnippet = `<tw-tags-input [formControl]="tagsCtrl" placeholder="Add a label…" aria-label="Labels" />`;

  protected readonly signalTsSnippet = `protected readonly model = signal<{ labels: string[] }>({ labels: ['docs'] });
protected readonly tagsForm = form(this.model);`;

  protected readonly signalHtmlSnippet = `<tw-tags-input [formField]="tagsForm.labels" placeholder="Add a label…" aria-label="Labels" />`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Recipients</label>
  <tw-tags-input [(ngModel)]="recipients" aria-label="Recipients" />
  <span twHint>Press Enter or comma after each address.</span>
</tw-form-field>

<tw-form-field color="success">
  <label twLabel>Tags</label>
  <tw-tags-input [formControl]="tagsCtrl" aria-label="Tags" />
  <span twError match="required">Add at least one tag.</span>
</tw-form-field>`;
}
