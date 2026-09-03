import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CalendarComponent } from '@cdevhub/ngx-tw/calendar';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-calendar-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Calendar component is the base primitive for date and date-range pickers. It delegates
        every date operation to a pluggable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
        so consumers can swap in Luxon, date-fns, or Temporal without touching the component.
        It renders three views — month, year, and multi-year — drills through them on click, and
        integrates with every Angular form strategy through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
        Selection is driven by a swappable strategy — single, range, multi, and week are built in,
        with a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_CALENDAR_SELECTION_STRATEGY</code>
        token for custom behaviour (business-days-only ranges, anchored selections, etc.).
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The month grid uses
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="grid"</code>
        with a roving tabindex — only the focused cell is tabbable, and arrow keys move focus
        without leaving the grid. The year and multi-year views use the same keyboard model
        scaled to months and years. Always provide an accessible name via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-labelledby</code>.
      </p>

      <div class="overflow-x-auto border border-border rounded-lg">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Action</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowLeft / ArrowRight</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one cell backward or forward in the current view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowUp / ArrowDown</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus one row up or down in the current view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Jumps to the first or last cell of the current row.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">PageUp / PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Advances or rewinds the visible page by one month, year, or multi-year span.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Alt + PageUp / Alt + PageDown</td>
              <td class="px-4 py-2 text-fg-muted">Advances or rewinds by a year in the month view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Commits the focused cell as the selection or drills into the next view.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Leaves the grid following natural tab order.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 flex flex-col items-center gap-3">
        <tw-calendar
          aria-label="Basic calendar"
          [value]="basicValue()"
          (valueChange)="onBasicSelected($event)"
        />
        <p class="text-xs text-fg-muted mt-4 font-mono">
          selected = {{ basicValueLabel() }}
        </p>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Import
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CalendarComponent</code>
        from its entry point, then register a date adapter once at the application level with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideNativeDateAdapter()</code>.
        To use Luxon, date-fns, or Temporal instead, implement a subclass of
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
        and register it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwCalendar({{ '{' }} adapter {{ '}' }})</code>.
      </p>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>Three views — month, year, and multi-year — with drill-in navigation</li>
        <li>Four built-in selection modes: <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'single'</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'range'</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'multi'</code>, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'week'</code></li>
        <li>Pluggable selection strategies via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_CALENDAR_SELECTION_STRATEGY</code>
          — drop in a subclass for drag-to-select, business-days-only, anchored ranges, etc.
        </li>
        <li>Pluggable
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">DateAdapter</code>
          — swap the underlying date library (Luxon, date-fns, Temporal) without touching components
        </li>
        <li>Custom cell rendering via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">cellTemplate</code>
          — project dots, badges, or prices into every day / month / year cell
        </li>
        <li>Side-by-side multi-month layout via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">numberOfMonths</code>
          with cross-grid keyboard navigation
        </li>
        <li>Projected preset rail — attach
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twCalendarPresets</code>
          to a container for "Today / Last 7 days" style shortcuts without rebuilding the header
        </li>
        <li>Range preview in every view — hover previews appear in month, year, and multi-year</li>
        <li>Full keyboard navigation: arrows, Home/End, PageUp/PageDown, and Alt+PageUp/PageDown for year hops</li>
        <li>Roving tabindex,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="grid"</code>
          ARIA semantics, and
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-multiselectable</code>
          in multi mode
        </li>
        <li>Per-cell class customisation via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateClass</code>
          for holidays, events, and other highlights
        </li>
        <li>Disable individual dates with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dateFilter</code>
          and min/max bounds
        </li>
        <li>Optional embedded time editor via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">withTime</code>
          with 12h/24h format, configurable steps, and range-endpoint time carry-over
        </li>
        <li>CDK test harness at
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'@cdevhub/ngx-tw/calendar/testing'</code>
          for robust component tests
        </li>
        <li>Semantic color theming (8 colors) and 5 sizes for cell density</li>
        <li>Headerless mode for composing custom shells</li>
        <li>Works with template-driven, reactive, and Angular v21 signal forms</li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/components/date-picker" class="text-primary-600 hover:underline">Date Picker</a>
          — wraps the calendar in a CDK overlay with an input trigger for date and date-range selection.
        </li>
        <li>
          <a routerLink="/components/time-picker" class="text-primary-600 hover:underline">Time Picker</a>
          — the same time editor the calendar embeds, as a standalone control.
        </li>
        <li>
          <a routerLink="/components/form-field" class="text-primary-600 hover:underline">Form Field</a>
          — pair with a date picker to get a label, hint, and error region.
        </li>
        <li>
          <a routerLink="/components/input" class="text-primary-600 hover:underline">Input</a>
          — when a free-form typed date is a better fit than a calendar grid.
        </li>
      </ul>
    </section>
  `,
})
export class CalendarOverview {
  protected readonly basicValue = signal<Date | null>(null);

  protected onBasicSelected(v: unknown): void {
    this.basicValue.set(v instanceof Date ? v : null);
  }

  protected readonly basicValueLabel = computed(() => {
    const v = this.basicValue();
    return v ? v.toDateString() : '—';
  });

  protected readonly basicUsageSnippet = `<tw-calendar aria-label="Pick a date" [(value)]="value" />`;

  protected readonly importSnippet = `import { CalendarComponent, provideNativeDateAdapter } from '@cdevhub/ngx-tw/calendar';

export const appConfig: ApplicationConfig = {
  providers: [provideNativeDateAdapter()],
};`;
}
