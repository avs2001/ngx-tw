import {
  ChangeDetectionStrategy,
  Component,
  computed,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  SuffixDirective,
} from '@cdevhub/ngx-tw/form-field';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import {
  NumberInputDirective,
  NumberStepperComponent,
} from '@cdevhub/ngx-tw/number-input';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

type FormatPreset = 'plain' | 'currency' | 'integer';
type BoundsPreset = 'none' | 'wide' | 'tight';

@Component({
  selector: 'app-number-input-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InputDirective,
    NumberInputDirective,
    NumberStepperComponent,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    SuffixDirective,
    ButtonDirective,
    CodeBlockComponent,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  template: `
    <!-- Min, Max & Step -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Min, Max &amp; Step</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">min</code> and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max</code> bound the value,
        and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">step</code> sets how much
        the arrow keys and spinner change it. Clamping happens on <em>commit</em> (blur, Enter, or a step) —
        never mid-typing — so you can type <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1</code>
        on the way to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">15</code> even when
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">min</code> is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">10</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-wrap items-start gap-6">
        <tw-form-field class="w-40">
          <label twLabel>Quantity</label>
          <input twInput twNumberInput [(ngModel)]="demoQty" name="demoQty" [min]="1" [max]="10" [step]="1" />
          <span twHint>1–10, step 1</span>
        </tw-form-field>
        <tw-form-field class="w-40">
          <label twLabel>Volume</label>
          <input twInput twNumberInput [(ngModel)]="demoVolume" name="demoVolume" [min]="0" [max]="100" [step]="5" />
          <span twHint>0–100, step 5</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="minMaxStepSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Use the keyboard inside any field: <kbd class="font-mono text-xs">↑</kbd> /
        <kbd class="font-mono text-xs">↓</kbd> step by <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">step</code>,
        and <kbd class="font-mono text-xs">Home</kbd> / <kbd class="font-mono text-xs">End</kbd> jump to the bounds.
      </p>
    </section>

    <!-- Spinner Buttons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Spinner Buttons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A directive can't render sibling DOM, so the visible up/down buttons live in the companion
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-number-stepper&gt;</code>.
        Bind it to the field through a template ref
        (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">#qty="twNumberInput"</code>) and it
        drives <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">increment()</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">decrement()</code>, then refocuses
        the input. Standalone, wrap both in a flex row.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-stretch gap-1 w-44">
          <input twInput twNumberInput #seats="twNumberInput" [(ngModel)]="demoSeats" name="demoSeats" aria-label="Seats" [min]="1" [max]="8" />
          <tw-number-stepper [for]="seats" />
        </div>
        <p class="text-xs text-fg-muted mt-4 font-mono">seats = {{ demoSeats }}</p>
      </div>
      <tw-code-block [code]="stepperSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The buttons stay out of the tab order (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tabindex="-1"</code>)
        and disable automatically when the bound field is disabled or readonly. Match the stepper's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code> to the field for alignment.
      </p>
    </section>

    <!-- Formatted Display -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Formatted Display</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Intl.NumberFormatOptions</code>
        to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">format</code> for grouped,
        decimal, or currency display, and a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">locale</code> to control separators.
        The field shows the raw editable text while focused and the formatted value on blur — and parses
        either back to a real number, so a pasted
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$1,234.50</code> reads as
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">1234.5</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-wrap items-start gap-6">
        <tw-form-field class="w-48">
          <label twLabel>Unit price</label>
          <input twInput twNumberInput [(ngModel)]="demoPrice" name="demoPrice"
            [format]="{ style: 'currency', currency: 'EUR' }" locale="de-DE" [min]="0" />
          <span twHint>EUR · de-DE</span>
        </tw-form-field>
        <tw-form-field class="w-40">
          <label twLabel>Weight</label>
          <input twInput twNumberInput [(ngModel)]="demoWeight" name="demoWeight"
            [format]="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }" [min]="0" [step]="0.25" />
          <span twSuffix>kg</span>
          <span twHint>2 decimals</span>
        </tw-form-field>
        <tw-form-field class="w-44">
          <label twLabel>Population</label>
          <input twInput twNumberInput [(ngModel)]="demoPop" name="demoPop"
            [format]="{ maximumFractionDigits: 0 }" [min]="0" [step]="1000" />
          <span twHint>integer · grouped · inputmode numeric</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="formatSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        An integer format (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maximumFractionDigits: 0</code>)
        also switches <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">inputmode</code> to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numeric</code> so mobile keypads hide the decimal key.
      </p>
    </section>

    <!-- Inside Form Field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside a Form Field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code> the
        sibling <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code> directive owns the
        label, hint, and error chrome — the float-label tracks the formatted display text, and the stepper drops into
        the <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSuffix]</code> slot.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-xs">
          <label twLabel>Tickets</label>
          <input twInput twNumberInput #tickets="twNumberInput" [formControl]="ticketsCtrl" [min]="1" [max]="6" required />
          <tw-number-stepper twSuffix [for]="tickets" />
          <span twHint>Up to 6 per order.</span>
          @if (ticketsCtrl.hasError('required')) {
            <span twError>Pick at least one ticket.</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ ticketsCtrl.value ?? 'null' }} · valid = {{ ticketsCtrl.valid }}</p>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Disabled & Read-only -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled &amp; Read-only</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code> dims the field and
        blocks every interaction, including the spinner — which disables in lock-step.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code> keeps the value
        selectable but blocks edits and stepping.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-wrap items-start gap-6">
        <div class="flex items-stretch gap-1 w-44">
          <input twInput twNumberInput #lockedA="twNumberInput" [ngModel]="42" name="lockedA" aria-label="Locked value" disabled />
          <tw-number-stepper [for]="lockedA" />
        </div>
        <tw-form-field class="w-44">
          <label twLabel>Locked rate</label>
          <input twInput twNumberInput [ngModel]="3.5" name="lockedB" readonly [format]="{ minimumFractionDigits: 1 }" />
          <span twHint>Read-only</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10" data-section="td">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code> — the model is a
        real <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">number</code>
        (or <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code> when empty), never a string.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-xs">
          <label twLabel>Servings</label>
          <input twInput twNumberInput #servings="twNumberInput" [(ngModel)]="ngQty" name="servings" [min]="1" [max]="12" />
          <tw-number-stepper twSuffix [for]="servings" />
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          servings = {{ ngQty }} · typeof = {{ typeOfNgQty() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="ngQty = 4">Set 4</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="ngQty = null">Clear</button>
        </div>
      </div>
      <tw-code-block [code]="ngModelTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="ngModelHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10" data-section="reactive">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl&lt;number | null&gt;</code>.
        Validators like <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.min</code> see a
        numeric value, and <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable()</code> propagates
        to both the field and the stepper.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-xs">
          <label twLabel>Budget</label>
          <input twInput twNumberInput #budget="twNumberInput" [formControl]="budgetCtrl"
            [format]="{ style: 'currency', currency: 'USD' }" [min]="0" [step]="50" />
          <tw-number-stepper twSuffix [for]="budget" />
          <span twHint>At least $0, steps of $50.</span>
          @if (budgetCtrl.hasError('required')) {
            <span twError>A budget is required.</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = {{ budgetCtrl.value ?? 'null' }} · valid = {{ budgetCtrl.valid }} · disabled = {{ budgetCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="budgetCtrl.setValue(500)">Set 500</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="budgetCtrl.disable()">Disable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="budgetCtrl.enable()">Enable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="budgetCtrl.reset(null)">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="reactiveTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10" data-section="signal">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21 signal forms attach through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>. The field's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code> signal stays a number you can
        read anywhere in the template.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-xs">
          <label twLabel>Rating</label>
          <input twInput twNumberInput #rating="twNumberInput" [formField]="ratingForm.rating" [min]="0" [max]="5" [step]="1" />
          <tw-number-stepper twSuffix [for]="rating" />
          <span twHint>0–5 stars.</span>
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          rating = {{ ratingForm.rating().value() ?? 'null' }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="ratingForm.rating().value.set(5)">Set 5</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="ratingForm.rating().value.set(0)">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="signalTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine bounds, step, format, locale, and the spinner to audition the field. A common starting
        point is a currency field with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">min = 0</code>
        and the stepper enabled.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Bounds</p>
            <div class="flex flex-wrap gap-1">
              @for (b of boundsPresets; track b.key) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playBounds() === b.key"
                  [class.!text-primary-700]="playBounds() === b.key"
                  (click)="playBounds.set(b.key)"
                >{{ b.label }}</button>
              }
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Step</p>
            <div class="flex flex-wrap gap-1">
              @for (s of stepPresets; track s) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playStep() === s"
                  [class.!text-primary-700]="playStep() === s"
                  (click)="playStep.set(s)"
                >{{ s }}</button>
              }
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Format</p>
            <div class="flex flex-wrap gap-1">
              @for (f of formatPresets; track f) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playFormatPreset() === f"
                  [class.!text-primary-700]="playFormatPreset() === f"
                  (click)="playFormatPreset.set(f)"
                >{{ f }}</button>
              }
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Locale</p>
            <div class="flex flex-wrap gap-1">
              @for (l of localePresets; track l) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playLocale() === l"
                  [class.!text-primary-700]="playLocale() === l"
                  (click)="playLocale.set(l)"
                >{{ l }}</button>
              }
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Spinner</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playStepper()"
                [class.!text-primary-700]="playStepper()"
                (click)="playStepper.update(v => !v)"
              >show stepper</button>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-form-field class="max-w-xs">
            <label twLabel>Playground value</label>
            <input
              twInput
              twNumberInput
              #pg="twNumberInput"
              [formControl]="playCtrl"
              [min]="playMin()"
              [max]="playMax()"
              [step]="playStep()"
              [format]="playFormat()"
              [locale]="playLocale()"
            />
            @if (playStepper()) {
              <tw-number-stepper twSuffix [for]="pg" />
            }
            <span twHint>Type or step; blur to see the formatted value.</span>
          </tw-form-field>
          <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ playCtrl.value ?? 'null' }}</p>
        </div>
      </div>
    </section>
  `,
})
export class NumberInputExamples {
  // Min/Max/Step + stepper demos
  protected demoQty: number | null = 1;
  protected demoVolume: number | null = 0;
  protected demoSeats: number | null = 2;

