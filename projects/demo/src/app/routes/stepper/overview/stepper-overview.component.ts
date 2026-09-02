import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StepperComponent, StepComponent } from '@cdevhub/ngx-tw/stepper';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

@Component({
  selector: 'app-stepper-overview',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [StepperComponent, StepComponent, CodeBlockComponent, RouterLink],
  template: `
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl">
        The Stepper component guides a user through a sequence of steps — a wizard, an
        onboarding flow, a multi-page checkout. It composes Angular CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkStepper</code>,
        which owns step iteration, linear-mode validation via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stepControl</code>,
        keyboard navigation, and the ARIA plumbing; this library layers three visual
        variants, semantic colors, and custom template slots on top.
      </p>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Accessibility</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A horizontal stepper uses the ARIA Tabs pattern: a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tablist"</code>
        container with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tab"</code>
        headers and a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="tabpanel"</code>
        content region below the strip. A vertical stepper renders each panel inline
        under its own header, which a tablist may not own, so it is exposed as a stack of
        disclosure buttons instead: plain buttons carrying
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-expanded</code>
        with the open panel as a labelled
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="group"</code>.
        Arrow-key navigation and the roving tab stop are identical in both. The currently
        selected step also carries
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="step"</code>
        so assistive tech reads it as a wizard step rather than a plain tab. Step
        changes are announced through CDK
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        as "<em>Label</em>, step <em>n</em> of <em>total</em>".
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
              <td class="px-4 py-2 font-mono text-xs">ArrowRight / ArrowLeft</td>
              <td class="px-4 py-2 text-fg-muted">Horizontal: moves focus to the next or previous step header (RTL-aware).</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">ArrowDown / ArrowUp</td>
              <td class="px-4 py-2 text-fg-muted">Vertical: moves focus to the next or previous step header.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Home / End</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus to the first or last step header.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Enter / Space</td>
              <td class="px-4 py-2 text-fg-muted">Selects the focused step when it is navigable.</td>
            </tr>
            <tr>
              <td class="px-4 py-2 font-mono text-xs">Tab</td>
              <td class="px-4 py-2 text-fg-muted">Moves focus from the header strip into the active step panel and out again.</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Basic Usage</h2>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-stepper
          [selectedIndex]="basicIndex()"
          (selectedIndexChange)="basicIndex.set($event)"
        >
          <tw-step label="Account">
            <p class="text-sm text-fg-muted">Set up your account details.</p>
          </tw-step>
          <tw-step label="Profile">
            <p class="text-sm text-fg-muted">Add profile information.</p>
          </tw-step>
          <tw-step label="Review">
            <p class="text-sm text-fg-muted">Review everything, then submit.</p>
          </tw-step>
        </tw-stepper>
      </div>
      <tw-code-block [code]="basicUsageSnippet" language="html" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Import</h2>
      <tw-code-block [code]="importSnippet" language="ts" />
    </section>

    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Key Features</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>3 variants:
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">default</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dot</code>,
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">simple</code>
        </li>
        <li>5 sizes and 8 semantic colors — all driven by theme tokens</li>
        <li>Horizontal and vertical orientation with inline or stacked panels</li>
        <li>Linear mode with per-step
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">stepControl</code>
          validation (reactive, template-driven, or signal forms)
        </li>
        <li>Optional steps, non-editable steps, and error states with screen-reader messages</li>
        <li>Per-state custom indicator icons via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twStepperIcon [state]</code>
        </li>
        <li>Custom header labels via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">*twStepLabel</code>
        </li>
        <li>
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStepperNext]</code> /
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twStepperPrevious]</code>
          attribute directives for navigation buttons
        </li>
        <li>ARIA Tabs pattern with
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-current="step"</code>
          and live-region announcements on each step change
        </li>
        <li>App-wide defaults via
          <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">provideTwStepperOptions()</code>
        </li>
      </ul>
    </section>

    <section>
      <h2 class="text-sm font-semibold mb-3">Related components</h2>
      <ul class="list-disc list-inside text-sm text-fg-muted space-y-1.5">
        <li>
          <a routerLink="/tabs" class="text-primary-600 hover:underline">Tabs</a>
          — pick this when the content is a set of parallel views, not a sequence.
        </li>
        <li>
          <a routerLink="/progress-bar" class="text-primary-600 hover:underline">Progress Bar</a>
          — a simpler progress indicator when there are no discrete, navigable steps.
        </li>
        <li>
          <a routerLink="/form-field" class="text-primary-600 hover:underline">Form Field</a>
          and
          <a routerLink="/input" class="text-primary-600 hover:underline">Input</a>
          — the usual building blocks inside each step's panel.
        </li>
      </ul>
    </section>
  `,
})
export class StepperOverview {
  protected readonly basicIndex = signal(0);

  protected readonly basicUsageSnippet = `<tw-stepper
  [selectedIndex]="index()"
  (selectedIndexChange)="index.set($event)"
>
  <tw-step label="Account">Account content</tw-step>
  <tw-step label="Profile">Profile content</tw-step>
  <tw-step label="Review">Review content</tw-step>
</tw-stepper>`;

  protected readonly importSnippet = `import {
  StepperComponent,
  StepComponent,
  StepLabelDirective,
  StepperIconDirective,
  StepperNextDirective,
  StepperPreviousDirective,
  provideTwStepperOptions,
} from '@cdevhub/ngx-tw/stepper';`;
}
