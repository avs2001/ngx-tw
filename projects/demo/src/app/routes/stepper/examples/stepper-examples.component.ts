import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  StepperComponent,
  StepComponent,
  StepLabelDirective,
  StepperIconDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  type StepperVariant,
} from '@cdevhub/ngx-tw/stepper';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { InputDirective } from '@cdevhub/ngx-tw/input';
import { FormFieldComponent, LabelDirective } from '@cdevhub/ngx-tw/form-field';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

const VARIANTS: StepperVariant[] = ['default', 'dot', 'simple'];
const COLORS: TwColor[] = [
  'primary',
  'secondary',
  'accent',
  'neutral',
  'info',
  'success',
  'warning',
  'error',
];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-stepper-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    StepperComponent,
    StepComponent,
    StepLabelDirective,
    StepperIconDirective,
    StepperNextDirective,
    StepperPreviousDirective,
    ButtonDirective,
    ReactiveFormsModule,
    InputDirective,
    FormFieldComponent,
    LabelDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Variants change how the step indicator reads without changing what the
        component does. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>
        when step labels and descriptions carry meaning for the user,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dot</code>
        for a compact indicator strip inside dense toolbars or cards, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">simple</code>
        when the labels are redundant with the panel's own heading and should only
        be surfaced to assistive tech.
      </p>
      <div class="space-y-6">
        @for (v of variants; track v) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ v }}</p>
            <div class="rounded-lg border border-border p-6 bg-surface-raised">
              <tw-stepper
                [variant]="v"
                [selectedIndex]="variantIndex[v]()"
                (selectedIndexChange)="variantIndex[v].set($event)"
              >
                <tw-step label="Create" description="Start a new project">
                  <p class="text-sm text-fg-muted">Pick a name and a template.</p>
                </tw-step>
                <tw-step label="Configure" description="Settings and options">
                  <p class="text-sm text-fg-muted">Dial in the details.</p>
                </tw-step>
                <tw-step label="Deploy" description="Ship it">
                  <p class="text-sm text-fg-muted">Ready to go live.</p>
                </tw-step>
              </tw-stepper>
            </div>
          </div>
        }
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" class="mt-4" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">simple</code>
        variant still renders labels — it just hides them visually with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sr-only</code>.
        Every step still needs a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        (or a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twStepLabel</code>
        template) so screen readers have something to announce.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Color tints active and completed indicators, labels, and the connectors
        between reached steps. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main flow on a page, the semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        colors when the stepper drives a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for secondary wizards that should not compete with other calls to action.
      </p>
      <div class="space-y-4">
        @for (c of colors; track c) {
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <p class="text-xs font-medium text-fg-muted mb-3 uppercase tracking-wide">{{ c }}</p>
            <tw-stepper
              [color]="c"
              [selectedIndex]="colorIndex[c]()"
              (selectedIndexChange)="colorIndex[c].set($event)"
            >
              <tw-step label="Plan"><p class="text-sm text-fg-muted">Plan the work.</p></tw-step>
              <tw-step label="Build"><p class="text-sm text-fg-muted">Do the work.</p></tw-step>
              <tw-step label="Ship"><p class="text-sm text-fg-muted">Ship the work.</p></tw-step>
            </tw-stepper>
          </div>
        }
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" class="mt-4" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size controls indicator diameter, label typography, and connector weight.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        match standard form density,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        fits inside a toolbar or card header, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        suit a hero wizard on an onboarding page.
      </p>
      <div class="space-y-4">
        @for (s of sizes; track s) {
          <div class="rounded-lg border border-border p-6 bg-surface-raised">
            <p class="text-xs font-medium text-fg-muted mb-3 uppercase tracking-wide">{{ s }}</p>
            <tw-stepper
              [size]="s"
              [selectedIndex]="sizeIndex[s]()"
              (selectedIndexChange)="sizeIndex[s].set($event)"
            >
              <tw-step label="Alpha"><p class="text-sm text-fg-muted">Alpha content.</p></tw-step>
              <tw-step label="Beta"><p class="text-sm text-fg-muted">Beta content.</p></tw-step>
              <tw-step label="Gamma"><p class="text-sm text-fg-muted">Gamma content.</p></tw-step>
            </tw-stepper>
          </div>
        }
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" class="mt-4" />
    </section>

    <!-- Vertical orientation -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Vertical orientation</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">orientation="vertical"</code>
        when the panels are long enough that a horizontal strip would push the
        current content below the fold — typically onboarding flows with forms or
        multi-paragraph explanations. In vertical mode each panel renders inline
        directly under its step header.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          orientation="vertical"
          [selectedIndex]="verticalIndex()"
          (selectedIndexChange)="verticalIndex.set($event)"
        >
          <tw-step label="Upload files" description="Drop anything in">
            <p class="text-sm text-fg-muted mb-3">Upload a collection of files to process.</p>
            <button twButton twStepperNext size="sm">Next</button>
          </tw-step>
          <tw-step label="Transcode" description="Media pipeline">
            <p class="text-sm text-fg-muted mb-3">Run the transcoder over your uploads.</p>
            <div class="flex gap-2">
              <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
              <button twButton twStepperNext size="sm">Next</button>
            </div>
          </tw-step>
          <tw-step label="Publish" description="Make it live">
            <p class="text-sm text-fg-muted mb-3">Ready to publish to the world.</p>
            <div class="flex gap-2">
              <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
              <button twButton color="success" size="sm">Publish</button>
            </div>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="verticalSnippet" language="html" />
    </section>

    <!-- Linear mode with reactive forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Linear mode with reactive forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Add the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linear</code>
        attribute and give each gating step a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[stepControl]</code>
        bound to any
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">AbstractControl</code>
        — a reactive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>,
        a template-driven
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgModel</code>,
        or a signal-form field. CDK blocks advancement while the control is
        invalid, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStepperNext]</code>
        becomes a no-op for the user.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          linear
          [selectedIndex]="linearIndex()"
          (selectedIndexChange)="linearIndex.set($event)"
        >
          <tw-step label="Email" [stepControl]="emailControl" errorMessage="Enter a valid email">
            <tw-form-field class="mb-3 block">
              <label twLabel>Email</label>
              <input twInput type="email" [formControl]="emailControl" placeholder="you@example.com" />
            </tw-form-field>
            <button twButton twStepperNext size="sm">Next</button>
          </tw-step>
          <tw-step label="Password" [stepControl]="passwordControl" errorMessage="Password must be 8+ chars">
            <tw-form-field class="mb-3 block">
              <label twLabel>Password</label>
              <input twInput type="password" [formControl]="passwordControl" placeholder="••••••••" />
            </tw-form-field>
            <div class="flex gap-2">
              <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
              <button twButton twStepperNext size="sm">Next</button>
            </div>
          </tw-step>
          <tw-step label="Confirm">
            <p class="text-sm text-fg-muted mb-3">All set. Click submit to finish.</p>
            <div class="flex gap-2">
              <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
              <button twButton color="success" size="sm">Submit</button>
            </div>
          </tw-step>
        </tw-stepper>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="linearTsSnippet" language="ts" />
        <tw-code-block [code]="linearHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Error state -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Error state</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[hasError]="true"</code>
        on a step to render the error indicator, color the connector, and emit
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-invalid</code>
        on the header. Pair it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorMessage</code>
        — the message is placed in a visually hidden element so screen readers
        read it when focus lands on the step.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          [selectedIndex]="errorIndex()"
          (selectedIndexChange)="errorIndex.set($event)"
        >
          <tw-step label="Connect" [hasError]="true" errorMessage="Could not reach the server">
            <p class="text-sm text-fg-muted mb-3">There was a problem connecting. Check your network.</p>
          </tw-step>
          <tw-step label="Verify">
            <p class="text-sm text-fg-muted">Verification step.</p>
          </tw-step>
          <tw-step label="Done">
            <p class="text-sm text-fg-muted">All finished.</p>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="errorSnippet" language="html" />
    </section>

    <!-- Optional step -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Optional step</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        In linear mode, add
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">optional</code>
        to a step to let users advance past it without completing its
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stepControl</code>.
        The header gets an "(Optional)" hint while the step is incomplete; once
        the user actually enters data, the hint disappears.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          linear
          [selectedIndex]="optionalIndex()"
          (selectedIndexChange)="optionalIndex.set($event)"
        >
          <tw-step label="Basics">
            <p class="text-sm text-fg-muted mb-3">Required setup.</p>
            <button twButton twStepperNext size="sm">Next</button>
          </tw-step>
          <tw-step label="Extras" optional>
            <p class="text-sm text-fg-muted mb-3">Optional extras — skip anytime.</p>
            <div class="flex gap-2">
              <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
              <button twButton twStepperNext size="sm">Skip / Next</button>
            </div>
          </tw-step>
          <tw-step label="Review">
            <p class="text-sm text-fg-muted">Review and submit.</p>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="optionalSnippet" language="html" />
    </section>

    <!-- Custom icons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template twStepperIcon&gt;</code>
        inside a step to replace the default indicator glyph. Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[state]</code>
        to scope the override to a specific indicator state —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'number'</code>
        (pending/active),
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'done'</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'edit'</code>, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'error'</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          color="accent"
          [selectedIndex]="iconIndex()"
          (selectedIndexChange)="iconIndex.set($event)"
        >
          <tw-step label="Upload">
            <ng-template twStepperIcon state="number">
              <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-.5V5.5A4.5 4.5 0 0 0 10 1zm3 8V5.5a3 3 0 1 0-6 0V9h6z" clip-rule="evenodd"/>
              </svg>
            </ng-template>
            <p class="text-sm text-fg-muted">Pick files to upload.</p>
          </tw-step>
          <tw-step label="Process">
            <ng-template twStepperIcon state="number">
              <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm3.857-9.809a.75.75 0 0 0-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 1 0-1.06 1.061l2.5 2.5a.75.75 0 0 0 1.137-.089l4-5.5z" clip-rule="evenodd"/>
              </svg>
            </ng-template>
            <p class="text-sm text-fg-muted">Processing…</p>
          </tw-step>
          <tw-step label="Deliver">
            <ng-template twStepperIcon state="number">
              <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path d="M3.105 2.289a.75.75 0 0 0-.826.95l1.414 4.926A1.5 1.5 0 0 0 5.135 9.25h6.115a.75.75 0 0 1 0 1.5H5.135a1.5 1.5 0 0 0-1.442 1.085l-1.414 4.926a.75.75 0 0 0 .826.95 28.897 28.897 0 0 0 15.293-7.155.75.75 0 0 0 0-1.114A28.897 28.897 0 0 0 3.105 2.289z"/>
              </svg>
            </ng-template>
            <p class="text-sm text-fg-muted">Delivered.</p>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="customIconsSnippet" language="html" />
    </section>

    <!-- Custom labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom labels</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template twStepLabel&gt;</code>
        inside a step to replace the plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        string with arbitrary markup — useful for badges, secondary metadata, or
        translated rich text. Steps without a template fall back to the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        input, so you can mix both forms in the same stepper.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          [selectedIndex]="labelIndex()"
          (selectedIndexChange)="labelIndex.set($event)"
        >
          <tw-step>
            <ng-template twStepLabel>
              <span class="font-semibold text-primary-fg">Step one</span>
              <span class="text-xs text-fg-muted ml-1">— required</span>
            </ng-template>
            <p class="text-sm text-fg-muted">Custom label template.</p>
          </tw-step>
          <tw-step>
            <ng-template twStepLabel>
              <span class="font-semibold">Step two</span>
              <span class="text-xs text-fg-muted ml-1">— optional</span>
            </ng-template>
            <p class="text-sm text-fg-muted">Mix plain and custom.</p>
          </tw-step>
          <tw-step label="Step three">
            <p class="text-sm text-fg-muted">Plain string label for comparison.</p>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="customLabelsSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">vertical</code>
        alongside a non-default variant to see how the indicator strip reflows,
        or flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">linear</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error on step 2</code>
        to watch how error styling preempts the color theme.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playVertical()"
                [class.!text-primary-700]="playVertical()"
                (click)="playVertical.update(v => !v)"
              >vertical</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLinear()"
                [class.!text-primary-700]="playLinear()"
                (click)="playLinear.update(v => !v)"
              >linear</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playHasError()"
                [class.!text-primary-700]="playHasError()"
                (click)="playHasError.update(v => !v)"
              >error on step 2</button>
            </div>
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-stepper
            [variant]="playVariant()"
            [color]="playColor()"
            [size]="playSize()"
            [orientation]="playVertical() ? 'vertical' : 'horizontal'"
            [linear]="playLinear()"
            [selectedIndex]="playIndex()"
            (selectedIndexChange)="playIndex.set($event)"
          >
            <tw-step label="First" description="Start here">
              <p class="text-sm text-fg-muted mb-3">First step body.</p>
              <button twButton twStepperNext size="sm">Next</button>
            </tw-step>
            <tw-step label="Second" description="Middle" [hasError]="playHasError()" errorMessage="Something is off">
              <p class="text-sm text-fg-muted mb-3">Second step body.</p>
              <div class="flex gap-2">
                <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
                <button twButton twStepperNext size="sm">Next</button>
              </div>
            </tw-step>
            <tw-step label="Third" description="Finish">
              <p class="text-sm text-fg-muted mb-3">Third step body.</p>
              <div class="flex gap-2">
                <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
                <button twButton color="success" size="sm">Submit</button>
              </div>
            </tw-step>
          </tw-stepper>
        </div>
      </div>
    </section>
  `,
})
export class StepperExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly variantIndex: Record<StepperVariant, WritableSignal<number>> = {
    default: signal(0),
    dot: signal(0),
    simple: signal(0),
  };

  protected readonly colorIndex: Record<TwColor, WritableSignal<number>> = {
    primary: signal(0),
    secondary: signal(0),
    accent: signal(0),
    neutral: signal(0),
    info: signal(0),
    success: signal(0),
    warning: signal(0),
    error: signal(0),
  };

  protected readonly sizeIndex: Record<TwSize, WritableSignal<number>> = {
    xs: signal(0),
    sm: signal(0),
    md: signal(0),
    lg: signal(0),
    xl: signal(0),
  };

  protected readonly verticalIndex = signal(0);
  protected readonly errorIndex = signal(0);
  protected readonly optionalIndex = signal(0);
  protected readonly iconIndex = signal(0);
  protected readonly labelIndex = signal(0);

  protected readonly linearIndex = signal(0);
  protected readonly emailControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly passwordControl = new FormControl('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(8)],
  });

  // Playground
  protected readonly playVariant = signal<StepperVariant>('default');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playVertical = signal(false);
  protected readonly playLinear = signal(false);
  protected readonly playHasError = signal(false);
  protected readonly playIndex = signal(0);

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-stepper
    [variant]="v"
    [selectedIndex]="variantIndex[v]()"
    (selectedIndexChange)="variantIndex[v].set($event)"
  >
    <tw-step label="Create" description="Start a new project">…</tw-step>
    <tw-step label="Configure" description="Settings and options">…</tw-step>
    <tw-step label="Deploy" description="Ship it">…</tw-step>
  </tw-stepper>
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-stepper
    [color]="c"
    [selectedIndex]="colorIndex[c]()"
    (selectedIndexChange)="colorIndex[c].set($event)"
  >
    <tw-step label="Plan">…</tw-step>
    <tw-step label="Build">…</tw-step>
    <tw-step label="Ship">…</tw-step>
  </tw-stepper>
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-stepper
    [size]="s"
    [selectedIndex]="sizeIndex[s]()"
    (selectedIndexChange)="sizeIndex[s].set($event)"
  >
    <tw-step label="Alpha">…</tw-step>
    <tw-step label="Beta">…</tw-step>
    <tw-step label="Gamma">…</tw-step>
  </tw-stepper>
}`.trim();

  protected readonly verticalSnippet = `<tw-stepper
  orientation="vertical"
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Upload files" description="Drop anything in">
    <p>Upload a collection of files to process.</p>
    <button twButton twStepperNext size="sm">Next</button>
  </tw-step>
  <tw-step label="Transcode" description="Media pipeline">
    <p>Run the transcoder over your uploads.</p>
    <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
    <button twButton twStepperNext size="sm">Next</button>
  </tw-step>
  <tw-step label="Publish" description="Make it live">
    <p>Ready to publish to the world.</p>
    <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
    <button twButton color="success" size="sm">Publish</button>
  </tw-step>
</tw-stepper>`;

  protected readonly linearTsSnippet = `protected readonly emailControl = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
});
protected readonly passwordControl = new FormControl('', {
  nonNullable: true,
  validators: [Validators.required, Validators.minLength(8)],
});`;

  protected readonly linearHtmlSnippet = `<tw-stepper
  linear
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Email" [stepControl]="emailControl" errorMessage="Enter a valid email">
    <tw-form-field>
      <label twLabel>Email</label>
      <input twInput type="email" [formControl]="emailControl" />
    </tw-form-field>
    <button twButton twStepperNext size="sm">Next</button>
  </tw-step>
  <tw-step label="Password" [stepControl]="passwordControl" errorMessage="Password must be 8+ chars">
    <tw-form-field>
      <label twLabel>Password</label>
      <input twInput type="password" [formControl]="passwordControl" />
    </tw-form-field>
    <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
    <button twButton twStepperNext size="sm">Next</button>
  </tw-step>
  <tw-step label="Confirm">
    <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
    <button twButton color="success" size="sm">Submit</button>
  </tw-step>
</tw-stepper>`;

  protected readonly errorSnippet = `<tw-stepper
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Connect" [hasError]="true" errorMessage="Could not reach the server">
    <p>There was a problem connecting. Check your network.</p>
  </tw-step>
  <tw-step label="Verify">…</tw-step>
  <tw-step label="Done">…</tw-step>
</tw-stepper>`;

  protected readonly optionalSnippet = `<tw-stepper
  linear
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Basics">
    <button twButton twStepperNext size="sm">Next</button>
  </tw-step>
  <tw-step label="Extras" optional>
    <button twButton variant="ghost" twStepperPrevious size="sm">Back</button>
    <button twButton twStepperNext size="sm">Skip / Next</button>
  </tw-step>
  <tw-step label="Review">…</tw-step>
</tw-stepper>`;

  protected readonly customIconsSnippet = `<tw-stepper
  color="accent"
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Upload">
    <ng-template twStepperIcon state="number">
      <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 1a4.5 4.5 0 0 0-4.5 4.5V9H5…" />
      </svg>
    </ng-template>
    <p>Pick files to upload.</p>
  </tw-step>
  <tw-step label="Process">
    <ng-template twStepperIcon state="number">
      <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M10 18a8 8 0 1 0 0-16…" />
      </svg>
    </ng-template>
    <p>Processing…</p>
  </tw-step>
  <tw-step label="Deliver">
    <ng-template twStepperIcon state="number">
      <svg class="size-3/5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
        <path d="M3.105 2.289…" />
      </svg>
    </ng-template>
    <p>Delivered.</p>
  </tw-step>
</tw-stepper>`;

  protected readonly customLabelsSnippet = `<tw-stepper
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step>
    <ng-template twStepLabel>
      <span class="font-semibold text-primary-fg">Step one</span>
      <span class="text-xs text-fg-muted ml-1">— required</span>
    </ng-template>
    <p>Custom label template.</p>
  </tw-step>
  <tw-step>
    <ng-template twStepLabel>
      <span class="font-semibold">Step two</span>
      <span class="text-xs text-fg-muted ml-1">— optional</span>
    </ng-template>
    <p>Mix plain and custom.</p>
  </tw-step>
  <tw-step label="Step three">
    <p>Plain string label for comparison.</p>
  </tw-step>
</tw-stepper>`;
}
