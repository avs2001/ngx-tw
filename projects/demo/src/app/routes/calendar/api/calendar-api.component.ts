import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-calendar-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  host: { class: 'block' },
  template: `
    <section class="mb-6">
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        This API reference reflects the currently-implemented Phase 1 surface of the calendar refactor
        (see <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">docs/calendar-refactoring-plan.md</code>).
        The remaining 18 phases land additional inputs, outputs, and behavior described in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">docs/requirements/calendar-component-requirements.md</code>.
      </p>
    </section>

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
              <td class="px-4 py-2 font-mono text-xs">mode</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CalendarMode</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'single'</td>
              <td class="px-4 py-2 text-fg-muted">Selection mode — <code class="font-mono">'single'</code>, <code class="font-mono">'multiple'</code>, or <code class="font-mono">'range'</code>. Runtime changes clear the value and emit <code class="font-mono">modeChange</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">value</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CalendarValue&lt;M, D&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">mode-specific empty</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selection. Narrows by mode: <code class="font-mono">D | null</code>, <code class="font-mono">D[]</code>, or <code class="font-mono">&#123; start; end &#125;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startAt</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Initial focused date; falls back to today when <code class="font-mono">null</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">startView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'day' | 'month' | 'year'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'day'</td>
              <td class="px-4 py-2 text-fg-muted">Which view opens first. Phase 8 will derive the default from <code class="font-mono">rangeGranularity</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minDate / maxDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Constraint bounds. Cells outside the window are disabled.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateFilter</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateFilterFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Per-date predicate — return <code class="font-mono">false</code> to disable a cell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabledDates</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DisabledDates&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Array (compared via <code class="font-mono">adapter.sameDate</code>) or predicate (returns <code class="font-mono">true</code> for disabled). OR-combined with <code class="font-mono">dateFilter</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabledDaysOfWeek</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly number[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Days of week to disable (0=Sun … 6=Sat).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minRangeLength / maxRangeLength</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Range length (days, inclusive) limits — drives <code class="font-mono">rangePreview.invalidPreview</code> and the <code class="font-mono">calendarRangeTooShort</code> / <code class="font-mono">calendarRangeTooLong</code> validation codes.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxSelections</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Cap on selections in <code class="font-mono">mode="multiple"</code>. Drives <code class="font-mono">selectionLimitReached</code> and <code class="font-mono">calendarMaxSelections</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxSelectionBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'emit-limit-reached' | 'replace-oldest' | 'ignore'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'emit-limit-reached'</td>
              <td class="px-4 py-2 text-fg-muted">What happens when a click exceeds <code class="font-mono">maxSelections</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorAriaDescribedBy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">IDREF of a consumer-rendered error live region (§28.3) — applied to the host's <code class="font-mono">aria-describedby</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rangeClickBehavior</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'restart' | 'nearest-edge' | 'require-clear'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'restart'</td>
              <td class="px-4 py-2 text-fg-muted">3rd-click behavior for <code class="font-mono">mode="range"</code> after a committed range (§21.2). <code class="font-mono">'nearest-edge'</code> drags the closer endpoint; <code class="font-mono">'require-clear'</code> rejects with <code class="font-mono">data-state-invalid-flash</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">allowBackwardRange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Skip the auto-swap path; commit ranges with <code class="font-mono">start &gt; end</code> as-clicked.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">allowSingleDayRange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">When <code class="font-mono">false</code>, clicking the same date twice flashes invalid instead of committing <code class="font-mono">{start, end: start}</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">persistPartialRange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the in-flight draft survives view navigation while SELECTING.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disableRangesCrossingDisabledDates</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Reject committing a range whose interior crosses a disabled date — flashes the second-click cell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">dateClass</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">DateClassFn&lt;D&gt; | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Returns extra Tailwind classes per cell; receives the active view state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">firstDayOfWeek</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null (adapter default)</td>
              <td class="px-4 py-2 text-fg-muted">Rotates the weekday header to start at day <code class="font-mono">0..6</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">monthColumns</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Side-by-side months (1 or 2). Auto-defaults to 2 when <code class="font-mono">mode="range"</code>. Phase 9 replaces this with a full <code class="font-mono">numberOfMonths: 1..12+</code> surface (§23).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">bordered</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders a border and soft shadow around the grid.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables all interaction.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">cellTemplate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TemplateRef&lt;&#123; $implicit: CalendarCell&lt;D&gt; &#125;&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Custom cell renderer. Phase 13 extends this to the full <code class="font-mono">DayCellContext</code> (§24.1).</td>
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
              <th class="px-4 py-2 font-medium text-fg-muted">Payload</th>
              <th class="px-4 py-2 font-medium text-fg-muted">When</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">valueChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">CalendarValue&lt;M, D&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every committed value change.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionStart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; start: D &#125;</td>
              <td class="px-4 py-2 text-fg-muted">First click of a range selection (enters SELECTING).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionComplete</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; value; reason &#125;</td>
              <td class="px-4 py-2 text-fg-muted">A selection commits. <code class="font-mono">reason</code> flags <code class="font-mono">'commit'</code>, <code class="font-mono">'auto-swap'</code>, etc.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionRestart</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; start: D &#125;</td>
              <td class="px-4 py-2 text-fg-muted">Third range click (<code class="font-mono">rangeClickBehavior='restart'</code>) — resets to SELECTING.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionCleared</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; reason &#125;</td>
              <td class="px-4 py-2 text-fg-muted">Value clears — user, programmatic, mode change, reset, or disabled flip.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">viewChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; from; to; reason &#125;</td>
              <td class="px-4 py-2 text-fg-muted">View state transitions (drill-up, drill-down, user, programmatic).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activeDateChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D</td>
              <td class="px-4 py-2 text-fg-muted">Focus / navigation moved the active cell.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">monthChange / yearChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; year; month? &#125;</td>
              <td class="px-4 py-2 text-fg-muted">Displayed period changed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">modeChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">&#123; from; to &#125;</td>
              <td class="px-4 py-2 text-fg-muted">Runtime mode change (§11.2 emit order).</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Readonly signals</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Name</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;'EMPTY' | 'SELECTING' | 'COMPLETE'&gt;</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">viewState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;'day' | 'month' | 'year'&gt;</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">activeDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;D | null&gt;</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">overlayState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;CalendarOverlayState | null&gt;</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">displayedMonths</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Signal&lt;&#123; year; month &#125;[]&gt;</td>
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
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">focusDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(date: D, opts?: &#123; navigate?: boolean &#125;) =&gt; void</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">setView</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(view: CalendarViewState) =&gt; void</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">goToDate / goToToday</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(date?: D) =&gt; void</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear / clearSelection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">reset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">() =&gt; void</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Exported types (Phase 1)</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class CalendarApi {
  protected readonly typesSnippet = `import type {
  CalendarMode,         // 'single' | 'multiple' | 'range'
  CalendarValue,        // narrow by mode
  CalendarSingleValue,  // D | null
  CalendarMultipleValue,// D[]
  CalendarRangeValue,   // { start; end }
  CalendarViewState,    // 'day' | 'month' | 'year'
  CalendarSelectionState, // 'EMPTY' | 'SELECTING' | 'COMPLETE'
  CalendarOverlayState, // 'closed' | 'opening' | 'open' | 'closing'
  CalendarErrorCode,    // validation codes per §10.2
  DateFilterFn,
  DateClassFn,
} from 'ngx-tw/calendar';`;
}
