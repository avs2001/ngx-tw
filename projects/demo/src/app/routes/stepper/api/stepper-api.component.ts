import { ChangeDetectionStrategy, Component } from '@angular/core';
import { CodeBlockComponent } from 'ngx-tw/code-block';

@Component({
  selector: 'app-stepper-api',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CodeBlockComponent],
  template: `
    <!-- StepperComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepperComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-stepper &nbsp;·&nbsp; Extends: CdkStepper</p>

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
              <td class="px-4 py-2 font-mono text-xs">variant</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default' | 'dot' | 'simple'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'default'</td>
              <td class="px-4 py-2 text-fg-muted">Visual style of the indicator strip.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">color</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwColor</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'primary'</td>
              <td class="px-4 py-2 text-fg-muted">Semantic color for active and completed indicators, labels, and connectors.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">size</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">TwSize</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'md'</td>
              <td class="px-4 py-2 text-fg-muted">Controls indicator diameter, label typography, and connector weight.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">orientation</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal' | 'vertical'</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'horizontal'</td>
              <td class="px-4 py-2 text-fg-muted">Layout of the header strip, inherited from <code class="font-mono">CdkStepper</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">linear</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Requires each step's <code class="font-mono">stepControl</code> to be valid before advancing.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectedIndex</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">number</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">0</td>
              <td class="px-4 py-2 text-fg-muted">Index of the selected step; pair with <code class="font-mono">selectedIndexChange</code> for two-way binding.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">showError</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether steps with <code class="font-mono">hasError</code> render error styling and <code class="font-mono">aria-invalid</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">headerInteractive</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether clicking a navigable step header selects it.</td>
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
              <td class="px-4 py-2 font-mono text-xs">selectionChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;StepperSelectionEvent&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires when the selected step changes, with both the new and previous step instances and indices.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">selectedIndexChange</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">EventEmitter&lt;number&gt;</td>
              <td class="px-4 py-2 text-fg-muted">Fires with the new selected index; paired with <code class="font-mono">[(selectedIndex)]</code>.</td>
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
              <td class="px-4 py-2 font-mono text-xs">next</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Advances to the next navigable step, respecting linear-mode gating.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">previous</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Goes back to the previous step.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">reset</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">(): void</td>
              <td class="px-4 py-2 text-fg-muted">Resets to the first step and clears step-control form state.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- StepComponent -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepComponent</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: tw-step &nbsp;·&nbsp; Extends: CdkStep</p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Plain-text header label, overridden by a <code class="font-mono">*twStepLabel</code> template when present.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">description</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Sub-label shown under the label in the <code class="font-mono">'default'</code> variant.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">stepControl</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">AbstractControl | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Form control whose validity gates advancement in linear mode.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">optional</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the step as skippable in linear mode and shows an "(Optional)" hint.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">editable</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">true</td>
              <td class="px-4 py-2 text-fg-muted">Whether the user can return to this step after completing it.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">completed</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">derived</td>
              <td class="px-4 py-2 text-fg-muted">Marks the step as completed; derived from <code class="font-mono">stepControl</code> by default, overridable manually.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">hasError</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">boolean</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">false</td>
              <td class="px-4 py-2 text-fg-muted">Marks the step as errored; pairs with <code class="font-mono">errorMessage</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">errorMessage</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">''</td>
              <td class="px-4 py-2 text-fg-muted">Message announced to screen readers when the step is errored.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">StepState</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">'number'</td>
              <td class="px-4 py-2 text-fg-muted">Overrides the indicator glyph — built-in values are <code class="font-mono">'number'</code>, <code class="font-mono">'edit'</code>, <code class="font-mono">'done'</code>, <code class="font-mono">'error'</code>.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-label</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Accessible name applied to the step header button.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">aria-labelledby</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">string | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">ID of an external labelling element for the step header button.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- StepLabelDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepLabelDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twStepLabel]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Structural directive that marks an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;ng-template&gt;</code>
        inside a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-step&gt;</code>
        as the header-label template; the template renders in place of the plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        input and has no context.
      </p>
    </section>

    <!-- StepperIconDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepperIconDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: ng-template[twStepperIcon]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Structural directive that replaces the default indicator glyph for a step
        in a given state. Context type is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">StepperIconContext</code>.
      </p>

      <h3 class="text-xs font-semibold text-fg-muted uppercase tracking-wide mb-2">Inputs</h3>
      <div class="overflow-x-auto border border-border rounded-lg">
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
              <td class="px-4 py-2 font-mono text-xs">state</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">StepState | undefined</td>
              <td class="px-4 py-2 font-mono text-xs text-fg-muted">undefined</td>
              <td class="px-4 py-2 text-fg-muted">Indicator state this template overrides; omit to match every state.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- StepperNextDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepperNextDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: button[twStepperNext]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive that advances the parent stepper when the host button
        is clicked, composed over CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkStepperNext</code>
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hostDirectives</code>.
      </p>
    </section>

    <!-- StepperPreviousDirective -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">StepperPreviousDirective</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Selector: button[twStepperPrevious]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        Attribute directive that returns the parent stepper to the previous step,
        composed over CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkStepperPrevious</code>
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hostDirectives</code>.
      </p>
    </section>

    <!-- provideTwStepperOptions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">provideTwStepperOptions()</h2>
      <p class="text-xs text-fg-muted mb-4 font-mono">Signature: (options: StepperOptions) =&gt; Provider[]</p>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Helper that registers app-wide stepper defaults by providing CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">STEPPER_GLOBAL_OPTIONS</code>
        token; useful for flipping
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">showError</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">displayDefaultIndicatorType</code>
        once across the whole application.
      </p>
      <tw-code-block [code]="provideSnippet" language="ts" />
    </section>

    <!-- Types -->
    <section>
      <h2 class="text-sm font-semibold mb-3">Types</h2>
      <tw-code-block [code]="typesSnippet" language="ts" />
    </section>
  `,
})
export class StepperApi {
  protected readonly provideSnippet = `import { provideTwStepperOptions } from 'ngx-tw/stepper';

bootstrapApplication(App, {
  providers: [
    provideTwStepperOptions({ showError: false }),
  ],
});`;

  protected readonly typesSnippet = `type StepperVariant = 'default' | 'dot' | 'simple';

interface StepperIconContext {
  $implicit: { index: number; active: boolean };
}

// Re-exported from @angular/cdk/stepper
type StepState = 'number' | 'edit' | 'done' | 'error' | string;
type StepperOrientation = 'horizontal' | 'vertical';

interface StepperOptions {
  showError?: boolean;
  displayDefaultIndicatorType?: boolean;
}

interface StepperSelectionEvent {
  selectedIndex: number;
  previouslySelectedIndex: number;
  selectedStep: CdkStep;
  previouslySelectedStep: CdkStep;
}`;
}
