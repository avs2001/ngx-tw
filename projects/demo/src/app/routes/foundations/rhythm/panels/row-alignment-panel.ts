import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { ComboboxComponent } from '@cdevhub/ngx-tw/combobox';
import { DatePickerComponent } from '@cdevhub/ngx-tw/date-picker';
import { FormFieldComponent, LabelDirective } from '@cdevhub/ngx-tw/form-field';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { NumberInputDirective, NumberStepperComponent } from '@cdevhub/ngx-tw/number-input';
import {
  SegmentedControlComponent,
  SegmentedControlOptionComponent,
} from '@cdevhub/ngx-tw/segmented-control';
import { SelectComponent } from '@cdevhub/ngx-tw/select';
import { TagsInputComponent } from '@cdevhub/ngx-tw/tags-input';
import { TextareaDirective } from '@cdevhub/ngx-tw/textarea';
import { TimePickerComponent } from '@cdevhub/ngx-tw/time-picker';
import { RhythmRow } from '../rhythm-row';
import type { RhythmSettings } from '../rhythm-settings';

/**
 * Row alignment — the failures that only exist when controls share a row.
 *
 * The rest of this page measures each control in its own slot, which answers
 * "is this control the right height" and cannot answer "do these two line up".
 * Those are different questions: every control here already passes the
 * isolated check, and several rows below still misalign.
 *
 * Three mechanisms are under audit, each of which an isolated cell hides:
 *
 * 1. **Wrapper versus control.** `tw-form-field` is a wrapper with a label row
 *    above and a reserved subscript row below. Its shell sits on the height
 *    scale, but its outer box does not — so centring the wrapper against a
 *    bare button centres the *wrapper* and puts the shell somewhere else. No
 *    `align-items` value fixes this, which is the point of measuring it.
 * 2. **Pinned versus floored.** Single-line controls pin a height; controls
 *    whose box must grow take a `min-h` floor instead. Put one of each in a
 *    row and the floored one sets the row height as soon as it has content.
 * 3. **Inherited font strut.** An inline-level control inside a block parent
 *    generates a line box, so part of its height comes from the consumer's
 *    font, not from the component. That is what made `select` measure 27px at
 *    xs while `combobox`, with byte-identical padding, measured 26. The bug
 *    class is invisible until the row's inherited font-size is varied.
 */
