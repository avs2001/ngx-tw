import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import {
  SliderComponent,
  type SliderMark,
  type SliderValue,
  type SliderValueFormatter,
  type SliderVariant,
} from '@cdevhub/ngx-tw/slider';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const VARIANTS: SliderVariant[] = ['solid', 'soft', 'outline'];

const PERCENT_FORMATTER: SliderValueFormatter = (value) => `${Math.round(value)}%`;
const TEMP_FORMATTER: SliderValueFormatter = (value) => `${Math.round(value)}°C`;
const CURRENCY_FORMATTER: SliderValueFormatter = (value) =>
  `$${Math.round(value).toLocaleString()}`;

const BRIGHTNESS_MARKS: SliderMark[] = [
  { value: 0, label: 'Off' },
  { value: 25, label: 'Low' },
  { value: 50, label: 'Med' },
  { value: 75, label: 'High' },
  { value: 100, label: 'Max' },
];

@Component({
  selector: 'app-slider-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SliderComponent,
    ButtonDirective,
    CodeBlockComponent,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change the rail treatment without changing semantics.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        uses the vivid color-500 fill and is the default primary-action choice.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        uses a muted color-300 fill for secondary or low-emphasis adjustments, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        bounds the rail with a border and is helpful when the slider sits on a busy surface.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (v of variants; track v) {
          <tw-slider [variant]="v" [label]="v" [showValue]="true" [(value)]="variantValues[v]" />
        }
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every semantic color from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwColor</code>
        is supported and applies to the fill, the thumb border, and the focus ring. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for default actions and reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>,
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        when the control's meaning matches the semantic role.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (c of colors; track c) {
          <tw-slider [color]="c" [label]="c" [(value)]="colorValues[c]" />
        }
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        input scales the rail height, thumb diameter, mark dots, and label typography together. Pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for dense forms and toolbars,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for standard controls, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        for touch-friendly or featured placements.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        @for (s of sizes; track s) {
          <tw-slider [size]="s" [label]="s" [(value)]="sizeValues[s]" />
        }
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Range</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Setting
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[range]="true"</code>
        renders two thumbs and switches the model to a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[start, end]</code>
        tuple. Each thumb can be dragged independently but cannot cross the other, and each reports
        its own
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemin</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuemax</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-slider
          label="Price"
          [range]="true"
          color="primary"
          [showValue]="true"
          [showMinMax]="true"
          [min]="0"
          [max]="1000"
          [step]="10"
          [valueFormatter]="currencyFormatter"
          [(value)]="priceRange"
        />
        <tw-slider
          label="Working hours"
          description="Schedule your workday"
          [range]="true"
          color="success"
          variant="soft"
          [min]="0"
          [max]="24"
          [step]="1"
          [marks]="true"
          [(value)]="hoursRange"
        />
      </div>
      <tw-code-block [code]="rangeSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Remember that the value type is a readonly tuple — if you set an initial value via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">signal</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        it must be
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[start, end]</code>,
        not a plain number.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Step &amp; Marks</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">step</code>
        quantises keyboard nav, pointer drag, and auto-generated marks; passing
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>
        yields a continuous scale that accepts any value in range. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[marks]="true"</code>
        to auto-generate one tick per step, or pass a custom
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">SliderMark[]</code>
        for semantic scales with labels like Low / Med / High.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-8">
        <tw-slider
          label="Brightness"
          color="warning"
          [step]="25"
          [marks]="true"
          [showMarkLabels]="true"
          [(value)]="brightnessValue"
        />
        <tw-slider
          label="Mode"
          description="Custom marks with labels"
          color="accent"
          [step]="25"
          [marks]="brightnessMarks"
          [showMarkLabels]="true"
          [(value)]="modeValue"
        />
        <tw-slider
          label="Continuous"
          description="No step snapping — any value in range"
          color="info"
          [step]="null"
          [showValue]="true"
          [(value)]="continuousValue"
        />
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="stepMarksTsSnippet" language="ts" />
        <tw-code-block [code]="stepMarksHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Value Formatters</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Supply a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueFormatter</code>
        to control how numbers appear in the bubble, the min/max end labels, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-valuetext</code>.
        Use it for units, currency, localisation, or domain-specific formatting — the slider keeps
        operating on raw numbers internally.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-slider
          label="Completion"
          color="success"
          [showValue]="true"
          [showMinMax]="true"
          [valueFormatter]="percentFormatter"
          [(value)]="completionValue"
        />
        <tw-slider
          label="Temperature"
          color="error"
          variant="soft"
          [min]="-10"
          [max]="40"
          [showValue]="true"
          [showMinMax]="true"
          [valueFormatter]="tempFormatter"
          [(value)]="tempValue"
        />
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="formatterTsSnippet" language="ts" />
        <tw-code-block [code]="formatterHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        state mutes the rail and thumb, blocks pointer and keyboard interaction, and skips the
        slider in tab order. It applies to both single and range modes.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-slider label="Disabled" [disabled]="true" [value]="35" />
        <tw-slider label="Disabled range" [range]="true" [disabled]="true" [value]="[20, 70]" />
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The slider implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works out of the box for both single values and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[start, end]</code>
        tuples. Import
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormsModule</code>
        on the consuming component.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-slider
          label="Brightness"
          color="warning"
          [showValue]="true"
          name="tdBrightness"
          [(ngModel)]="tdBrightnessValue"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ tdBrightnessValue() }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdBrightnessValue.set(0)">Set 0</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdBrightnessValue.set(50)">Set 50</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdBrightnessValue.set(100)">Set 100</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        and the control's value, disabled state, and touched flag stay in sync. Calling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable()</code>
        on the control disables the slider — no separate
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        input needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-slider label="Quality" color="info" [showValue]="true" [formControl]="qualityControl" />
        <p class="text-xs text-fg-muted mt-4 font-mono">
          control.value = {{ qualityControl.value }} · touched = {{ qualityControl.touched }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="qualityControl.setValue(0)">Set 0</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="qualityControl.setValue(50)">Set 50</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="qualityControl.setValue(100)">Set 100</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleQualityDisabled()">
            {{ qualityControl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and pass a field to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        Value and touched state flow through the field's signals, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reset()</code>
        returns the slider to the model's initial value.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-slider
          label="Font size"
          color="accent"
          [showValue]="true"
          [formField]="signalForm.fontSize"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">
          value = {{ signalForm.fontSize().value() }} · touched = {{ signalForm.fontSize().touched() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fontSize().value.set(12)">Set 12</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fontSize().value.set(64)">Set 64</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fontSize().reset()">Reset</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once to see how variant, color, size, and feature toggles interact.
        Flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">range</code>
        to switch between a single thumb and a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[start, end]</code>
        model, and turn on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">marks</code>
        together with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labels</code>
        to see the full tick-mark treatment.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button
                  twButton
                  variant="ghost"
                  color="neutral"
                  size="xs"
                  [class.!bg-primary-100]="playVariant() === v"
                  [class.!text-primary-700]="playVariant() === v"
                  (click)="playVariant.set(v)"
                >
                  {{ v }}
                </button>
              }
            </div>
          </div>
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
                >
                  {{ c }}
                </button>
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
                >
                  {{ s }}
                </button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex flex-wrap gap-1">
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playRange()"
                [class.!text-primary-700]="playRange()"
                (click)="toggleRange()"
              >
                range
              </button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playMarks()"
                [class.!text-primary-700]="playMarks()"
                (click)="playMarks.update(v => !v)"
              >
                marks
              </button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playMarkLabels()"
                [class.!text-primary-700]="playMarkLabels()"
                (click)="playMarkLabels.update(v => !v)"
              >
                labels
              </button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playMinMax()"
                [class.!text-primary-700]="playMinMax()"
                (click)="playMinMax.update(v => !v)"
              >
                min/max
              </button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playShowValue()"
                [class.!text-primary-700]="playShowValue()"
                (click)="playShowValue.update(v => !v)"
              >
                value
              </button>
              <button
                twButton
                variant="ghost"
                color="neutral"
                size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >
                disabled
              </button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-slider
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [range]="playRange()"
            [disabled]="playDisabled()"
            [marks]="playMarks()"
            [showMarkLabels]="playMarkLabels()"
            [showMinMax]="playMinMax()"
            [showValue]="playShowValue()"
            [step]="10"
            label="Playground"
            [(value)]="playValue"
          />
          <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ playValueLabel() }}</p>
        </div>
      </div>
    </section>
  `,
})
export class SliderExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly variants = VARIANTS;
  protected readonly brightnessMarks = BRIGHTNESS_MARKS;
  protected readonly percentFormatter = PERCENT_FORMATTER;
  protected readonly tempFormatter = TEMP_FORMATTER;
  protected readonly currencyFormatter = CURRENCY_FORMATTER;

  protected readonly variantValues: Record<SliderVariant, ReturnType<typeof signal<SliderValue>>> = {
    solid: signal<SliderValue>(60),
    soft: signal<SliderValue>(40),
    outline: signal<SliderValue>(80),
  };

  protected readonly colorValues: Record<TwColor, ReturnType<typeof signal<SliderValue>>> = {
    primary: signal<SliderValue>(60),
    secondary: signal<SliderValue>(55),
    accent: signal<SliderValue>(50),
    neutral: signal<SliderValue>(45),
    info: signal<SliderValue>(40),
    success: signal<SliderValue>(65),
    warning: signal<SliderValue>(70),
    error: signal<SliderValue>(30),
  };

  protected readonly sizeValues: Record<TwSize, ReturnType<typeof signal<SliderValue>>> = {
    xs: signal<SliderValue>(30),
    sm: signal<SliderValue>(40),
    md: signal<SliderValue>(50),
    lg: signal<SliderValue>(60),
    xl: signal<SliderValue>(70),
  };

  protected readonly priceRange = signal<SliderValue>([150, 650]);
  protected readonly hoursRange = signal<SliderValue>([9, 17]);
  protected readonly brightnessValue = signal<SliderValue>(50);
  protected readonly modeValue = signal<SliderValue>(25);
  protected readonly continuousValue = signal<SliderValue>(42.7);
  protected readonly completionValue = signal<SliderValue>(68);
  protected readonly tempValue = signal<SliderValue>(21);

  protected readonly tdBrightnessValue = signal<SliderValue>(50);
  protected readonly qualityControl = new FormControl<number>(50, { nonNullable: true });

  protected readonly signalModel = signal<{ fontSize: number }>({ fontSize: 16 });
  protected readonly signalForm = form(this.signalModel);

  protected toggleQualityDisabled(): void {
    if (this.qualityControl.disabled) {
      this.qualityControl.enable();
    } else {
      this.qualityControl.disable();
    }
  }

  // Playground
  protected readonly playVariant = signal<SliderVariant>('solid');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playRange = signal(false);
  protected readonly playMarks = signal(false);
  protected readonly playMarkLabels = signal(false);
  protected readonly playMinMax = signal(true);
  protected readonly playShowValue = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playValue = signal<SliderValue>(40);

  protected toggleRange(): void {
    const next = !this.playRange();
    this.playRange.set(next);
    this.playValue.set(next ? [20, 70] : 40);
  }

  protected playValueLabel(): string {
    const v = this.playValue();
    return Array.isArray(v) ? `[${v[0]}, ${v[1]}]` : String(v);
  }

  // Snippets
  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-slider [variant]="v" [label]="v" [showValue]="true" [(value)]="variantValues[v]" />
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-slider [color]="c" [label]="c" [(value)]="colorValues[c]" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-slider [size]="s" [label]="s" [(value)]="sizeValues[s]" />
}`.trim();

  protected readonly rangeSnippet = `
<tw-slider
  label="Price"
  [range]="true"
  color="primary"
  [showValue]="true"
  [showMinMax]="true"
  [min]="0"
  [max]="1000"
  [step]="10"
  [valueFormatter]="currencyFormatter"
  [(value)]="priceRange"
/>

<tw-slider
  label="Working hours"
  description="Schedule your workday"
  [range]="true"
  color="success"
  variant="soft"
  [min]="0"
  [max]="24"
  [step]="1"
  [marks]="true"
  [(value)]="hoursRange"
/>`.trim();

  protected readonly stepMarksTsSnippet = `
import type { SliderMark, SliderValue } from '@cdevhub/ngx-tw/slider';

const BRIGHTNESS_MARKS: SliderMark[] = [
  { value: 0, label: 'Off' },
  { value: 25, label: 'Low' },
  { value: 50, label: 'Med' },
  { value: 75, label: 'High' },
  { value: 100, label: 'Max' },
];

protected readonly brightnessMarks = BRIGHTNESS_MARKS;
protected readonly brightnessValue = signal<SliderValue>(50);
protected readonly modeValue = signal<SliderValue>(25);
protected readonly continuousValue = signal<SliderValue>(42.7);`.trim();

  protected readonly stepMarksHtmlSnippet = `
<tw-slider
  label="Brightness"
  color="warning"
  [step]="25"
  [marks]="true"
  [showMarkLabels]="true"
  [(value)]="brightnessValue"
/>

<tw-slider
  label="Mode"
  description="Custom marks with labels"
  color="accent"
  [step]="25"
  [marks]="brightnessMarks"
  [showMarkLabels]="true"
  [(value)]="modeValue"
/>

<tw-slider
  label="Continuous"
  description="No step snapping — any value in range"
  color="info"
  [step]="null"
  [showValue]="true"
  [(value)]="continuousValue"
/>`.trim();

  protected readonly formatterTsSnippet = `
import type { SliderValueFormatter } from '@cdevhub/ngx-tw/slider';

const PERCENT_FORMATTER: SliderValueFormatter = (value) => \`\${Math.round(value)}%\`;
const TEMP_FORMATTER: SliderValueFormatter = (value) => \`\${Math.round(value)}°C\`;

protected readonly percentFormatter = PERCENT_FORMATTER;
protected readonly tempFormatter = TEMP_FORMATTER;`.trim();

  protected readonly formatterHtmlSnippet = `
<tw-slider
  label="Completion"
  color="success"
  [showValue]="true"
  [showMinMax]="true"
  [valueFormatter]="percentFormatter"
  [(value)]="completionValue"
/>

<tw-slider
  label="Temperature"
  color="error"
  variant="soft"
  [min]="-10"
  [max]="40"
  [showValue]="true"
  [showMinMax]="true"
  [valueFormatter]="tempFormatter"
  [(value)]="tempValue"
/>`.trim();

  protected readonly statesSnippet = `
<tw-slider label="Disabled" [disabled]="true" [value]="35" />

<tw-slider label="Disabled range" [range]="true" [disabled]="true" [value]="[20, 70]" />`.trim();

  protected readonly tdTsSnippet = `
import { signal } from '@angular/core';
import type { SliderValue } from '@cdevhub/ngx-tw/slider';

protected readonly tdBrightnessValue = signal<SliderValue>(50);`.trim();

  protected readonly tdHtmlSnippet = `
<tw-slider
  label="Brightness"
  color="warning"
  [showValue]="true"
  name="tdBrightness"
  [(ngModel)]="tdBrightnessValue"
/>`.trim();

  protected readonly reactiveTsSnippet = `
import { FormControl } from '@angular/forms';

protected readonly qualityControl = new FormControl<number>(50, { nonNullable: true });

protected toggleQualityDisabled(): void {
  if (this.qualityControl.disabled) {
    this.qualityControl.enable();
  } else {
    this.qualityControl.disable();
  }
}`.trim();

  protected readonly reactiveHtmlSnippet = `
<tw-slider
  label="Quality"
  color="info"
  [showValue]="true"
  [formControl]="qualityControl"
/>`.trim();

  protected readonly signalTsSnippet = `
import { signal } from '@angular/core';
import { form } from '@angular/forms/signals';

protected readonly signalModel = signal<{ fontSize: number }>({ fontSize: 16 });
protected readonly signalForm = form(this.signalModel);`.trim();

  protected readonly signalHtmlSnippet = `
<tw-slider
  label="Font size"
  color="accent"
  [showValue]="true"
  [formField]="signalForm.fontSize"
/>`.trim();
}
