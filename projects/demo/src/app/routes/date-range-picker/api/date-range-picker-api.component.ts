import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-date-range-picker-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- Component -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">DateRangePickerComponent&lt;D = Date&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-date-range-picker</p>

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
              <td class="px-4 py-2 text-fg-muted">Id set on the trigger element; picked up by form-field's label.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Earliest selectable date for either endpoint; cascades to both calendars and preset validation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Latest selectable date for either endpoint; cascades to both calendars and preset validation.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateFilter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateFilterFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-date predicate applied in both calendars; return <code class="font-mono">false</code> to disable a cell.</td>
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
              <td class="px-4 py-2 text-fg-muted">Date the left calendar focuses on when opened with no value; falls back to today.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">format</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Intl medium date</td>
              <td class="px-4 py-2 text-fg-muted">Forwarded to <code class="font-mono">DateAdapter.format()</code> for each endpoint; folds in hour/minute when <code class="font-mono">showTime</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rangeSeparator</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">' – '</td>
              <td class="px-4 py-2 text-fg-muted">Separator rendered between the two formatted endpoints in the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">emptyStartLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Start date'</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder text for an empty start endpoint.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">emptyEndLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'End date'</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder text for an empty end endpoint.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the composed start/end placeholders with a single string when set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the trigger and blocks opening the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Exposes <code class="font-mono">aria-required="true"</code> on the trigger.</td>
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
              <td class="px-4 py-2 text-fg-muted">Semantic color for the focused border and the calendar's range fill.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | 'naked'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Trigger chrome; auto-resolves to <code class="font-mono">'naked'</code> inside <code class="font-mono">tw-form-field</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">numberOfMonths</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1 | 2</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">2</td>
              <td class="px-4 py-2 text-fg-muted">How many months the overlay renders side by side.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">presets</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly DateRangePreset&lt;D&gt;[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Quick-select preset list rendered as a sidebar before the calendars.</td>
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
              <td class="px-4 py-2 text-fg-muted">Renders a <code class="font-mono">Today / Clear / Cancel / Apply</code> action bar at the bottom of the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders two <code class="font-mono">tw-time-picker</code> instances for start/end time-of-day.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">timeFormat</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'24h' | '12h'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'24h'</td>
              <td class="px-4 py-2 text-fg-muted">Time format for the embedded time-pickers.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showSeconds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Whether the embedded time-pickers expose a seconds field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hourStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time-pickers' hour fields.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minuteStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time-pickers' minute fields.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">secondStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time-pickers' second fields.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">todayLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Today'</td>
              <td class="px-4 py-2 text-fg-muted">Label for the <em>Today</em> action in the overlay's action bar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clearLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Clear'</td>
              <td class="px-4 py-2 text-fg-muted">Label for the <em>Clear</em> action in the overlay's action bar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cancelLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Cancel'</td>
              <td class="px-4 py-2 text-fg-muted">Label for the <em>Cancel</em> action in the overlay's action bar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">applyLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Apply'</td>
              <td class="px-4 py-2 text-fg-muted">Label for the <em>Apply</em> action in the overlay's action bar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">panelClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | readonly string[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Extra class(es) applied to the overlay panel element.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition' | 'close' | 'block'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'reposition'</td>
              <td class="px-4 py-2 text-fg-muted">CDK scroll strategy for the overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">offset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">4</td>
              <td class="px-4 py-2 text-fg-muted">Pixel distance between trigger and overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clearAriaLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Clear date range'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible label for the trigger-side clear button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minRangeLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Minimum range length in days (inclusive). Commits below the floor surface <code class="font-mono">calendarRangeTooShort</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxRangeLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Maximum range length in days (inclusive). Commits above the ceiling surface <code class="font-mono">calendarRangeTooLong</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rangeBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;RangeBehaviorConfig&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123;&#125;</td>
              <td class="px-4 py-2 text-fg-muted">
                Range-mode behavior knobs forwarded to the embedded calendar as a single config object. Unset fields use the defaults documented on
                <code class="font-mono">RangeBehaviorConfig</code>:
                <code class="font-mono">allowSingleDayRange: true</code>,
                <code class="font-mono">persistPartialRange: true</code>,
                <code class="font-mono">allowBackwardRange: false</code>,
                <code class="font-mono">disableRangesCrossingDisabledDates: false</code>.
              </td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rangeClickBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'restart' | 'nearest-edge' | 'require-clear'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'restart'</td>
              <td class="px-4 py-2 text-fg-muted">How the calendar reacts to a click after a complete range — start fresh, move the nearer endpoint, or block until cleared.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">firstDayOfWeek</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Override first day of week (0=Sun, 1=Mon) on the embedded calendar. Falls back to the adapter's default.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">locale</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance locale override forwarded to the embedded calendar and the underlying adapter. Falls back to Angular <code class="font-mono">LOCALE_ID</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateClassFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Function producing per-cell CSS classes on the embedded calendar.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cellTemplate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;…&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Cell-content template forwarded to the embedded calendar; customizes cell visuals beyond <code class="font-mono">dateClass</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">injected</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the library's <code class="font-mono">ErrorStateMatcher</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the trigger; required when no visible label is supplied.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external element that labels the trigger.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied aria-describedby ids; preserved when the form-field merges hint/error ids.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDateRange&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selected range; use <code class="font-mono">[(value)]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">open</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound open state of the overlay; use <code class="font-mono">[(open)]</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DateRangePickerOpenedEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the overlay's enter animation completes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DateRangePickerCloseReason&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after the overlay's leave animation completes; payload is the close reason.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rangeChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DateRangePickerChangeEvent&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after a commit — from calendar, preset, time, action bar, or programmatic writes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">presetSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;DateRangePreset&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the user picks a preset; fires in addition to rangeChange.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Methods</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
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
              <td class="px-4 py-2 text-fg-muted">Opens the overlay; no-op when disabled or already open.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">closePicker</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Closes the overlay; no-op when already closed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">toggle</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Toggles the overlay's open state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Clears the current range and emits rangeChange with source 'clear'.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Content projection</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Required</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Cardinality</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="trigger-icon"]</td>
              <td class="px-4 py-2 text-fg-muted">No</td>
              <td class="px-4 py-2 text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the default calendar-range SVG icon rendered at the trailing edge of the trigger.</td>
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
export class DateRangePickerApi {
  protected readonly typesSnippet = `/** Visual style of the trigger. */
export type DateRangePickerVariant = 'default' | 'naked';

/** How many months the overlay displays side-by-side. */
export type DateRangePickerMonths = 1 | 2;

/** Origin of a value change, used to distinguish user input from programmatic writes. */
export type DateRangePickerChangeSource =
  | 'calendar'
  | 'preset'
  | 'time'
  | 'apply'
  | 'clear'
  | 'programmatic';

/** Reason the overlay closed. */
export type DateRangePickerCloseReason =
  | 'select'
  | 'apply'
  | 'cancel'
  | 'escape'
  | 'backdrop'
  | 'programmatic';

/** Emitted by rangeChange after a committed value update. */
export interface DateRangePickerChangeEvent<D> {
  readonly value: TwDateRange<D> | null;
  readonly previousValue: TwDateRange<D> | null;
  readonly source: DateRangePickerChangeSource;
}

/** Emitted by opened. */
export interface DateRangePickerOpenedEvent {
  readonly trigger: HTMLElement;
}

/** A quick-select preset rendered in the overlay's preset list. */
export interface DateRangePreset<D = Date> {
  readonly label: string;
  readonly range: () => TwDateRange<D>;
  readonly id?: string;
}

// Re-exported from 'ngx-tw/calendar' — use directly:
//   import { TwDateRange } from 'ngx-tw/calendar';
export class TwDateRange<D> {
  constructor(
    public readonly start: D | null,
    public readonly end: D | null,
  ) {}
  get complete(): boolean;
  get empty(): boolean;
}`;
}