  // Formatted display
  protected demoPrice: number | null = 19.99;
  protected demoWeight: number | null = 1.5;
  protected demoPop: number | null = 50000;

  // Form-field (reactive, required)
  protected readonly ticketsCtrl = new FormControl<number | null>(2, {
    validators: [Validators.required],
  });

  // Template-driven
  protected ngQty: number | null = 2;
  protected typeOfNgQty(): string {
    return this.ngQty === null ? 'null' : typeof this.ngQty;
  }

  // Reactive
  protected readonly budgetCtrl = new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(0)],
  });

  // Signal forms
  protected readonly ratingModel = signal<{ rating: number | null }>({ rating: 3 });
  protected readonly ratingForm = form(this.ratingModel);

  // Playground
  protected readonly boundsPresets: readonly { key: BoundsPreset; label: string }[] = [
    { key: 'none', label: 'none' },
    { key: 'wide', label: '0–100' },
    { key: 'tight', label: '1–10' },
  ];
  protected readonly stepPresets: readonly number[] = [0.5, 1, 5, 10];
  protected readonly formatPresets: readonly FormatPreset[] = ['plain', 'currency', 'integer'];
  protected readonly localePresets: readonly string[] = ['en-US', 'de-DE', 'fr-FR'];

  protected readonly playBounds = signal<BoundsPreset>('none');
  protected readonly playStep = signal<number>(1);
  protected readonly playFormatPreset = signal<FormatPreset>('currency');
  protected readonly playLocale = signal<string>('en-US');
  protected readonly playStepper = signal(true);
  protected readonly playCtrl = new FormControl<number | null>(null);

  protected readonly playMin = computed(() =>
    this.playBounds() === 'none' ? undefined : this.playBounds() === 'tight' ? 1 : 0,
  );
  protected readonly playMax = computed(() =>
    this.playBounds() === 'none' ? undefined : this.playBounds() === 'tight' ? 10 : 100,
  );
  protected readonly playFormat = computed<Intl.NumberFormatOptions | undefined>(() => {
    switch (this.playFormatPreset()) {
      case 'currency':
        return { style: 'currency', currency: 'USD' };
      case 'integer':
        return { maximumFractionDigits: 0 };
      default:
        return undefined;
    }
  });

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly minMaxStepSnippet = `<tw-form-field>
  <label twLabel>Quantity</label>
  <input twInput twNumberInput [(ngModel)]="quantity" [min]="1" [max]="10" [step]="1" />
  <span twHint>1–10, step 1</span>
</tw-form-field>

<tw-form-field>
  <label twLabel>Volume</label>
  <input twInput twNumberInput [(ngModel)]="volume" [min]="0" [max]="100" [step]="5" />
</tw-form-field>`;

  protected readonly stepperSnippet = `<!-- Standalone — wrap the input and stepper in a flex row -->
<div class="flex items-stretch gap-1">
  <input twInput twNumberInput #seats="twNumberInput" [(ngModel)]="seats" [min]="1" [max]="8" />
  <tw-number-stepper [for]="seats" />
</div>`;

  protected readonly formatSnippet = `<!-- Currency (EUR, German locale) -->
<input twInput twNumberInput [(ngModel)]="price"
  [format]="{ style: 'currency', currency: 'EUR' }" locale="de-DE" [min]="0" />

<!-- Fixed 2 decimals + a unit suffix -->
<tw-form-field>
  <label twLabel>Weight</label>
  <input twInput twNumberInput [(ngModel)]="weight"
    [format]="{ minimumFractionDigits: 2, maximumFractionDigits: 2 }" [step]="0.25" />
  <span twSuffix>kg</span>
</tw-form-field>

<!-- Integer, grouped — switches inputmode to numeric -->
<input twInput twNumberInput [(ngModel)]="population"
  [format]="{ maximumFractionDigits: 0 }" [step]="1000" />`;

  protected readonly formFieldSnippet = `<tw-form-field>
  <label twLabel>Tickets</label>
  <input twInput twNumberInput #tickets="twNumberInput" [formControl]="ticketsCtrl" [min]="1" [max]="6" required />
  <tw-number-stepper twSuffix [for]="tickets" />
  <span twHint>Up to 6 per order.</span>
  @if (ticketsCtrl.hasError('required')) {
    <span twError>Pick at least one ticket.</span>
  }
</tw-form-field>`;

  protected readonly disabledSnippet = `<!-- Disabled — field and stepper both inert -->
<div class="flex items-stretch gap-1">
  <input twInput twNumberInput #n="twNumberInput" [ngModel]="42" disabled />
  <tw-number-stepper [for]="n" />
</div>

<!-- Read-only — value selectable, edits blocked -->
<input twInput twNumberInput [ngModel]="3.5" readonly [format]="{ minimumFractionDigits: 1 }" />`;

  protected readonly ngModelTsSnippet = `protected ngQty: number | null = 2;`;

  protected readonly ngModelHtmlSnippet = `<tw-form-field>
  <label twLabel>Servings</label>
  <input twInput twNumberInput #servings="twNumberInput" [(ngModel)]="ngQty" name="servings" [min]="1" [max]="12" />
  <tw-number-stepper twSuffix [for]="servings" />
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly budgetCtrl = new FormControl<number | null>(null, {
  validators: [Validators.required, Validators.min(0)],
});`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Budget</label>
  <input twInput twNumberInput #budget="twNumberInput" [formControl]="budgetCtrl"
    [format]="{ style: 'currency', currency: 'USD' }" [min]="0" [step]="50" />
  <tw-number-stepper twSuffix [for]="budget" />
  @if (budgetCtrl.hasError('required')) {
    <span twError>A budget is required.</span>
  }
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly ratingModel = signal<{ rating: number | null }>({ rating: 3 });
protected readonly ratingForm = form(this.ratingModel);`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Rating</label>
  <input twInput twNumberInput #rating="twNumberInput" [formField]="ratingForm.rating" [min]="0" [max]="5" [step]="1" />
  <tw-number-stepper twSuffix [for]="rating" />
</tw-form-field>`;
}
