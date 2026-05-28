import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-time-picker-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TimePickerComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TimePickerComponent&lt;D = Date&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-time-picker</p>

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
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">auto</td>
              <td class="px-4 py-2 text-fg-muted">Id on the host element; used by <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;label for&gt;</code> inside a form-field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">disabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Disables the whole component and blocks every interaction.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">required</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Sets <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code> and honours <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">Validators.required</code> on a bound control.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">readonly</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Refuses typing, stepping, and meridiem toggling while keeping the value visible and focusable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls the field width, font size, and stepper density.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Tints the focused border and the active AM/PM button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TimePickerVariant | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Auto-resolves to <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'naked'</code> when nested in <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>, otherwise <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'default'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">format</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'12h' | '24h'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'24h'</td>
              <td class="px-4 py-2 text-fg-muted">Renders 00–23 hours or 1–12 with an AM/PM toggle.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showSeconds</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders a third field for seconds.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hourStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Increment added when stepping the hour field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minuteStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Increment added when stepping the minute field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">secondStep</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">1</td>
              <td class="px-4 py-2 text-fg-muted">Increment added when stepping the second field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">minTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Earliest accepted time-of-day; values earlier than this set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">maxTime</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Latest accepted time-of-day; values later than this set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">referenceDate</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">D | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Date portion used when typing a time while <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code> is <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>; defaults to today.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">placeholder</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'--'</td>
              <td class="px-4 py-2 text-fg-muted">Placeholder shown in each field when empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showSteppers</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders the up/down chevron buttons next to the fields.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showClear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Renders a clear affordance when a value is set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clearLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'Clear time'</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the clear button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorStateMatcher</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ErrorStateMatcher | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Per-instance override of the error-state matcher used to compute <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorState</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name for the fields group; required when no visible label is supplied.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Id of an external element that labels the group.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-describedby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Consumer-supplied description ids; merged with hint/error ids inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-form-field</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Two-way bindings</h3>
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
              <td class="px-4 py-2 text-fg-muted">Two-way bound current time; setting programmatically updates the fields without firing <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">onChange</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs">timeInput</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TimePickerInputEvent&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires on every keystroke, stepper press, or AM/PM toggle before the value is committed.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">timeChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TimePickerChangeEvent&lt;D&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after a committed change with the new value, previous value, and source.</td>
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
              <td class="px-4 py-2 font-mono text-xs">focus</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">focus(): void</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the hours field.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">clear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">clear(): void</td>
              <td class="px-4 py-2 text-fg-muted">Clears the value and emits <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">timeChange</code> with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">source: 'clear'</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Types -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>

    <!-- Internationalisation -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Internationalisation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every accessible label and live-region announcement is sourced from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TimePickerIntl</code>.
        Provide a partial override anywhere in the injector tree with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTimePickerIntl</code>
        to localise field labels, the meridiem option labels, and the spoken
        announcements.
      </p>
      <tw-code-block [code]="intlSnippet" language="ts" />
    </section>
  `,
})
export class TimePickerApi {
  protected readonly typesSnippet = `type TimePickerVariant = 'default' | 'naked';
type TimePickerFormat = '12h' | '24h';
type TimePickerMeridiem = 'AM' | 'PM';
type TimePickerField = 'hour' | 'minute' | 'second' | 'meridiem';
type TimePickerChangeSource =
  | 'input'
  | 'stepper'
  | 'meridiem'
  | 'clear'
  | 'programmatic';

interface TimePickerChangeEvent<D> {
  value: D | null;
  previousValue: D | null;
  source: TimePickerChangeSource;
}

interface TimePickerInputEvent<D> {
  field: TimePickerField;
  rawText: string;
  parsed: D | null;
}`;

  protected readonly intlSnippet = `import { provideTimePickerIntl } from 'ngx-tw/time-picker';

export const appConfig: ApplicationConfig = {
  providers: [
    provideTimePickerIntl({
      groupLabel: 'Heure',
      hoursLabel: 'Heures',
      minutesLabel: 'Minutes',
      secondsLabel: 'Secondes',
      meridiemGroupLabel: 'AM ou PM',
      amLabel: 'Matin',
      pmLabel: 'Soir',
      clearLabel: 'Effacer l\\'heure',
      clearedAnnouncement: 'Heure effacée',
      selectedAnnouncement: (time) => \`\${time} sélectionnée\`,
    }),
  ],
};`;
}
