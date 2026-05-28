import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-date-picker-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- Component -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">DatePickerComponent&lt;D = Date&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-date-picker</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">id</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Id set on the underlying input; picked up by form-field's label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Earliest selectable date; cascades to the calendar and the input parser.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Latest selectable date; cascades to the calendar and the input parser.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateFilter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateFilterFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-date predicate; return <code class="font-mono">false</code> to disable a cell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'month' | 'year' | 'multi-year'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'month'</td>
              <td class="px-4 py-2 text-fg-muted">Calendar view shown when the overlay opens.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startAt</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Date to focus when opened with no selection; falls back to today.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">format</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Intl medium date</td>
              <td class="px-4 py-2 text-fg-muted">Forwarded to <code class="font-mono">DateAdapter.format()</code>; the native adapter accepts <code class="font-mono">{{ '{' }} dateTimeFormat: Intl.DateTimeFormatOptions {{ '}' }}</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">parseFormat</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Format hint forwarded to <code class="font-mono">DateAdapter.parse()</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Text shown when the input is empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the input and the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Exposes <code class="font-mono">aria-required="true"</code> on the input.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">readonly</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Blocks typing; the trigger still opens the calendar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Trigger padding, font size, and calendar cell density.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for the focused border and the calendar's selection ring.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | 'naked'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Trigger chrome; auto-resolves to <code class="font-mono">'naked'</code> inside <code class="font-mono">tw-form-field</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showClear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether to render the trigger-side clear button when a value is set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showActions</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders a Today / Clear / Cancel / Apply action bar inside the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">openOnFocus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Opens the overlay as soon as the input receives focus.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">timeConfig</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DatePickerTimeConfig | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Bundles all time-mode settings into a single config object — passing a non-null value enables the embedded <code class="font-mono">tw-time-picker</code>. Pass <code class="font-mono">&#123;&#125;</code> to opt in with all defaults; supply any of <code class="font-mono">format</code>, <code class="font-mono">showSeconds</code>, <code class="font-mono">hourStep</code>, <code class="font-mono">minuteStep</code>, <code class="font-mono">secondStep</code>, <code class="font-mono">minTime</code>, <code class="font-mono">maxTime</code> to override per-field defaults.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">locale</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance locale override for the embedded calendar and date adapter. Falls back to Angular <code class="font-mono">LOCALE_ID</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateClassFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-cell CSS class function, forwarded to the embedded calendar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cellTemplate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;&#123; $implicit: CalendarCell&lt;D&gt; &#125;&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Cell-content template forwarded to the embedded calendar — customize cell visuals beyond <code class="font-mono">dateClass</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">presets</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly DatePickerPreset&lt;D&gt;[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Quick-select preset entries rendered above the calendar. Each preset provides a <code class="font-mono">label</code> and a <code class="font-mono">date</code> factory.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">triggerAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Open calendar'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the trigger button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">todayLabel / clearLabel / cancelLabel / applyLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">localized defaults</td>
              <td class="px-4 py-2 text-fg-muted">Labels for the action-bar buttons.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK scroll strategy applied to the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">offset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">4</td>
              <td class="px-4 py-2 text-fg-muted">Pixel distance between the trigger and the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra classes applied to the overlay panel.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">injected</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the error-state policy.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Models (two-way)</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selected date.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound overlay state.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Outputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">opened</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DatePickerOpenedEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the overlay's enter animation completes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DatePickerCloseReason&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the overlay closes with the reason that triggered the close.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateInput</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DatePickerInputEvent&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every keystroke and does not imply the value has committed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DatePickerChangeEvent&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after each commit with the new value, the previous value, and the source.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">presetSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DatePickerPreset&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a preset entry is clicked. Payload is the selected preset.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Content projection</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Slot</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot=trigger-icon]</td>
              <td class="px-4 py-2 text-fg-muted">Override the calendar icon inside the default trigger button. Falls back to a generic calendar SVG.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot=trigger]</td>
              <td class="px-4 py-2 text-fg-muted">Project a custom trigger element (button, card, etc.). When provided, the default input + trigger chrome is hidden, the input remains in the DOM for form integration only, and clicks on the projected trigger toggle the overlay.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Signature</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">openPicker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Opens the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closePicker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Closes the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Clears the value and emits <code class="font-mono">dateChange</code> with <code class="font-mono">source: 'clear'</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class DatePickerApi {
  protected readonly typesSnippet = `type DatePickerVariant = 'default' | 'naked';

type DatePickerChangeSource =
  | 'input' | 'calendar' | 'apply' | 'clear' | 'today' | 'programmatic';

type DatePickerCloseReason =
  | 'select' | 'apply' | 'cancel' | 'escape' | 'backdrop' | 'programmatic';

interface DatePickerInputEvent<D> {
  rawText: string;
  parsed: D | null;
  target: HTMLInputElement;
}

interface DatePickerChangeEvent<D> {
  value: D | null;
  previousValue: D | null;
  source: DatePickerChangeSource;
}

interface DatePickerOpenedEvent {
  trigger: HTMLElement;
}

interface DatePickerPreset<D = Date> {
  label: string;
  date: () => D;
  id?: string;
}

interface DatePickerTimeConfig<D = Date> {
  format?: TimePickerFormat;
  showSeconds?: boolean;
  hourStep?: number;
  minuteStep?: number;
  secondStep?: number;
  minTime?: D | null;
  maxTime?: D | null;
}`;
}
