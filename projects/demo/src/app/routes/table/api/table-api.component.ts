import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-table-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- TableComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">TableComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-table</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Visual and behavioural concerns are grouped into config-object inputs —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">appearance</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sticky</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">responsive</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">selection</code>.
        Each accepts a partial object; unset keys fall back to the documented defaults. Data, state,
        the row-mechanics flag, i18n, and a11y attributes remain flat.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Top-level inputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">data</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableDataSourceInput&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Row data — accepts a plain array, an <code class="font-mono">Observable&lt;readonly T[]&gt;</code>, or a CDK <code class="font-mono">DataSource&lt;T&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">trackBy</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TrackByFunction&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">CDK row-tracking function for minimal re-renders across data updates.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">loading</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Renders the loading slot as an overlay and dims the table body.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">error</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">unknown | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">When non-null, replaces the body with the error slot or fallback message.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">appearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableAppearance</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Visual configuration — see <a href="#appearance-fields" class="text-primary-600 hover:underline">TwTableAppearance fields</a>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sticky</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableSticky</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Sticky header/footer + internal scroll region — see <a href="#sticky-fields" class="text-primary-600 hover:underline">TwTableSticky fields</a>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">responsive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableResponsive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Responsive behaviour — see <a href="#responsive-fields" class="text-primary-600 hover:underline">TwTableResponsive fields</a>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableSelection</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Selection configuration — see <a href="#selection-fields" class="text-primary-600 hover:underline">TwTableSelection fields</a>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">multiTemplateRows</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Required for <code class="font-mono">*twRowExpansion</code> and advanced CDK row-template variants.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                expandedRows
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">ReadonlySet&lt;T&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">new Set()</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound set of expanded rows — always set a new Set instance; never mutate in place.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">
                selected
                <span class="ml-1 inline-block px-1.5 py-0.5 rounded text-2xs font-medium bg-info-50 text-info-700">two-way</span>
              </td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">readonly T[]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">[]</td>
              <td class="px-4 py-2 text-fg-muted">Two-way bound selection list; only used when <code class="font-mono">selection.enabled</code> is true.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">labels</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">Partial&lt;TwTableLabels&gt;</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Overrides for user-facing strings — unset keys fall back to the English defaults.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name; required when no <code class="font-mono">[slot="caption"]</code> is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Id of an external element that labels the table.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="appearance-fields" class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">TwTableAppearance fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | 'striped' | 'bordered'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default'</td>
              <td class="px-4 py-2 text-fg-muted">Visual variant — clean dividers, striped rows, or full grid with rounded outer border.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">density</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'comfortable' | 'compact'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'comfortable'</td>
              <td class="px-4 py-2 text-fg-muted">Cell padding scale; comfortable for browseable lists, compact for dense admin panels.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Base font-size scale applied to headers and cells.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">layout</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto' | 'fixed'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'auto'</td>
              <td class="px-4 py-2 text-fg-muted">Table layout algorithm — fixed respects <code class="font-mono">display.width</code> and enables sticky-width optimizations.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">rowAnimations</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Fades rows in on enter; off by default to avoid flicker on frequent data updates.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="sticky-fields" class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">TwTableSticky fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">header</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Pins the header while the body scrolls; requires <code class="font-mono">scrollHeight</code> or a scrolling ancestor.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">footer</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Pins the footer row while the body scrolls.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">scrollHeight</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Max-height of the internal scroll container; numbers are treated as pixels.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="responsive-fields" class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">TwTableResponsive fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">mode</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwTableResponsiveMode</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'scroll'</td>
              <td class="px-4 py-2 text-fg-muted">Narrow-viewport strategy — <code class="font-mono">scroll</code> keeps the table as-is, <code class="font-mono">stack</code> collapses rows into cards, <code class="font-mono">hide</code> drops <code class="font-mono">display.hideBelow</code> columns.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">stackBelow</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwBreakpoint</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Breakpoint below which <code class="font-mono">mode: 'stack'</code> engages.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="selection-fields" class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">TwTableSelection fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">enabled</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Exposes a leading <code class="font-mono">_selection</code> column slot for checkbox rendering.</td>
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
              <td class="px-4 py-2 font-mono text-xs">rowClicked</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwRowClickEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when a row is clicked; suppressed when the click originated inside an interactive descendant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">expansionChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwRowExpansionChangeEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after a user interaction toggles a row's expansion state.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectionChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;TwSelectionChangeEvent&lt;T&gt;&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires after <code class="font-mono">selected</code> changes via user interaction.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Slots</h3>
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
              <td class="px-4 py-2 font-mono text-xs">[slot="caption"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Rendered inside the <code class="font-mono">&lt;table&gt;</code> as a native <code class="font-mono">&lt;caption&gt;</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="toolbar"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Region above the scroll container for filters, bulk actions, and export buttons.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="empty"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Body overlay when <code class="font-mono">data</code> is empty; falls back to icon + "No data".</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="loading"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Absolute overlay rendered while <code class="font-mono">loading</code> is true; falls back to spinner + message.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="error"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Replaces the body while <code class="font-mono">error</code> is set; falls back to icon + <code class="font-mono">String(error)</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="footer"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Region below the table body, above the pagination slot; hidden when empty.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[slot="pagination"]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">No</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0..1</td>
              <td class="px-4 py-2 text-fg-muted">Bottom region typically used to host a <code class="font-mono">&lt;tw-paginator&gt;</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ColumnComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">ColumnComponent&lt;T&gt;</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-column</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pure-metadata component — its host element is <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display: none</code>; the actual cells are emitted by the parent <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-table&gt;</code> using the projected <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twHeaderCellDef</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twCellDef</code> / <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twFooterCellDef</code> templates. Visual axes live on the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">display</code>
        config object; identity, ordering, and label inputs stay flat.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Top-level inputs</h3>
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
              <td class="px-4 py-2 font-mono text-xs">name</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Required — unique column id used as the CDK <code class="font-mono">cdkColumnDef</code> name.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">display</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColumnDisplay</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">{{ '{}' }}</td>
              <td class="px-4 py-2 text-fg-muted">Visual configuration — see <a href="#column-display-fields" class="text-primary-600 hover:underline">TwColumnDisplay fields</a>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hidden</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Removes the column from the visible column set.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">priority</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Ordering hint for the default visible-columns list; lower renders first.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">headerLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Plain-text header fallback when no <code class="font-mono">*twHeaderCellDef</code> is projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">stackLabel</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Inline label used as <code class="font-mono">data-label</code> in stack mode; falls back to <code class="font-mono">headerLabel</code> then <code class="font-mono">name</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sortState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColumnAriaSort</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Explicit override for the column header's <code class="font-mono">aria-sort</code>. When unset, the column auto-derives <code class="font-mono">aria-sort</code> from a parent <code class="font-mono">[twSort]</code> directive — the column is treated as active when its <code class="font-mono">name</code> matches <code class="font-mono">twSortActive</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>

      <h3 id="column-display-fields" class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">TwColumnDisplay fields</h3>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Key</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Type</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Default</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">sticky</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'end' | false</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Pins the column to the leading or trailing edge during horizontal scroll.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">align</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start' | 'center' | 'end'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'start'</td>
              <td class="px-4 py-2 text-fg-muted">Horizontal alignment applied to header and data cells.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">numeric</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Convenience flag equivalent to <code class="font-mono">align: 'end'</code> plus tabular numerals.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hideBelow</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwBreakpoint | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">Hides the column below this viewport breakpoint when the table's <code class="font-mono">responsive.mode === 'hide'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">width</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | number | null</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">null</td>
              <td class="px-4 py-2 text-fg-muted">CSS column width; only honoured when the table's <code class="font-mono">appearance.layout === 'fixed'</code>.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Template directives -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template Directives</h2>
      <div class="overflow-x-auto border border-border rounded-lg mb-6">
        <table class="w-full text-sm">
          <thead>
            <tr class="bg-surface-muted text-left">
              <th class="px-4 py-2 font-medium text-fg-muted">Selector</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Context</th>
              <th class="px-4 py-2 font-medium text-fg-muted">Description</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-border-muted">
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twCellDef]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwCellContext&lt;T&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Defines a column's data-cell template; context exposes <code class="font-mono">row</code>, <code class="font-mono">index</code>, <code class="font-mono">columnIndex</code>, <code class="font-mono">first</code>, <code class="font-mono">last</code>, <code class="font-mono">even</code>, <code class="font-mono">odd</code>, <code class="font-mono">count</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twHeaderCellDef]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwHeaderCellContext</td>
              <td class="px-4 py-2 text-fg-muted">Defines a column's header-cell template; context exposes <code class="font-mono">column</code> and <code class="font-mono">columnIndex</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">[twFooterCellDef]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwFooterCellContext&lt;T&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Defines a column's footer-cell template; context exposes a <code class="font-mono">rows</code> snapshot for totals.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ng-template[twNoDataRow]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">—</td>
              <td class="px-4 py-2 text-fg-muted">Full-width no-data row; takes precedence over the empty-state overlay when projected.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ng-template[twRowExpansion]</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwRowExpansionContext&lt;T&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Renders the expansion panel for rows in <code class="font-mono">expandedRows</code>; requires <code class="font-mono">[multiTemplateRows]="true"</code>.</td>
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
export class TableApi {
  protected readonly typesSnippet = `type TwTableVariant = 'default' | 'striped' | 'bordered';
type TwTableDensity = 'comfortable' | 'compact';
type TwTableResponsiveMode = 'scroll' | 'stack' | 'hide';
type TwTableLayout = 'auto' | 'fixed';
type TwColumnAlign = 'start' | 'center' | 'end';
type TwColumnSticky = 'start' | 'end' | false;
type TwColumnAriaSort = 'ascending' | 'descending' | 'none' | null;

type TwTableDataSourceInput<T> = readonly T[] | Observable<readonly T[]> | DataSource<T>;

interface TwTableAppearance {
  variant?: TwTableVariant;      // default: 'default'
  density?: TwTableDensity;      // default: 'comfortable'
  size?: TwSize;                 // default: 'md'
  layout?: TwTableLayout;        // default: 'auto'
  rowAnimations?: boolean;       // default: false
}

interface TwTableSticky {
  header?: boolean;                       // default: false
  footer?: boolean;                       // default: false
  scrollHeight?: string | number | null;  // default: null
}

interface TwTableResponsive {
  mode?: TwTableResponsiveMode;  // default: 'scroll'
  stackBelow?: TwBreakpoint;     // default: 'md'
}

interface TwTableSelection {
  enabled?: boolean;             // default: false
}

interface TwColumnDisplay {
  sticky?: TwColumnSticky;                // default: false
  align?: TwColumnAlign;                  // default: 'start'
  numeric?: boolean;                      // default: false
  hideBelow?: TwBreakpoint | null;        // default: null
  width?: string | number | null;         // default: null
}

interface TwTableLabels {
  ariaLabel: string;
  empty: string;
  loading: string;
  errorPrefix: string;
  rowsUpdatedAnnouncement: string;  // '{count} rows loaded'
  selectionAnnouncement: string;    // '{count} rows selected'
  expandRowLabel: string;
  collapseRowLabel: string;
  selectAllLabel: string;           // 'Select all rows'
  selectRowLabel: string;           // 'Select row {index}'
}

interface TwCellContext<T> {
  $implicit: T;
  row: T;
  column: string;
  index: number;
  columnIndex: number;
  first: boolean;
  last: boolean;
  even: boolean;
  odd: boolean;
  count: number;
}

interface TwHeaderCellContext {
  $implicit: string;
  column: string;
  columnIndex: number;
}

interface TwFooterCellContext<T> {
  $implicit: string;
  column: string;
  columnIndex: number;
  rows: readonly T[];
}

interface TwRowExpansionContext<T> {
  $implicit: T;
  row: T;
  index: number;
  collapse: () => void;
}

interface TwRowClickEvent<T> {
  row: T;
  index: number;
  event: MouseEvent;
}

interface TwRowExpansionChangeEvent<T> {
  row: T;
  expanded: boolean;
  expandedRows: ReadonlySet<T>;
}

interface TwSelectionChangeEvent<T> {
  selected: readonly T[];
  added: readonly T[];
  removed: readonly T[];
  previous: readonly T[];
}

// Shared library types (re-exported from 'ngx-tw/core'):
type TwSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type TwBreakpoint = 'sm' | 'md' | 'lg' | 'xl' | '2xl';`;
}
