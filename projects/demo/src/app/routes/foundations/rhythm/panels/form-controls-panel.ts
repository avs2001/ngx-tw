import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CalendarComponent } from '@cdevhub/ngx-tw/calendar';
import { ComboboxComponent } from '@cdevhub/ngx-tw/combobox';
import { DatePickerComponent } from '@cdevhub/ngx-tw/date-picker';
import { DateRangePickerComponent } from '@cdevhub/ngx-tw/date-range-picker';
import { FileUploadComponent } from '@cdevhub/ngx-tw/file-upload';
import { FormFieldComponent, LabelDirective } from '@cdevhub/ngx-tw/form-field';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { NumberInputDirective, NumberStepperComponent } from '@cdevhub/ngx-tw/number-input';
import { SliderComponent } from '@cdevhub/ngx-tw/slider';
import { TagsInputComponent } from '@cdevhub/ngx-tw/tags-input';
import { TextareaDirective } from '@cdevhub/ngx-tw/textarea';
import { TimePickerComponent } from '@cdevhub/ngx-tw/time-picker';
import { RhythmCell } from '../rhythm-cell';
import { RhythmPaper } from '../rhythm-paper';
import type { RhythmSettings } from '../rhythm-settings';

/**
 * The input-like family, measured on the rhythm paper.
 *
 * These are the components most likely to share a row in a filter bar, so a
 * height disagreement here is the most visible failure in the library. The
 * single-line members carry `group="form-row"` and feed the page's spread
 * verdict; the block members (textarea, file-upload, calendar, form-field) are
 * measured but deliberately excluded, because their height is content-driven
 * and would turn the spread reading into permanent noise.
 */
@Component({
  selector: 'app-form-controls-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  // The date-bearing controls resolve all date math through an injected
  // `DateAdapter`, supplied application-wide by `provideNativeDateAdapter()` in
  // `app.config.ts`. It returns `EnvironmentProviders`, so it cannot be repeated
  // in a component `providers` array — the app-level registration is the only
  // one, exactly as on the date-picker / calendar demo pages.
  imports: [
    RhythmPaper,
    RhythmCell,
    FormsModule,
    CalendarComponent,
    ComboboxComponent,
    DatePickerComponent,
    DateRangePickerComponent,
    FileUploadComponent,
    FormFieldComponent,
    LabelDirective,
    InputDirective,
    NumberInputDirective,
    NumberStepperComponent,
    SliderComponent,
    TagsInputComponent,
    TextareaDirective,
    TimePickerComponent,
  ],
  template: `
    <app-rhythm-paper
      heading="Form controls"
      lede="Every input-like control at the same size. These are the components most likely to
            share a row, so height divergence here is the most visible."
      [settings]="settings()"
    >
      <app-rhythm-cell
        label="Textarea"
        note="Multi-line by definition — height is rows × line-height, not the control scale."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <textarea
          twTextarea
          [size]="settings().size"
          rows="2"
          placeholder="Notes"
          aria-label="Notes"
          class="w-full"
        ></textarea>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Number input"
        group="form-row"
        note="Directive on an input twInput, paired with tw-number-stepper in a standalone flex row."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <div class="flex w-full items-stretch gap-1">
          <input
            twInput
            twNumberInput
            #qty="twNumberInput"
            [size]="settings().size"
            [min]="1"
            [max]="99"
            [(ngModel)]="quantity"
            aria-label="Quantity"
            class="min-w-0 flex-1"
          />
          <tw-number-stepper [for]="qty" [size]="settings().size" />
        </div>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Tags input"
        note="Height is chip-driven — the strip wraps as tags are added, so it is not a fixed-height row control."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-tags-input
          [size]="settings().size"
          [(ngModel)]="tags"
          placeholder="Add a tag"
          aria-label="Tags"
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Combobox"
        group="form-row"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-combobox
          [options]="fruits"
          [size]="settings().size"
          placeholder="Combobox"
          aria-label="Fruit"
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Date picker"
        group="form-row"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-date-picker
          [size]="settings().size"
          placeholder="Pick a date"
          aria-label="Date"
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Date range picker"
        group="form-row"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-date-range-picker
          [size]="settings().size"
          aria-label="Date range"
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Time picker"
        group="form-row"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-time-picker [size]="settings().size" aria-label="Time" class="w-full" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="File upload"
        note="Dropzone — a block drop target, not a row control; height is set by the drop area."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-file-upload
          [size]="settings().size"
          label="Drop a file"
          description="PNG or PDF."
          class="w-full"
        />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Slider"
        note="Rendered bare so only the track box is measured. Excluded from form-row: a slider is centred against its neighbours in a toolbar, never box-matched to them."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-slider [size]="settings().size" aria-label="Slider" class="w-full" />
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Form field"
        note="The wrapper carries the density — the control inside inherits it. Height includes the reserved subscript row, so it never matches a bare input."
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-form-field [size]="settings().size" class="w-full">
          <label twLabel>Label</label>
          <input twInput placeholder="Wrapped input" />
        </tw-form-field>
      </app-rhythm-cell>

      <app-rhythm-cell
        label="Calendar"
        note="Block component — height is content-driven; no size input, so it renders at its fixed density."
        class="sm:col-span-2"
        [unit]="settings().unit"
        [flagOffGrid]="settings().flagOffGrid"
      >
        <tw-calendar aria-label="Calendar" />
      </app-rhythm-cell>
    </app-rhythm-paper>
  `,
})
export class FormControlsPanel {
  /** Toolbar state forwarded from the rhythm page. */
  readonly settings = input.required<RhythmSettings>();

  protected readonly fruits = ['Apple', 'Banana', 'Cherry'];
  protected readonly quantity = signal<number | null>(1);
  protected readonly tags = signal<string[]>(['Design']);
}
