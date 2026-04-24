import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-calendar-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CalendarComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-calendar</p>

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
              <td class="px-4 py-2 font-mono text-xs">selectionMode</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'single' | 'range' | 'multi' | 'week'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'single'</td>
              <td class="px-4 py-2 text-fg-muted">Selection mode — switches <code class="font-mono">selected</code> between scalar, <code class="font-mono">TwDateRange</code>, or <code class="font-mono">D[]</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cellTemplate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;TwCalendarCellTemplateContext&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Optional template rendered inside every cell; context is <code class="font-mono">TwCalendarCell&lt;D&gt;</code> as <code class="font-mono">$implicit</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">numberOfMonths</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Number of consecutive months the month view displays side by side under one header.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startAt</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Initial focused date; falls back to today when <code class="font-mono">null</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'month' | 'year' | 'multi-year'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'month'</td>
              <td class="px-4 py-2 text-fg-muted">Which view opens first.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Minimum selectable date; earlier cells are disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Maximum selectable date; later cells are disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateFilter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDateFilter&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-date predicate — return <code class="font-mono">false</code> to disable a cell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwCalendarCellClassFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Returns extra Tailwind classes per cell; receives the active view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">firstDayOfWeek</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the adapter's first-day-of-week (0 = Sunday).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for selection, today ring, and range fill.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Cell density.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Blocks all interaction and dims the surface.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">headerless</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Hides the internal header for consumers composing a custom shell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">withTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders a time editor below the month grid; selection values carry the chosen time-of-day.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">timeFormat</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'24h' | '12h'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'24h'</td>
              <td class="px-4 py-2 text-fg-muted">Format of the embedded time editor.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showSeconds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Whether the embedded time editor exposes a seconds field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hourStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time editor's hour field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minuteStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time editor's minute field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">secondStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Step for the embedded time editor's second field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Earliest accepted time-of-day for the embedded editor; ignored when <code class="font-mono">withTime</code> is false.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Latest accepted time-of-day for the embedded editor; ignored when <code class="font-mono">withTime</code> is false.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the grid group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an element that labels the grid.</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwCalendarSelection&lt;D&gt;</td>
              <td class="px-4 py-2 text-fg-muted">The current selection; shape depends on <code class="font-mono">selectionMode</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activeDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D</td>
              <td class="px-4 py-2 text-fg-muted">Currently focused cell; writable so pickers can drive it externally.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">currentView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwCalendarView</td>
              <td class="px-4 py-2 text-fg-muted">The visible view; writable for "jump to year picker" shortcuts.</td>
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
              <td class="px-4 py-2 font-mono text-xs">userSelection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwCalendarUserSelection&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires whenever the user commits a selection via click or Enter/Space.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">viewChanged</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwCalendarView&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the visible view changes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">monthSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;D&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires from the year view; the day is preserved from the active date.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">yearSelected</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;D&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires from the multi-year view.</td>
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
              <td class="px-4 py-2 font-mono text-xs">goTo</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(date: D, view?: TwCalendarView): void</td>
              <td class="px-4 py-2 text-fg-muted">Navigates to a date and optionally switches view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(view: TwCalendarView): void</td>
              <td class="px-4 py-2 text-fg-muted">Changes the visible view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focusActiveCell</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the active cell; useful after opening an overlay.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">next</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Advances the visible page by one month, year, or multi-year span.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">previous</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Rewinds the visible page by one month, year, or multi-year span.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">DateAdapter</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Abstract class</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Abstract class the calendar uses for every date operation. Ship a subclass to
        integrate Luxon, date-fns, or Temporal without modifying any component.
      </p>
      <tw-code-block [code]="adapterSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Selection strategies</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Injection token: TW_CALENDAR_SELECTION_STRATEGY</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Four built-in strategies drive the shipped selection modes; provide a subclass via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_CALENDAR_SELECTION_STRATEGY</code>
        to customise the behaviour (drag-to-select, business-days-only, anchored selection, etc.).
      </p>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Class</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Selection type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TwSingleSelectionStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 text-fg-muted">One click commits; no preview.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TwRangeSelectionStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDateRange&lt;D&gt; | null</td>
              <td class="px-4 py-2 text-fg-muted">First click sets start, second completes; swaps if reversed; hover previews the range.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TwMultiSelectionStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly D[]</td>
              <td class="px-4 py-2 text-fg-muted">Toggles each clicked date in or out of the array; no preview.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">TwWeekSelectionStrategy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwDateRange&lt;D&gt; | null</td>
              <td class="px-4 py-2 text-fg-muted">Selects the whole week containing the clicked date; hover previews the week.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Provider helpers</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Function</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideSingleSelection()</td>
              <td class="px-4 py-2 text-fg-muted">Binds <code class="font-mono">TwSingleSelectionStrategy</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideRangeSelection()</td>
              <td class="px-4 py-2 text-fg-muted">Binds <code class="font-mono">TwRangeSelectionStrategy</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideMultiSelection()</td>
              <td class="px-4 py-2 text-fg-muted">Binds <code class="font-mono">TwMultiSelectionStrategy</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideWeekSelection()</td>
              <td class="px-4 py-2 text-fg-muted">Binds <code class="font-mono">TwWeekSelectionStrategy</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">provideCalendarSelection(Strategy)</td>
              <td class="px-4 py-2 text-fg-muted">Binds any subclass of <code class="font-mono">TwCalendarSelectionStrategy</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
      <tw-code-block [code]="selectionStrategySnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TwCalendarPresets</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: [twCalendarPresets]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive that projects a container into the calendar's preset rail (rendered
        between the header and the grid). Ships no inputs or outputs — it's a structural marker
        that anchors the <code class="font-mono">ng-content select="[twCalendarPresets]"</code> slot.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TW_DATE_RANGE_SELECTION_STRATEGY</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">
        Injection token: TwDateRangeSelectionStrategy&lt;D&gt;
        <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-warning-50 text-warning-700">deprecated</span>
      </p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Legacy range-only strategy token. Prefer <code class="font-mono">TW_CALENDAR_SELECTION_STRATEGY</code>
        with <code class="font-mono">TwRangeSelectionStrategy</code>. The calendar still honours
        this token in <code class="font-mono">selectionMode="range"</code> for back-compat and
        adapts it at runtime.
      </p>
      <tw-code-block [code]="rangeStrategySnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">CalendarHarness / CalendarCellHarness</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Import from: 'ngx-tw/calendar/testing'</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        CDK component harnesses for robust tests. Query cells by text, selected state, or
        disabled state; drive navigation without reaching into private selectors.
      </p>
      <tw-code-block [code]="harnessSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Exported primitives</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        These lower-level pieces are re-exported from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ngx-tw/calendar</code>
        so consumers can compose their own shells (preset shortcut bars, side-by-side range
        panels, custom headers) without reimplementing the view primitives.
      </p>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CalendarHeaderComponent</code> — previous/next/period button strip</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CalendarBodyComponent</code> — low-level grid, reusable for custom views</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">MonthViewComponent</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">YearViewComponent</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">MultiYearViewComponent</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwCalendarPresets</code> — preset rail marker directive</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwCalendarSelectionStrategy</code> and the four shipped subclasses</li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDateRange</code></li>
        <li><code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NativeDateAdapter</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideNativeDateAdapter()</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwCalendar()</code></li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CalendarApi {
  protected readonly adapterSnippet = `import { DateAdapter, provideTwCalendar } from 'ngx-tw/calendar';

class LuxonDateAdapter extends DateAdapter<DateTime> {
  // implement addCalendarDays, format, getYear, …
}

export const appConfig: ApplicationConfig = {
  providers: [provideTwCalendar({ adapter: LuxonDateAdapter })],
};`;

  protected readonly rangeStrategySnippet = `// Deprecated — kept working in range mode only.
import { TW_DATE_RANGE_SELECTION_STRATEGY } from 'ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [
    { provide: TW_DATE_RANGE_SELECTION_STRATEGY, useClass: MyStrategy },
  ],
};`;

  protected readonly selectionStrategySnippet = `import {
  provideRangeSelection,
  provideMultiSelection,
  provideCalendarSelection,
  TwCalendarSelectionStrategy,
  type TwSelectionResult,
} from 'ngx-tw/calendar';

// 1. Use a built-in strategy by default
export const appConfig: ApplicationConfig = {
  providers: [provideRangeSelection()],
};

// 2. Or ship a custom strategy
class BusinessDayRangeStrategy<D> extends TwCalendarSelectionStrategy<D, TwDateRange<D> | null> {
  select(date, current, adapter): TwSelectionResult<D, TwDateRange<D> | null> {
    // snap endpoints to the nearest weekday, disallow weekends…
  }
  // implement createPreview, isSelected, isRange*
}

providers: [provideCalendarSelection(BusinessDayRangeStrategy)]`;

  protected readonly harnessSnippet = `import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { CalendarHarness } from 'ngx-tw/calendar/testing';

const loader = TestbedHarnessEnvironment.loader(fixture);
const calendar = await loader.getHarness(CalendarHarness);

await calendar.selectCell('15');
expect(await calendar.getPeriodLabel()).toBe('April 2026');

const cells = await calendar.getSelectedCells();
expect(await cells[0].getText()).toBe('15');`;

  protected readonly typesSnippet = `type TwCalendarView = 'month' | 'year' | 'multi-year';

type TwCalendarSelectionMode = 'single' | 'range' | 'multi' | 'week';

type TwCalendarSelection<D> = D | TwDateRange<D> | readonly D[] | null;

type TwDateFilter<D> = (date: D) => boolean;

type TwCalendarCellClassFn<D> = (
  date: D,
  view: TwCalendarView,
) => string | string[] | Record<string, boolean>;

type TwDateRangeInput<D> = TwDateRange<D> | { start: D | null; end: D | null } | null;

interface TwCalendarCellTemplateContext<D> {
  $implicit: TwCalendarCell<D>;
}

interface TwSelectionResult<D, S> {
  selection: S;
  isComplete: boolean;
  preview?: TwDateRange<D> | null;
}

interface TwCalendarUserSelection<D> {
  value: D | TwDateRange<D> | readonly D[] | null;
  source: 'user';
}`;
}
