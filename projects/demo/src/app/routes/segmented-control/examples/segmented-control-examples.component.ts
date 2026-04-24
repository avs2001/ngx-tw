import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { SegmentedControlComponent, SegmentedControlOptionComponent } from 'ngx-tw/segmented-control';
import type { SegmentedControlRounded, SegmentedControlVariant } from 'ngx-tw/segmented-control';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const VARIANTS: SegmentedControlVariant[] = ['surface', 'filled', 'outline'];
const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const ROUNDED: SegmentedControlRounded[] = ['pill', 'md'];

@Component({
  selector: 'app-segmented-control-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SegmentedControlComponent,
    SegmentedControlOptionComponent,
    ButtonDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input chooses how the active option is visually separated from the rest. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">surface</code>
        for a soft raised pill that sits naturally on neutral backgrounds,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        when the control needs to assert itself as the main action, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        for low-emphasis toolbars where you want a colored ring rather than a solid fill.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <div class="flex items-center gap-3">
              <span class="w-16 text-xs text-fg-muted font-mono">{{ v }}</span>
              <tw-segmented-control [variant]="v" [(value)]="variantValues[v]" [attr.aria-label]="'Variant ' + v">
                <tw-segmented-option value="daily">Daily</tw-segmented-option>
                <tw-segmented-option value="weekly">Weekly</tw-segmented-option>
                <tw-segmented-option value="monthly">Monthly</tw-segmented-option>
              </tw-segmented-control>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Variants compose with colors — an <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        control in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        reads as a "positive" filter chip, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        is the right choice for a prominent tab-style switch.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the active indicator only — the inactive options keep a neutral text
        color so the selection reads at a glance. Pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main switch on a page, use the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors for themed regions (filters on a status dashboard, severity pickers), and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not compete with the surrounding content.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (c of colors; track c) {
            <div class="flex items-center gap-3">
              <span class="w-20 text-xs text-fg-muted font-mono">{{ c }}</span>
              <tw-segmented-control [color]="c" [(value)]="colorValues[c]" [attr.aria-label]="'Color ' + c">
                <tw-segmented-option value="day">Day</tw-segmented-option>
                <tw-segmented-option value="week">Week</tw-segmented-option>
                <tw-segmented-option value="month">Month</tw-segmented-option>
              </tw-segmented-control>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales the padding and font size of each option in lock-step. Match the
        size to neighbouring controls:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        slot into dense toolbars,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        is the default for most page layouts, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>–<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        suit prominent filter bars on dashboards and empty-state prompts.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono">{{ s }}</span>
              <tw-segmented-control [size]="s" [(value)]="sizeValues[s]" [attr.aria-label]="'Size ' + s">
                <tw-segmented-option value="left">Left</tw-segmented-option>
                <tw-segmented-option value="center">Center</tw-segmented-option>
                <tw-segmented-option value="right">Right</tw-segmented-option>
              </tw-segmented-control>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Rounded -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Rounded</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">rounded</code>
        input controls the corner radius of the container and the options. Pick
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pill</code>
        for a softer, more decorative feel that works well in-line with text, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        to match the radius of neighbouring buttons and inputs. Vertical orientation
        forces <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        because pill corners stack awkwardly.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (r of rounded; track r) {
            <div class="flex items-center gap-3">
              <span class="w-12 text-xs text-fg-muted font-mono">{{ r }}</span>
              <tw-segmented-control [rounded]="r" [(value)]="roundedValues[r]" [attr.aria-label]="'Rounded ' + r">
                <tw-segmented-option value="a">Alpha</tw-segmented-option>
                <tw-segmented-option value="b">Beta</tw-segmented-option>
                <tw-segmented-option value="c">Gamma</tw-segmented-option>
              </tw-segmented-control>
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="roundedSnippet" language="html" />
    </section>

    <!-- Orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation="vertical"</code>
        to stack the options into a column — useful in sidebars and compact filter panels.
        The ARIA
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-orientation</code>
        attribute updates accordingly so that screen readers announce arrow-key behaviour
        correctly.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control orientation="vertical" [(value)]="verticalValue" aria-label="Alignment">
          <tw-segmented-option value="top">Top</tw-segmented-option>
          <tw-segmented-option value="middle">Middle</tw-segmented-option>
          <tw-segmented-option value="bottom">Bottom</tw-segmented-option>
        </tw-segmented-control>
      </div>
      <tw-code-block [code]="orientationSnippet" language="html" />
    </section>

    <!-- With Icons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project any markup into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-segmented-option</code>
        — plain text, an icon, or both. Icons follow the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size-4</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">shrink-0</code>
        convention. For icon-only options, always include an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-label</code>
        on the option so assistive technology has something to announce.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control [(value)]="iconValue" aria-label="Layout">
          <tw-segmented-option value="grid">
            <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M4.25 2A2.25 2.25 0 002 4.25v2.5A2.25 2.25 0 004.25 9h2.5A2.25 2.25 0 009 6.75v-2.5A2.25 2.25 0 006.75 2h-2.5zm0 9A2.25 2.25 0 002 13.25v2.5A2.25 2.25 0 004.25 18h2.5A2.25 2.25 0 009 15.75v-2.5A2.25 2.25 0 006.75 11h-2.5zm9-9A2.25 2.25 0 0011 4.25v2.5A2.25 2.25 0 0013.25 9h2.5A2.25 2.25 0 0018 6.75v-2.5A2.25 2.25 0 0015.75 2h-2.5zm0 9A2.25 2.25 0 0011 13.25v2.5A2.25 2.25 0 0013.25 18h2.5A2.25 2.25 0 0018 15.75v-2.5A2.25 2.25 0 0015.75 11h-2.5z" clip-rule="evenodd"/>
            </svg>
            Grid
          </tw-segmented-option>
          <tw-segmented-option value="list">
            <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M2 3.75A.75.75 0 012.75 3h14.5a.75.75 0 010 1.5H2.75A.75.75 0 012 3.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.166a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75zm0 4.167a.75.75 0 01.75-.75h14.5a.75.75 0 010 1.5H2.75a.75.75 0 01-.75-.75z" clip-rule="evenodd"/>
            </svg>
            List
          </tw-segmented-option>
          <tw-segmented-option value="kanban">
            <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M2 4.5A2.5 2.5 0 014.5 2h11A2.5 2.5 0 0118 4.5v11a2.5 2.5 0 01-2.5 2.5h-11A2.5 2.5 0 012 15.5v-11zM4.5 4a.5.5 0 00-.5.5v11a.5.5 0 00.5.5H7V4H4.5zM8.5 4v12h3V4h-3zM13 4v12h2.5a.5.5 0 00.5-.5v-11a.5.5 0 00-.5-.5H13z"/>
            </svg>
            Kanban
          </tw-segmented-option>
        </tw-segmented-control>
      </div>
      <tw-code-block [code]="iconsSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Disabling an individual option keeps it rendered but removes it from keyboard
        navigation and blocks selection — useful for options a user hasn't earned yet
        (a locked "Enterprise" tier, for example). Disabling the whole group blocks all
        interaction but preserves the current selection so the user can still read the
        committed value.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled option</p>
            <tw-segmented-control [(value)]="disabledOptionValue" aria-label="Plan">
              <tw-segmented-option value="free">Free</tw-segmented-option>
              <tw-segmented-option value="pro">Pro</tw-segmented-option>
              <tw-segmented-option value="enterprise" [disabled]="true">Enterprise</tw-segmented-option>
            </tw-segmented-control>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled group</p>
            <tw-segmented-control [(value)]="disabledGroupValue" [disabled]="true" aria-label="Theme">
              <tw-segmented-option value="light">Light</tw-segmented-option>
              <tw-segmented-option value="dark">Dark</tw-segmented-option>
              <tw-segmented-option value="system">System</tw-segmented-option>
            </tw-segmented-control>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The control implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works out of the box. Set the value programmatically with a signal and the
        selection stays in sync; clearing writes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">null</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control
          name="viewTd"
          [(ngModel)]="tdView"
          aria-label="View (template-driven)"
        >
          <tw-segmented-option value="list">List</tw-segmented-option>
          <tw-segmented-option value="grid">Grid</tw-segmented-option>
          <tw-segmented-option value="table">Table</tw-segmented-option>
        </tw-segmented-control>
        <p class="text-xs text-fg-muted mt-3 font-mono">value = {{ tdView() ?? 'null' }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdView.set('grid')">Set grid</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdView.set(null)">Clear</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="tdTsSnippet" language="ts" />
        <tw-code-block [code]="tdHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        and the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>
        and disabled state stay synchronised automatically. Toggling disabled on the
        control also blocks the whole group — no separate
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control [formControl]="reactiveCtrl" aria-label="View">
          <tw-segmented-option value="list">List</tw-segmented-option>
          <tw-segmented-option value="grid">Grid</tw-segmented-option>
          <tw-segmented-option value="table">Table</tw-segmented-option>
        </tw-segmented-control>
        <p class="text-xs text-fg-muted mt-3 font-mono">
          control.value = {{ reactiveCtrl.value ?? 'null' }} · disabled = {{ reactiveCtrl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="reactiveCtrl.setValue('table')">Set table</button>
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="reactiveCtrl.reset()">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs"
                  (click)="toggleDisabled()">
            {{ reactiveCtrl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and bind a field with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        so you can drive UI without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-segmented-control [formField]="signalForm.view" aria-label="View (signal forms)">
          <tw-segmented-option value="list">List</tw-segmented-option>
          <tw-segmented-option value="grid">Grid</tw-segmented-option>
          <tw-segmented-option value="table">Table</tw-segmented-option>
        </tw-segmented-control>
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = {{ signalForm.view().value() ?? 'null' }} ·
          touched = {{ signalForm.view().touched() }} ·
          valid = {{ signalForm.view().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.view().value.set('table')">Set table</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.view().reset()">Reset</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once to preview a specific configuration.
        A good starting point: pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        with a semantic color like
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        to see the filter-chip look, or switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        orientation to see how the component behaves in a sidebar layout.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
            <div class="flex gap-1">
              @for (v of variants; track v) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playVariant() === v"
                        [class.!text-primary-700]="playVariant() === v"
                        (click)="playVariant.set(v)">{{ v }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
            <div class="flex flex-wrap gap-1">
              @for (c of colors; track c) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playColor() === c"
                        [class.!text-primary-700]="playColor() === c"
                        (click)="playColor.set(c)">{{ c }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex gap-1">
              @for (s of sizes; track s) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playSize() === s"
                        [class.!text-primary-700]="playSize() === s"
                        (click)="playSize.set(s)">{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Rounded</label>
            <div class="flex gap-1">
              @for (r of rounded; track r) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playRounded() === r"
                        [class.!text-primary-700]="playRounded() === r"
                        (click)="playRounded.set(r)">{{ r }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playVertical()"
                      [class.!text-primary-700]="playVertical()"
                      (click)="playVertical.update(v => !v)">vertical</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-segmented-control
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [rounded]="playRounded()"
            [orientation]="playVertical() ? 'vertical' : 'horizontal'"
            [disabled]="playDisabled()"
            [(value)]="playValue"
            aria-label="Playground"
          >
            <tw-segmented-option value="one">One</tw-segmented-option>
            <tw-segmented-option value="two">Two</tw-segmented-option>
            <tw-segmented-option value="three">Three</tw-segmented-option>
          </tw-segmented-control>
          <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ playValue() ?? 'null' }}</p>
        </div>
      </div>
    </section>
  `,
})
export class SegmentedControlExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly rounded = ROUNDED;

  protected readonly variantValues: Record<SegmentedControlVariant, WritableSignal<string | null>> = {
    surface: signal<string | null>('daily'),
    filled: signal<string | null>('weekly'),
    outline: signal<string | null>('monthly'),
  };

  protected readonly colorValues: Record<TwColor, WritableSignal<string | null>> = {
    primary: signal<string | null>('day'),
    secondary: signal<string | null>('week'),
    accent: signal<string | null>('month'),
    neutral: signal<string | null>('day'),
    info: signal<string | null>('week'),
    success: signal<string | null>('month'),
    warning: signal<string | null>('day'),
    error: signal<string | null>('week'),
  };

  protected readonly sizeValues: Record<TwSize, WritableSignal<string | null>> = {
    xs: signal<string | null>('left'),
    sm: signal<string | null>('center'),
    md: signal<string | null>('right'),
    lg: signal<string | null>('left'),
    xl: signal<string | null>('center'),
  };

  protected readonly roundedValues: Record<SegmentedControlRounded, WritableSignal<string | null>> = {
    pill: signal<string | null>('a'),
    md: signal<string | null>('b'),
  };

  protected readonly verticalValue = signal<string | null>('top');
  protected readonly iconValue = signal<string | null>('grid');
  protected readonly disabledOptionValue = signal<string | null>('free');
  protected readonly disabledGroupValue = signal<string | null>('light');

  // Forms
  protected readonly tdView = signal<string | null>('list');
  protected readonly reactiveCtrl = new FormControl<string | null>('grid');

  protected readonly signalModel = signal<{ view: string | null }>({ view: 'list' });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.view);
  });

  // Playground
  protected readonly playVariant = signal<SegmentedControlVariant>('surface');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playRounded = signal<SegmentedControlRounded>('pill');
  protected readonly playVertical = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playValue = signal<string | null>('one');

  protected toggleDisabled(): void {
    if (this.reactiveCtrl.disabled) this.reactiveCtrl.enable();
    else this.reactiveCtrl.disable();
  }

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-segmented-control [variant]="v" [(value)]="variantValues[v]" [attr.aria-label]="'Variant ' + v">
    <tw-segmented-option value="daily">Daily</tw-segmented-option>
    <tw-segmented-option value="weekly">Weekly</tw-segmented-option>
    <tw-segmented-option value="monthly">Monthly</tw-segmented-option>
  </tw-segmented-control>
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-segmented-control [color]="c" [(value)]="colorValues[c]" [attr.aria-label]="'Color ' + c">
    <tw-segmented-option value="day">Day</tw-segmented-option>
    <tw-segmented-option value="week">Week</tw-segmented-option>
    <tw-segmented-option value="month">Month</tw-segmented-option>
  </tw-segmented-control>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-segmented-control [size]="s" [(value)]="sizeValues[s]" [attr.aria-label]="'Size ' + s">
    <tw-segmented-option value="left">Left</tw-segmented-option>
    <tw-segmented-option value="center">Center</tw-segmented-option>
    <tw-segmented-option value="right">Right</tw-segmented-option>
  </tw-segmented-control>
}`.trim();

  protected readonly roundedSnippet = `
@for (r of rounded; track r) {
  <tw-segmented-control [rounded]="r" [(value)]="roundedValues[r]" [attr.aria-label]="'Rounded ' + r">
    <tw-segmented-option value="a">Alpha</tw-segmented-option>
    <tw-segmented-option value="b">Beta</tw-segmented-option>
    <tw-segmented-option value="c">Gamma</tw-segmented-option>
  </tw-segmented-control>
}`.trim();

  protected readonly orientationSnippet = `<tw-segmented-control
  orientation="vertical"
  [(value)]="view"
  aria-label="Alignment"
>
  <tw-segmented-option value="top">Top</tw-segmented-option>
  <tw-segmented-option value="middle">Middle</tw-segmented-option>
  <tw-segmented-option value="bottom">Bottom</tw-segmented-option>
</tw-segmented-control>`;

  protected readonly iconsSnippet = `<tw-segmented-control [(value)]="layout" aria-label="Layout">
  <tw-segmented-option value="grid">
    <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    Grid
  </tw-segmented-option>
  <tw-segmented-option value="list">
    <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    List
  </tw-segmented-option>
  <tw-segmented-option value="kanban">
    <svg class="size-4 shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    Kanban
  </tw-segmented-option>
</tw-segmented-control>`;

  protected readonly statesSnippet = `<!-- Disabled option -->
<tw-segmented-control [(value)]="plan" aria-label="Plan">
  <tw-segmented-option value="free">Free</tw-segmented-option>
  <tw-segmented-option value="pro">Pro</tw-segmented-option>
  <tw-segmented-option value="enterprise" [disabled]="true">Enterprise</tw-segmented-option>
</tw-segmented-control>

<!-- Disabled group -->
<tw-segmented-control [(value)]="theme" [disabled]="true" aria-label="Theme">
  <tw-segmented-option value="light">Light</tw-segmented-option>
  <tw-segmented-option value="dark">Dark</tw-segmented-option>
  <tw-segmented-option value="system">System</tw-segmented-option>
</tw-segmented-control>`;

  protected readonly tdTsSnippet = `protected readonly view = signal<string | null>('list');`;

  protected readonly tdHtmlSnippet = `<tw-segmented-control
  name="view"
  [(ngModel)]="view"
  aria-label="View"
>
  <tw-segmented-option value="list">List</tw-segmented-option>
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="table">Table</tw-segmented-option>
</tw-segmented-control>`;

  protected readonly reactiveTsSnippet = `protected readonly viewCtrl = new FormControl<string | null>('grid');`;

  protected readonly reactiveHtmlSnippet = `<tw-segmented-control [formControl]="viewCtrl" aria-label="View">
  <tw-segmented-option value="list">List</tw-segmented-option>
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="table">Table</tw-segmented-option>
</tw-segmented-control>`;

  protected readonly signalTsSnippet = `protected readonly model = signal<{ view: string | null }>({ view: 'list' });
protected readonly viewForm = form(this.model, (p) => {
  required(p.view);
});`;

  protected readonly signalHtmlSnippet = `<tw-segmented-control [formField]="viewForm.view" aria-label="View">
  <tw-segmented-option value="list">List</tw-segmented-option>
  <tw-segmented-option value="grid">Grid</tw-segmented-option>
  <tw-segmented-option value="table">Table</tw-segmented-option>
</tw-segmented-control>`;
}
