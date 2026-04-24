import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { RadioComponent, RadioGroupComponent } from 'ngx-tw/radio';
import type { RadioOrientation, RadioVariant } from 'ngx-tw/radio';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor, TwSize } from 'ngx-tw/core';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const VARIANTS: RadioVariant[] = ['solid', 'outline'];
const ORIENTATIONS: RadioOrientation[] = ['vertical', 'horizontal'];

@Component({
  selector: 'app-radio-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RadioComponent,
    RadioGroupComponent,
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
        input changes how the selected indicator is drawn.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        fills the dot against a matching colored ring and reads as the strongest affirmative state —
        use it for primary selections.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        keeps the dot visible with a lighter visual weight and works well when radios sit inside
        busy content where a solid fill would compete with surrounding accents.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Solid (default)</p>
          <tw-radio-group [(value)]="solidValue" orientation="horizontal" variant="solid" aria-label="Solid variant">
            <tw-radio value="a" label="Option A" />
            <tw-radio value="b" label="Option B" />
            <tw-radio value="c" label="Option C" />
          </tw-radio-group>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Outline</p>
          <tw-radio-group [(value)]="outlineValue" orientation="horizontal" variant="outline" aria-label="Outline variant">
            <tw-radio value="a" label="Option A" />
            <tw-radio value="b" label="Option B" />
            <tw-radio value="c" label="Option C" />
          </tw-radio-group>
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the selected ring and dot. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main call to action, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the selection communicates status, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not pull focus.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="colorValue" orientation="horizontal" aria-label="Colors">
          @for (c of colors; track c) {
            <tw-radio [value]="c" [color]="c" [label]="c" />
          }
        </tw-radio-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">selected = {{ colorValue() ?? 'null' }}</p>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls the circle diameter, dot size, and label font scale together. Match
        neighboring controls — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        radio fits inline with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inputs in a compact form, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        reads well inside a prominent pricing or plan-picker card.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="sizeValue" orientation="horizontal" aria-label="Sizes">
          @for (s of sizes; track s) {
            <tw-radio [value]="s" [size]="s" [label]="s" />
          }
        </tw-radio-group>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Orientation drives both the layout axis and the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-orientation</code>
        attribute.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        is the default and suits descriptions or longer labels; reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">horizontal</code>
        when the choices are short, obvious, and benefit from sitting side-by-side. Arrow-key
        navigation adapts automatically to the layout axis.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 grid gap-6 md:grid-cols-2">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Vertical (default)</p>
          <tw-radio-group [(value)]="verticalValue" orientation="vertical" aria-label="Vertical">
            <tw-radio value="low" label="Low" />
            <tw-radio value="med" label="Medium" />
            <tw-radio value="high" label="High" />
          </tw-radio-group>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Horizontal</p>
          <tw-radio-group [(value)]="horizontalValue" orientation="horizontal" aria-label="Horizontal">
            <tw-radio value="low" label="Low" />
            <tw-radio value="med" label="Medium" />
            <tw-radio value="high" label="High" />
          </tw-radio-group>
        </div>
      </div>
      <tw-code-block [code]="orientationSnippet" language="html" />
    </section>

    <!-- Description -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">description</code>
        input for short helper text below each label, or project rich content into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="description"]</code>
        slot when you need links or inline formatting. Descriptions pair well with vertical
        orientation so the text has room to breathe.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="billingValue" color="success" aria-label="Billing cycle">
          <tw-radio value="monthly" label="Monthly" description="Billed every month" />
          <tw-radio value="annual" label="Annual" description="Save 20% with yearly billing" />
          <tw-radio value="lifetime" label="Lifetime" description="One-time payment, forever" />
        </tw-radio-group>
      </div>
      <tw-code-block [code]="descriptionSnippet" language="html" />
    </section>

    <!-- Label Position -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Label Position</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelPosition="after"</code>
        is the default and the right choice in almost every case. Flip to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"before"</code>
        only when the radio sits in the trailing cell of a layout where the controls must line up
        vertically along the right edge — for example, a settings table where labels are the primary
        column.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="labelPositionValue" aria-label="Label position">
          <tw-radio value="after" label="Label after (default)" labelPosition="after" />
          <tw-radio value="before" label="Label before" labelPosition="before" />
        </tw-radio-group>
      </div>
      <tw-code-block [code]="labelPositionSnippet" language="html" />
    </section>

    <!-- Per-radio overrides -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Per-Radio Overrides</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Group defaults cascade to every child, but individual radios may override
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>.
        Overrides are most useful for severity-based option sets — keep the common options neutral
        and tint only the high-stakes choice with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="priorityValue" aria-label="Priority">
          <tw-radio value="low" label="Low priority" />
          <tw-radio value="med" label="Medium priority" color="warning" />
          <tw-radio value="high" label="High priority" color="error" variant="outline" />
        </tw-radio-group>
      </div>
      <tw-code-block [code]="overridesSnippet" language="html" />
    </section>

    <!-- Custom Dot Glyph -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Dot Glyph</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project any element into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="dot"]</code>
        slot to replace the default filled circle — typically a small icon that reinforces the
        meaning of the option. Keep glyphs inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size-full</code>
        container so they scale with the size input, and step up to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size="lg"</code>
        or larger so the detail is readable.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [(value)]="dotValue" color="accent" size="lg" aria-label="Custom dots">
          <tw-radio value="star" label="Star" color="warning">
            <svg slot="dot" viewBox="0 0 20 20" fill="currentColor" class="size-full text-warning-500" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.376 2.454a1 1 0 00-.363 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.376-2.454a1 1 0 00-1.175 0l-3.376 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z"/>
            </svg>
          </tw-radio>
          <tw-radio value="heart" label="Heart" color="error">
            <svg slot="dot" viewBox="0 0 20 20" fill="currentColor" class="size-full text-error-500" aria-hidden="true">
              <path fill-rule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clip-rule="evenodd"/>
            </svg>
          </tw-radio>
          <tw-radio value="check" label="Check" color="success">
            <svg slot="dot" viewBox="0 0 20 20" fill="currentColor" class="size-full text-success-600" aria-hidden="true">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
            </svg>
          </tw-radio>
        </tw-radio-group>
      </div>
      <tw-code-block [code]="dotSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Disabled cascades as an OR: the group's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]="true"</code>
        locks every child and blocks keyboard navigation entirely, while disabling individual
        radios leaves the rest of the group reachable by arrow keys (the disabled entries are
        skipped automatically).
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        on the group so assistive tech announces the constraint.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 grid gap-6 md:grid-cols-2">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Whole group disabled</p>
          <tw-radio-group [value]="'a'" [disabled]="true" aria-label="Locked group">
            <tw-radio value="a" label="Option A" />
            <tw-radio value="b" label="Option B" />
            <tw-radio value="c" label="Option C" />
          </tw-radio-group>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Individual radio disabled</p>
          <tw-radio-group [(value)]="mixedValue" aria-label="Mixed disabled">
            <tw-radio value="a" label="Available" />
            <tw-radio value="b" label="Unavailable" [disabled]="true" />
            <tw-radio value="c" label="Available" />
          </tw-radio-group>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
          <tw-radio-group [(value)]="requiredValue" [required]="true" aria-label="Required group">
            <tw-radio value="yes" label="Yes" />
            <tw-radio value="no" label="No" />
          </tw-radio-group>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Standalone -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Standalone Radio</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A single
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">tw-radio</code>
        without a parent group behaves as a one-shot boolean — once checked, it cannot be toggled
        off from the UI, matching native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input type="radio"&gt;</code>.
        Use this for acknowledgements or single-step confirmations; for anything else, a
        <a routerLink="/components/checkbox" class="text-primary-600 hover:underline">Checkbox</a>
        is a better fit.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio [(checked)]="standaloneValue" label="I confirm this action" color="info" />
        <p class="text-xs text-fg-muted mt-4 font-mono">checked = {{ standaloneValue() }}</p>
      </div>
      <tw-code-block [code]="standaloneSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind the group with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        and give it a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">name</code>
        so Angular's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgForm</code>
        picks it up. Individual radios do not need a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">name</code>
        — the group propagates one to every child for HTML form semantics.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group name="color-td" [(ngModel)]="tdColor" aria-label="Favorite color">
          <tw-radio value="red" label="Red" />
          <tw-radio value="green" label="Green" />
          <tw-radio value="blue" label="Blue" />
        </tw-radio-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = {{ tdColor() ?? 'null' }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdColor.set('green')">Set green</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdColor.set(null)">Clear</button>
        </div>
      </div>
      <tw-code-block [code]="ngModelTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="ngModelHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>
        and drive everything from the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        API —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">setValue</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reset</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable</code>
        all propagate through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [formControl]="shippingControl" aria-label="Shipping method">
          <tw-radio value="standard" label="Standard" description="3–5 business days" />
          <tw-radio value="express" label="Express" description="Arrives tomorrow" />
          <tw-radio value="pickup" label="In-store pickup" description="Ready in 2 hours" />
        </tw-radio-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">
          control.value = {{ shippingControl.value ?? 'null' }} · touched = {{ shippingControl.touched }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="shippingControl.setValue('express')">Set express</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="shippingControl.reset()">Reset</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleShippingDisabled()">
            {{ shippingControl.disabled ? 'Enable' : 'Disable' }}
          </button>
        </div>
      </div>
      <tw-code-block [code]="reactiveTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21 signal forms attach through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>
        — the field signal stays in sync with the group and exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        as signals you can read anywhere in the template.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-radio-group [formField]="signalForm.plan" aria-label="Subscription plan">
          <tw-radio value="free" label="Free" description="Basic features, no cost" />
          <tw-radio value="pro" label="Pro" description="Everything in Free, plus advanced tools" />
          <tw-radio value="team" label="Team" description="Pro features for up to 10 seats" />
        </tw-radio-group>
        <p class="text-xs text-fg-muted mt-4 font-mono">
          value = {{ signalForm.plan().value() ?? 'null' }} ·
          touched = {{ signalForm.plan().touched() }} ·
          valid = {{ signalForm.plan().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.plan().value.set('pro')">Set pro</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.plan().reset()">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="signalTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once to see how the group responds. Start by flipping the
        appearance cluster (color / size / variant), then try the layout axis, and finally toggle
        the state flags to see how the group announces
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>.
        Tab into the group and use the arrow keys to test keyboard navigation.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Color</label>
                <div class="flex flex-wrap gap-1">
                  @for (c of colors; track c) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playColor() === c"
                      [class.!text-primary-700]="playColor() === c"
                      (click)="playColor.set(c)"
                    >{{ c }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
                <div class="flex gap-1">
                  @for (s of sizes; track s) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playSize() === s"
                      [class.!text-primary-700]="playSize() === s"
                      (click)="playSize.set(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Variant</label>
                <div class="flex gap-1">
                  @for (v of variants; track v) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playVariant() === v"
                      [class.!text-primary-700]="playVariant() === v"
                      (click)="playVariant.set(v)"
                    >{{ v }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Layout</p>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Orientation</label>
              <div class="flex gap-1">
                @for (o of orientations; track o) {
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playOrientation() === o"
                    [class.!text-primary-700]="playOrientation() === o"
                    (click)="playOrientation.set(o)"
                  >{{ o }}</button>
                }
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">State</p>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playRequired()"
                [class.!text-primary-700]="playRequired()"
                (click)="playRequired.update(v => !v)"
              >required</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDescription()"
                [class.!text-primary-700]="playDescription()"
                (click)="playDescription.update(v => !v)"
              >description</button>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-radio-group
            [color]="playColor()"
            [size]="playSize()"
            [variant]="playVariant()"
            [orientation]="playOrientation()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            [(value)]="playValue"
            aria-label="Playground"
          >
            <tw-radio value="one" label="Option one" [description]="playDescription() ? 'First option with a little bit of extra context' : undefined" />
            <tw-radio value="two" label="Option two" [description]="playDescription() ? 'Second option, also with context' : undefined" />
            <tw-radio value="three" label="Option three" [description]="playDescription() ? 'Third option to round it out' : undefined" />
          </tw-radio-group>
          <p class="text-xs text-fg-muted mt-4 font-mono">
            value = {{ playValue() ?? 'null' }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class RadioExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly variants = VARIANTS;
  protected readonly orientations = ORIENTATIONS;

  protected readonly colorValue = signal<string | null>('primary');
  protected readonly sizeValue = signal<string | null>('md');
  protected readonly solidValue = signal<string | null>('a');
  protected readonly outlineValue = signal<string | null>('b');
  protected readonly verticalValue = signal<string | null>('med');
  protected readonly horizontalValue = signal<string | null>('med');
  protected readonly billingValue = signal<string | null>('annual');
  protected readonly priorityValue = signal<string | null>('med');
  protected readonly labelPositionValue = signal<string | null>('after');
  protected readonly dotValue = signal<string | null>('star');
  protected readonly mixedValue = signal<string | null>('a');
  protected readonly requiredValue = signal<string | null>(null);
  protected readonly standaloneValue = signal(false);

  protected readonly tdColor = signal<string | null>('red');

  protected readonly shippingControl = new FormControl<string | null>('standard');

  protected readonly signalModel = signal<{ plan: string | null }>({ plan: null });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.plan);
  });

  protected toggleShippingDisabled(): void {
    if (this.shippingControl.disabled) {
      this.shippingControl.enable();
    } else {
      this.shippingControl.disable();
    }
  }

  // Playground
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playVariant = signal<RadioVariant>('solid');
  protected readonly playOrientation = signal<RadioOrientation>('vertical');
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playDescription = signal(false);
  protected readonly playValue = signal<string | null>('one');

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly variantsSnippet = `<tw-radio-group variant="solid" aria-label="Solid variant">
  <tw-radio value="a" label="Option A" />
  <tw-radio value="b" label="Option B" />
  <tw-radio value="c" label="Option C" />
</tw-radio-group>

<tw-radio-group variant="outline" aria-label="Outline variant">
  <tw-radio value="a" label="Option A" />
  <tw-radio value="b" label="Option B" />
  <tw-radio value="c" label="Option C" />
</tw-radio-group>`;

  protected readonly colorsSnippet = `<tw-radio-group [(value)]="colorValue" orientation="horizontal" aria-label="Colors">
  @for (c of colors; track c) {
    <tw-radio [value]="c" [color]="c" [label]="c" />
  }
</tw-radio-group>`;

  protected readonly sizesSnippet = `<tw-radio-group [(value)]="sizeValue" orientation="horizontal" aria-label="Sizes">
  @for (s of sizes; track s) {
    <tw-radio [value]="s" [size]="s" [label]="s" />
  }
</tw-radio-group>`;

  protected readonly orientationSnippet = `<tw-radio-group orientation="vertical" aria-label="Vertical">
  <tw-radio value="low" label="Low" />
  <tw-radio value="med" label="Medium" />
  <tw-radio value="high" label="High" />
</tw-radio-group>

<tw-radio-group orientation="horizontal" aria-label="Horizontal">
  <tw-radio value="low" label="Low" />
  <tw-radio value="med" label="Medium" />
  <tw-radio value="high" label="High" />
</tw-radio-group>`;

  protected readonly descriptionSnippet = `<tw-radio-group [(value)]="billing" color="success" aria-label="Billing cycle">
  <tw-radio value="monthly"  label="Monthly"  description="Billed every month" />
  <tw-radio value="annual"   label="Annual"   description="Save 20% with yearly billing" />
  <tw-radio value="lifetime" label="Lifetime" description="One-time payment, forever" />
</tw-radio-group>`;

  protected readonly labelPositionSnippet = `<tw-radio-group [(value)]="labelPos" aria-label="Label position">
  <tw-radio value="after"  label="Label after (default)" labelPosition="after" />
  <tw-radio value="before" label="Label before"         labelPosition="before" />
</tw-radio-group>`;

  protected readonly overridesSnippet = `<tw-radio-group [(value)]="priority" aria-label="Priority">
  <tw-radio value="low"  label="Low priority" />
  <tw-radio value="med"  label="Medium priority" color="warning" />
  <tw-radio value="high" label="High priority"   color="error" variant="outline" />
</tw-radio-group>`;

  protected readonly dotSnippet = `<tw-radio-group [(value)]="dot" color="accent" size="lg" aria-label="Custom dots">
  <tw-radio value="star" label="Star" color="warning">
    <svg slot="dot" viewBox="0 0 20 20" fill="currentColor" class="size-full text-warning-500" aria-hidden="true">
      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.966a1 1 0 00.95.69h4.175c.969 0 1.371 1.24.588 1.81l-3.376 2.454a1 1 0 00-.363 1.118l1.287 3.966c.3.922-.755 1.688-1.54 1.118l-3.376-2.454a1 1 0 00-1.175 0l-3.376 2.454c-.784.57-1.838-.196-1.539-1.118l1.287-3.966a1 1 0 00-.364-1.118L2.05 9.393c-.783-.57-.38-1.81.588-1.81h4.175a1 1 0 00.95-.69l1.286-3.966z"/>
    </svg>
  </tw-radio>
  <!-- …more radios with custom glyphs -->
</tw-radio-group>`;

  protected readonly statesSnippet = `<!-- Whole group disabled -->
<tw-radio-group [value]="'a'" [disabled]="true" aria-label="Locked group">
  <tw-radio value="a" label="Option A" />
  <tw-radio value="b" label="Option B" />
  <tw-radio value="c" label="Option C" />
</tw-radio-group>

<!-- Individual radio disabled — arrow keys skip it -->
<tw-radio-group [(value)]="mixed" aria-label="Mixed disabled">
  <tw-radio value="a" label="Available" />
  <tw-radio value="b" label="Unavailable" [disabled]="true" />
  <tw-radio value="c" label="Available" />
</tw-radio-group>

<!-- Required -->
<tw-radio-group [(value)]="answer" [required]="true" aria-label="Required group">
  <tw-radio value="yes" label="Yes" />
  <tw-radio value="no"  label="No" />
</tw-radio-group>`;

  protected readonly standaloneSnippet = `<tw-radio [(checked)]="confirmed" label="I confirm this action" color="info" />`;

  protected readonly ngModelTsSnippet = `protected readonly tdColor = signal<string | null>('red');`;

  protected readonly ngModelHtmlSnippet = `<tw-radio-group name="color-td" [(ngModel)]="tdColor" aria-label="Favorite color">
  <tw-radio value="red"   label="Red" />
  <tw-radio value="green" label="Green" />
  <tw-radio value="blue"  label="Blue" />
</tw-radio-group>`;

  protected readonly reactiveTsSnippet = `protected readonly shippingControl = new FormControl<string | null>('standard');`;

  protected readonly reactiveHtmlSnippet = `<tw-radio-group [formControl]="shippingControl" aria-label="Shipping method">
  <tw-radio value="standard" label="Standard"       description="3–5 business days" />
  <tw-radio value="express"  label="Express"        description="Arrives tomorrow" />
  <tw-radio value="pickup"   label="In-store pickup" description="Ready in 2 hours" />
</tw-radio-group>`;

  protected readonly signalTsSnippet = `protected readonly signalModel = signal<{ plan: string | null }>({ plan: null });
protected readonly signalForm = form(this.signalModel, (p) => {
  required(p.plan);
});`;

  protected readonly signalHtmlSnippet = `<tw-radio-group [formField]="signalForm.plan" aria-label="Subscription plan">
  <tw-radio value="free" label="Free" description="Basic features, no cost" />
  <tw-radio value="pro"  label="Pro"  description="Everything in Free, plus advanced tools" />
  <tw-radio value="team" label="Team" description="Pro features for up to 10 seats" />
</tw-radio-group>`;
}