@Component({
  selector: 'app-row-alignment-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'block mb-10' },
  imports: [
    RhythmRow,
    FormsModule,
    ButtonDirective,
    ComboboxComponent,
    DatePickerComponent,
    FormFieldComponent,
    LabelDirective,
    InputDirective,
    NumberInputDirective,
    NumberStepperComponent,
    SegmentedControlComponent,
    SegmentedControlOptionComponent,
    SelectComponent,
    TagsInputComponent,
    TextareaDirective,
    TimePickerComponent,
  ],
  template: `
    <h2 class="mb-1 text-sm font-semibold text-fg">Row alignment</h2>
    <p class="mb-6 max-w-3xl text-sm text-fg-muted">
      The same controls the slots above measure alone, placed next to each other the way a
      consumer actually writes them. Each row reports five spreads; the boxed one is the
      reading that row's <span class="font-mono">align-items</span> makes load-bearing. A
      non-zero top spread under <span class="font-mono">items-center</span> is not a defect —
      it is what centring mismatched heights means. A non-zero control spread is.
    </p>

    <div class="grid gap-10">
      <app-rhythm-row
        label="Filter bar · centred"
        align="center"
        note="The canonical consumer row: everything a toolbar puts next to a search box. All
              seven pin a height, so the control spread should be zero and every edge should
              agree — centring is then indistinguishable from any other mode."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <button twButton [size]="settings().size" data-rg-item="Button">Button</button>
        <input
          twInput
          [size]="settings().size"
          placeholder="Input"
          aria-label="Input"
          class="w-32"
          data-rg-item="Input"
        />
        <tw-select
          [options]="fruits"
          [size]="settings().size"
          placeholder="Select"
          aria-label="Select"
          class="w-36"
          data-rg-item="Select"
        />
        <tw-combobox
          [options]="fruits"
          [size]="settings().size"
          placeholder="Combobox"
          aria-label="Combobox"
          class="w-36"
          data-rg-item="Combobox"
        />
        <tw-date-picker
          [size]="settings().size"
          placeholder="Date"
          aria-label="Date"
          class="w-40"
          data-rg-item="Date picker"
        />
        <tw-time-picker
          [size]="settings().size"
          aria-label="Time"
          class="w-36"
          data-rg-item="Time picker"
        />
        <tw-segmented-control
          [size]="settings().size"
          [value]="'a'"
          aria-label="Segmented"
          data-rg-item="Segmented"
        >
          <tw-segmented-option value="a">One</tw-segmented-option>
          <tw-segmented-option value="b">Two</tw-segmented-option>
        </tw-segmented-control>
      </app-rhythm-row>

      <app-rhythm-row
        label="Filter bar · baseline"
        align="baseline"
        note="The mode nothing has tested and the one a consumer building a toolbar reaches for
              first, because it is what lines up plain text. It aligns the first text baseline
              inside each control, so any control whose text sits at a different offset inside
              its own box drags the whole row — and a control with no text baseline at all
              falls back to its bottom margin edge."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <button twButton [size]="settings().size" data-rg-item="Button">Button</button>
        <input
          twInput
          [size]="settings().size"
          placeholder="Input"
          aria-label="Input"
          class="w-32"
          data-rg-item="Input"
        />
        <tw-select
          [options]="fruits"
          [size]="settings().size"
          placeholder="Select"
          aria-label="Select"
          class="w-36"
          data-rg-item="Select"
        />
        <tw-combobox
          [options]="fruits"
          [size]="settings().size"
          placeholder="Combobox"
          aria-label="Combobox"
          class="w-36"
          data-rg-item="Combobox"
        />
        <tw-segmented-control
          [size]="settings().size"
          [value]="'a'"
          aria-label="Segmented"
          data-rg-item="Segmented"
        >
          <tw-segmented-option value="a">One</tw-segmented-option>
          <tw-segmented-option value="b">Two</tw-segmented-option>
        </tw-segmented-control>
      </app-rhythm-row>

      <app-rhythm-row
        label="Labelled field next to a bare control · centred"
        align="center"
        note="tw-form-field wraps its shell with a label row above and a reserved subscript row
              below, so its outer box is much taller than a bare control even though the shell
              itself is on the scale. items-center centres the WRAPPER, which pushes the shell
              off the row. The control column shows the shell agreeing with its neighbours; the
              top and bottom columns show it sitting somewhere else entirely."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <tw-form-field
          [size]="settings().size"
          class="w-48"
          data-rg-item="Form field"
          data-rg-control-selector=":scope > div"
        >
          <label twLabel>Search</label>
          <input twInput placeholder="Wrapped" />
        </tw-form-field>
        <button twButton [size]="settings().size" data-rg-item="Button">Apply</button>
        <tw-select
          [options]="fruits"
          [size]="settings().size"
          placeholder="Select"
          aria-label="Select"
          class="w-36"
          data-rg-item="Select"
        />
      </app-rhythm-row>

      <app-rhythm-row
        label="Labelled field next to a bare control · end"
        align="end"
        note="The same row aligned on its bottom edge — the arrangement a consumer reaches for
              when one field carries a label. The subscript row is reserved but empty at rest,
              so the shell still does not reach the row's bottom edge. Compare the bottom
              spread here with the centred row above: neither mode lines the shell up, which is
              the finding."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <tw-form-field
          [size]="settings().size"
          class="w-48"
          data-rg-item="Form field"
          data-rg-control-selector=":scope > div"
        >
          <label twLabel>Search</label>
          <input twInput placeholder="Wrapped" />
        </tw-form-field>
        <button twButton [size]="settings().size" data-rg-item="Button">Apply</button>
        <tw-select
          [options]="fruits"
          [size]="settings().size"
          placeholder="Select"
          aria-label="Select"
          class="w-36"
          data-rg-item="Select"
        />
      </app-rhythm-row>

      <app-rhythm-row
        label="Pinned next to floored"
        align="center"
        note="Controls that pin a height sitting beside controls that take a min-h floor. The
              floored members are correct to grow — the question is whether they start at the
              same height as the pinned ones, because a filter bar that jumps as soon as a tag
              is typed is the visible symptom."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <button twButton [size]="settings().size" data-rg-item="Button">Button</button>
        <input
          twInput
          [size]="settings().size"
          placeholder="Input"
          aria-label="Input"
          class="w-32"
          data-rg-item="Input"
        />
        <tw-tags-input
          [size]="settings().size"
          [(ngModel)]="tags"
          placeholder="Tags"
          aria-label="Tags"
          class="w-48"
          data-rg-item="Tags input"
        />
        <div class="flex items-stretch gap-1" data-rg-item="Number input">
          <input
            twInput
            twNumberInput
            #qty="twNumberInput"
            [size]="settings().size"
            [min]="1"
            [max]="99"
            [(ngModel)]="quantity"
            aria-label="Quantity"
            class="w-20 min-w-0"
            data-rg-control
          />
          <tw-number-stepper [for]="qty" [size]="settings().size" />
        </div>
        <textarea
          twTextarea
          [size]="settings().size"
          rows="1"
          placeholder="Notes"
          aria-label="Notes"
          class="w-40"
          data-rg-item="Textarea"
        ></textarea>
      </app-rhythm-row>

      <app-rhythm-row
        label="Inherited font · text-xs parent"
        align="center"
        note="The identical row under a smaller inherited font size. A control whose height is
              driven by its own pinned box is unmoved; one that still generates a line box from
              the parent's font strut shrinks. Any difference between this row's control spread
              and the centred filter bar above is a strut leak."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <div class="flex items-center gap-3 text-xs">
          <button twButton [size]="settings().size" data-rg-item="Button xs-parent">Button</button>
          <input
            twInput
            [size]="settings().size"
            placeholder="Input"
            aria-label="Input"
            class="w-32"
            data-rg-item="Input xs-parent"
          />
          <tw-select
            [options]="fruits"
            [size]="settings().size"
            placeholder="Select"
            aria-label="Select"
            class="w-36"
            data-rg-item="Select xs-parent"
          />
          <tw-combobox
            [options]="fruits"
            [size]="settings().size"
            placeholder="Combobox"
            aria-label="Combobox"
            class="w-36"
            data-rg-item="Combobox xs-parent"
          />
        </div>
      </app-rhythm-row>

      <app-rhythm-row
        label="Inherited font · text-base parent"
        align="center"
        note="The same row under a larger inherited font size. Read it against the two rows
              above: three identical control spreads mean every height is genuinely pinned and
              the consumer's typography cannot move the library."
        [unit]="settings().unit"
        [rowUnit]="settings().rowUnit"
        [gridOn]="settings().gridOn"
      >
        <div class="flex items-center gap-3 text-base">
          <button twButton [size]="settings().size" data-rg-item="Button base-parent">
            Button
          </button>
          <input
            twInput
            [size]="settings().size"
            placeholder="Input"
            aria-label="Input"
            class="w-32"
            data-rg-item="Input base-parent"
          />
          <tw-select
            [options]="fruits"
            [size]="settings().size"
            placeholder="Select"
            aria-label="Select"
            class="w-36"
            data-rg-item="Select base-parent"
          />
          <tw-combobox
            [options]="fruits"
            [size]="settings().size"
            placeholder="Combobox"
            aria-label="Combobox"
            class="w-36"
            data-rg-item="Combobox base-parent"
          />
        </div>
      </app-rhythm-row>
    </div>
  `,
})
export class RowAlignmentPanel {
  /** Toolbar state, forwarded from the page. */
  readonly settings = input.required<RhythmSettings>();

  protected readonly fruits = ['Apple', 'Banana', 'Cherry'];
  protected readonly tags = signal<string[]>(['one']);
  protected readonly quantity = signal(1);
}
