import { ChangeDetectionStrategy, Component, computed, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, required } from '@angular/forms/signals';
import { CheckboxComponent } from '@cdevhub/ngx-tw/checkbox';
import type { CheckboxLabelPosition, CheckboxVariant } from '@cdevhub/ngx-tw/checkbox';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
} from '@cdevhub/ngx-tw/form-field';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
const VARIANTS: CheckboxVariant[] = ['solid', 'outline'];
const LABEL_POSITIONS: CheckboxLabelPosition[] = ['after', 'before'];

interface Permission {
  readonly key: string;
  readonly label: string;
  readonly hint: string;
}

const PERMISSIONS: readonly Permission[] = [
  { key: 'read', label: 'Read repository', hint: 'View code, issues, and pull requests.' },
  { key: 'write', label: 'Write to repository', hint: 'Push commits, open pull requests, comment on issues.' },
  { key: 'admin', label: 'Administer repository', hint: 'Manage settings, teams, and access control.' },
];

@Component({
  selector: 'app-checkbox-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CheckboxComponent,
    ButtonDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        input controls how the checked state renders.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        fills the box with the active color — the right default for consent and form
        controls that expect high visibility.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        keeps a transparent fill with a colored border and check mark; reach for it on
        tinted surfaces or in dense lists where a filled box would feel heavy.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (v of variants; track v) {
            <tw-checkbox [variant]="v" color="primary" [(checked)]="variantValues[v]" [label]="v" />
          }
        </div>
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Variant composes with color — an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        checkbox in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        reads as "positive" without the visual weight of a fully filled square.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Color tints the box fill (for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>)
        or the border and check mark (for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>).
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main form action, semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>/<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        when the checkbox drives a themed region, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        for supporting controls that should not draw attention.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          @for (c of colors; track c) {
            <tw-checkbox [color]="c" [(checked)]="colorValues[c]" [label]="c" />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales the box, the check glyph, and the label typography together. Match it
        to neighbouring controls — a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        checkbox suits a dense settings table, while
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        reads well as a standalone consent control on a sign-up form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-center gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono">{{ s }}</span>
              <tw-checkbox [size]="s" [(checked)]="sizeValues[s]" [label]="'Size ' + s" />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- Indeterminate / Select all -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Indeterminate "Select all"</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The indeterminate state represents "some but not all" — the canonical use is a
        parent checkbox that summarises a group of children. Drive
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[indeterminate]</code>
        from a computed signal, and let a user toggle on the parent cascade to every child
        via
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(change)</code>.
        Any user interaction clears the indeterminate flag automatically.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md space-y-3">
          <tw-checkbox
            [checked]="allPermissions()"
            [indeterminate]="somePermissions()"
            (change)="togglePermissions($event)"
            label="Grant all permissions"
            description="Toggle every scope below at once."
            color="primary"
          />
          <div class="pl-8 border-l border-border-muted ml-2 space-y-2.5 pt-1">
            @for (p of permissions; track p.key) {
              <tw-checkbox
                [(checked)]="permissionValues[p.key]"
                [label]="p.label"
                [description]="p.hint"
                size="sm"
                color="primary"
              />
            }
          </div>
          <p class="text-xs text-fg-muted mt-3 font-mono">
            all = {{ allPermissions() }} · some = {{ somePermissions() }}
          </p>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="indeterminateTsSnippet" language="ts" />
        <tw-code-block [code]="indeterminateHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- With Description -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pair a short
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">description</code>
        with the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">label</code>
        whenever the control carries a consequence the user should be aware of before
        ticking it. The description renders under the label and is wired to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        so assistive tech announces it with the control.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md space-y-4">
          <tw-checkbox
            label="Subscribe to the product newsletter"
            description="We'll send a short monthly digest. You can unsubscribe in one click."
            color="info"
            [(checked)]="newsletterValue"
          />
          <tw-checkbox
            label="Enable two-factor authentication"
            description="Adds a time-based one-time password to every new sign-in."
            color="success"
            [(checked)]="twoFactorValue"
          />
          <tw-checkbox
            label="Delete account permanently"
            description="All your projects, comments, and uploads will be removed and cannot be restored."
            color="error"
            [(checked)]="deleteValue"
          />
        </div>
      </div>
      <tw-code-block [code]="descriptionSnippet" language="html" />
    </section>

    <!-- Long & multi-line labels -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Long &amp; multi-line labels</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Labels that wrap to two or more lines stay aligned to the
        <em>first line</em> of text — the box never floats to the visual centre of the
        whole block. The same rule applies across every size, so a long consent statement
        next to an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        checkbox reads the same as a short one next to an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        one.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md space-y-4">
          @for (s of sizes; track s) {
            <div class="flex items-start gap-3">
              <span class="w-10 text-xs text-fg-muted font-mono pt-1">{{ s }}</span>
              <tw-checkbox
                [size]="s"
                [(checked)]="multilineValues[s]"
                label="I agree to receive transactional emails about my account, billing reminders, security alerts, and occasional product updates from the team."
                description="You can change this preference any time from the notification settings page in your dashboard."
                color="primary"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="multilineSnippet" language="html" />
    </section>

    <!-- Label position -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Label position</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelPosition="after"</code>
        is the default and the right choice for almost every form. Switch to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">"before"</code>
        for settings lists where the label is a long-form statement and the control lives
        on the trailing edge of a row.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (pos of labelPositions; track pos) {
            <div class="flex items-center justify-between max-w-md border border-border-muted rounded-lg px-4 py-3">
              <tw-checkbox
                [labelPosition]="pos"
                [(checked)]="labelPosValues[pos]"
                [label]="pos === 'after' ? 'Send me product updates' : 'Show desktop notifications for new messages'"
                class="w-full"
              />
            </div>
          }
        </div>
      </div>
      <tw-code-block [code]="labelPositionSnippet" language="html" />
    </section>

    <!-- Custom check icon -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom check icon</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an SVG into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="check-icon"]</code>
        slot to replace the default tick — useful for task lists where a thicker glyph or
        a brand-specific mark reads better. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fill="currentColor"</code>
        so the icon inherits the variant's color automatically.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md space-y-3">
          <tw-checkbox label="Draft project brief" color="success" size="lg" [(checked)]="taskDraftValue">
            <svg slot="check-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 1 8.523 14.914l-3.523-3.5a1 1 0 0 1 1.414-1.414l3.523 3.5 7.05-7a1 1 0 0 1 1.414 1.414l-7.05 7a2 2 0 0 1-1.414.586z"/>
            </svg>
          </tw-checkbox>
          <tw-checkbox label="Review team proposals" color="success" size="lg" [(checked)]="taskReviewValue">
            <svg slot="check-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 1 8.523 14.914l-3.523-3.5a1 1 0 0 1 1.414-1.414l3.523 3.5 7.05-7a1 1 0 0 1 1.414 1.414l-7.05 7a2 2 0 0 1-1.414.586z"/>
            </svg>
          </tw-checkbox>
          <tw-checkbox label="Schedule kick-off meeting" color="success" size="lg" [(checked)]="taskKickoffValue">
            <svg slot="check-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M9.937 15.5A2 2 0 0 1 8.523 14.914l-3.523-3.5a1 1 0 0 1 1.414-1.414l3.523 3.5 7.05-7a1 1 0 0 1 1.414 1.414l-7.05 7a2 2 0 0 1-1.414.586z"/>
            </svg>
          </tw-checkbox>
        </div>
      </div>
      <tw-code-block [code]="customIconSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        blocks both click and Space activation and applies muted styling; the control
        still keeps its value so users can still read the current selection.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        so assistive tech announces the checkbox as required — pair it with a visible
        asterisk in a surrounding form field when the requirement needs to be seen, not
        just heard.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
            <div class="space-y-2">
              <tw-checkbox label="Disabled, unchecked" [disabled]="true" />
              <tw-checkbox label="Disabled, checked" [disabled]="true" [checked]="true" />
              <tw-checkbox label="Disabled, indeterminate" [disabled]="true" [indeterminate]="true" />
            </div>
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
            <tw-checkbox
              label="Accept the terms and privacy policy"
              description="Required to create your account."
              [required]="true"
              [(checked)]="requiredValue"
            />
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The checkbox implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works out of the box. Programmatic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">writeValue</code>
        also clears the indeterminate state — setting the model to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        always leaves the box unchecked rather than dashed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-checkbox
          label="Subscribe to weekly digest"
          description="Friday roundup of new articles and releases."
          color="info"
          name="tdNewsletter"
          [(ngModel)]="tdNewsletterValue"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">value = {{ tdNewsletterValue() }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdNewsletterValue.set(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdNewsletterValue.set(false)">Set false</button>
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
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>,
        and touched flags stay in sync. Toggling disabled on the control also disables the
        checkbox — no
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        input needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-checkbox label="Remember this device for 30 days" color="info" [formControl]="rememberControl" />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          control.value = {{ rememberControl.value }} · touched = {{ rememberControl.touched }} · disabled = {{ rememberControl.disabled }}
        <span class="block mt-1 text-fg-subtle">touched flips on blur, not on change — the same as a native input. Click the control and then move focus away to see it become true.</span>
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="rememberControl.setValue(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="rememberControl.setValue(false)">Set false</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleRememberDisabled()">
            {{ rememberControl.disabled ? 'Enable' : 'Disable' }}
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
        <tw-checkbox
          label="Accept the terms and conditions"
          description="Required to continue."
          color="primary"
          [formField]="signalForm.accepted"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = {{ signalForm.accepted().value() }} ·
          touched = {{ signalForm.accepted().touched() }} ·
          valid = {{ signalForm.accepted().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.accepted().value.set(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.accepted().value.set(false)">Set false</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.accepted().reset()">Reset</button>
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Inside tw-form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Inside tw-form-field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Wrap the checkbox in
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
        when the row needs a hint or error message alongside the control. The
        checkbox registers itself as the field's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormFieldControl</code>,
        so the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;label twLabel&gt;</code>
        gets a correct
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">for</code>
        attribute and hint / error ids merge into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        automatically.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <form [formGroup]="termsGroup" (ngSubmit)="submitTerms()" class="max-w-md space-y-4">
          <tw-form-field>
            <label twLabel>I accept the privacy policy</label>
            <tw-checkbox formControlName="accepted" color="primary" />
            <span twHint>Required to create the account.</span>
            <span twError>You must accept the policy before continuing.</span>
          </tw-form-field>
          <div class="flex items-center gap-2">
            <button twButton type="submit" color="primary" size="sm">Create account</button>
            <button twButton type="button" variant="outline" color="neutral" size="sm" (click)="resetTerms()">Reset</button>
          </div>
          <p class="text-xs text-fg-muted font-mono">
            value = {{ termsGroup.controls.accepted.value }} ·
            invalid = {{ termsGroup.controls.accepted.invalid }} ·
            touched = {{ termsGroup.controls.accepted.touched }}
          </p>
        </form>
      </div>
      <tw-code-block [code]="formFieldSnippet" language="html" />
    </section>

    <!-- Error state -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Error state</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide an
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorStateMatcher</code>
        (or override the global
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_ERROR_STATE_MATCHER</code>
        token) to control when the checkbox renders as invalid. The default
        matcher flips the state once the bound
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        is invalid AND the user has interacted with it (or the parent form
        was submitted). The box border switches to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error-500</code>
        and the host exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-invalid="true"</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="max-w-md space-y-4">
          <tw-checkbox
            label="Confirm the destructive action"
            description="Required — the operation cannot be undone."
            color="error"
            [formControl]="confirmDestructive"
          />
          <p class="text-xs text-fg-muted font-mono">
            invalid = {{ confirmDestructive.invalid }} ·
            touched = {{ confirmDestructive.touched }} ·
            errorState = {{ confirmDestructive.invalid && confirmDestructive.touched }}
          </p>
          <div class="flex gap-2">
            <button twButton variant="outline" color="neutral" size="xs" (click)="confirmDestructive.markAsTouched()">Mark touched</button>
            <button twButton variant="outline" color="neutral" size="xs" (click)="confirmDestructive.reset()">Reset</button>
          </div>
        </div>
      </div>
      <tw-code-block [code]="errorStateSnippet" language="ts" />
    </section>

    <!-- Native form submission via hidden input -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Native form submission</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The component renders a visually hidden
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input type="checkbox"&gt;</code>
        inside the host. When you set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">name</code>,
        the hidden input picks it up so submitting a plain HTML form (no Angular
        bindings) sends the checkbox value alongside the other fields. The
        hidden input mirrors
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">checked</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        and is excluded from the tab order.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <form #nativeForm (submit)="captureNativeSubmit($event, nativeForm)" class="space-y-4 max-w-md">
          <tw-checkbox name="newsletter" label="Subscribe" [(checked)]="nativeNewsletter" />
          <tw-checkbox name="terms" label="Accept terms" [(checked)]="nativeTerms" color="primary" />
          <button twButton type="submit" size="sm" color="primary">Submit (no Angular)</button>
          @if (nativeSubmittedEntries().length) {
            <div class="text-xs font-mono text-fg-muted bg-surface-sunken rounded-md p-3 space-y-0.5">
              <p class="font-semibold text-fg-muted">FormData entries:</p>
              @for (entry of nativeSubmittedEntries(); track entry.key) {
                <p>{{ entry.key }} = {{ entry.value }}</p>
              }
            </div>
          }
        </form>
      </div>
      <tw-code-block [code]="nativeFormSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input at once. Start with the defaults and toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">indeterminate</code>
        to see how the dash glyph replaces the check, or enable
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">description</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">labelPosition="before"</code>
        to preview a settings-row layout.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="grid gap-x-6 gap-y-4 md:grid-cols-3 mb-6">
          <div class="md:col-span-3">
            <p class="text-2xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">Appearance</p>
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

          <div class="md:col-span-3 pt-3 border-t border-border-muted">
            <p class="text-2xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">Content</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Label position</label>
                <div class="flex gap-1">
                  @for (pos of labelPositions; track pos) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playLabelPos() === pos"
                      [class.!text-primary-700]="playLabelPos() === pos"
                      (click)="playLabelPos.set(pos)"
                    >{{ pos }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Description</label>
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playDescription()"
                  [class.!text-primary-700]="playDescription()"
                  (click)="playDescription.update(v => !v)"
                >{{ playDescription() ? 'shown' : 'hidden' }}</button>
              </div>
            </div>
          </div>

          <div class="md:col-span-3 pt-3 border-t border-border-muted">
            <p class="text-2xs font-semibold text-fg-subtle uppercase tracking-wider mb-2">State</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playIndeterminate()"
                [class.!text-primary-700]="playIndeterminate()"
                (click)="playIndeterminate.update(v => !v)"
              >indeterminate</button>
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
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-checkbox
            [color]="playColor()"
            [size]="playSize()"
            [variant]="playVariant()"
            [labelPosition]="playLabelPos()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            label="Enable new dashboard"
            [description]="playDescription() ? 'Switch to the redesigned project overview with activity timelines.' : undefined"
            [(checked)]="playValue"
            [(indeterminate)]="playIndeterminate"
          />
          <p class="text-xs text-fg-muted mt-6 font-mono">
            checked = {{ playValue() }} · indeterminate = {{ playIndeterminate() }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class CheckboxExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;
  protected readonly variants = VARIANTS;
  protected readonly labelPositions = LABEL_POSITIONS;
  protected readonly permissions = PERMISSIONS;

  protected readonly variantValues: Record<CheckboxVariant, ReturnType<typeof signal<boolean>>> = {
    solid: signal(true),
    outline: signal(true),
  };

  protected readonly colorValues: Record<TwColor, ReturnType<typeof signal<boolean>>> = {
    primary: signal(true),
    secondary: signal(true),
    accent: signal(true),
    neutral: signal(true),
    info: signal(true),
    success: signal(true),
    warning: signal(true),
    error: signal(true),
  };

  protected readonly sizeValues: Record<TwSize, ReturnType<typeof signal<boolean>>> = {
    xs: signal(true),
    sm: signal(true),
    md: signal(true),
    lg: signal(true),
    xl: signal(true),
  };

  protected readonly multilineValues: Record<TwSize, ReturnType<typeof signal<boolean>>> = {
    xs: signal(false),
    sm: signal(false),
    md: signal(true),
    lg: signal(false),
    xl: signal(false),
  };

  protected readonly labelPosValues: Record<CheckboxLabelPosition, ReturnType<typeof signal<boolean>>> = {
    after: signal(true),
    before: signal(false),
  };

  // Indeterminate group — backed by a record keyed by permission.key.
  protected readonly permissionValues: Record<string, ReturnType<typeof signal<boolean>>> = {
    read: signal(true),
    write: signal(false),
    admin: signal(false),
  };

  protected readonly allPermissions = computed(() =>
    PERMISSIONS.every((p) => this.permissionValues[p.key]()),
  );

  protected readonly somePermissions = computed(() => {
    const total = PERMISSIONS.length;
    const checked = PERMISSIONS.filter((p) => this.permissionValues[p.key]()).length;
    return checked > 0 && checked < total;
  });

  protected togglePermissions(next: boolean): void {
    for (const p of PERMISSIONS) {
      this.permissionValues[p.key].set(next);
    }
  }

  protected readonly newsletterValue = signal(false);
  protected readonly twoFactorValue = signal(true);
  protected readonly deleteValue = signal(false);

  protected readonly taskDraftValue = signal(true);
  protected readonly taskReviewValue = signal(false);
  protected readonly taskKickoffValue = signal(false);

  protected readonly requiredValue = signal(false);

  protected readonly tdNewsletterValue = signal(false);

  protected readonly rememberControl = new FormControl<boolean>(false, { nonNullable: true });

  protected readonly signalModel = signal({ accepted: false });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.accepted);
  });

  // Form-field row backed by a reactive FormGroup with requiredTrue validation.
  protected readonly termsGroup = new FormGroup({
    accepted: new FormControl<boolean>(false, {
      nonNullable: true,
      validators: [Validators.requiredTrue],
    }),
  });

  protected submitTerms(): void {
    this.termsGroup.controls.accepted.markAsTouched();
    this.termsGroup.controls.accepted.updateValueAndValidity();
  }

  protected resetTerms(): void {
    this.termsGroup.reset();
  }

  // Standalone reactive control demonstrating error-state without form-field chrome.
  protected readonly confirmDestructive = new FormControl<boolean>(false, {
    nonNullable: true,
    validators: [Validators.requiredTrue],
  });

  // Native HTML form (no Angular bindings) — values flow via the hidden <input>.
  protected readonly nativeNewsletter = signal(true);
  protected readonly nativeTerms = signal(false);
  protected readonly nativeSubmittedEntries = signal<readonly { key: string; value: string }[]>(
    [],
  );

  protected captureNativeSubmit(event: Event, formEl: HTMLFormElement): void {
    event.preventDefault();
    const data = new FormData(formEl);
    const entries: { key: string; value: string }[] = [];
    data.forEach((value, key) => {
      entries.push({ key, value: String(value) });
    });
    this.nativeSubmittedEntries.set(entries);
  }

  protected toggleRememberDisabled(): void {
    if (this.rememberControl.disabled) {
      this.rememberControl.enable();
    } else {
      this.rememberControl.disable();
    }
  }

  // Playground
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playVariant = signal<CheckboxVariant>('solid');
  protected readonly playLabelPos = signal<CheckboxLabelPosition>('after');
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playDescription = signal(false);
  protected readonly playIndeterminate = signal(false);
  protected readonly playValue = signal(false);

  // ── Code snippets ──

  protected readonly variantsSnippet = `
@for (v of variants; track v) {
  <tw-checkbox [variant]="v" color="primary" [(checked)]="variantValues[v]" [label]="v" />
}`.trim();

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-checkbox [color]="c" [(checked)]="colorValues[c]" [label]="c" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-checkbox [size]="s" [(checked)]="sizeValues[s]" [label]="'Size ' + s" />
}`.trim();

  protected readonly indeterminateTsSnippet = `protected readonly values: Record<string, WritableSignal<boolean>> = {
  read:  signal(true),
  write: signal(false),
  admin: signal(false),
};

protected readonly allChecked = computed(() =>
  permissions.every(p => this.values[p.key]()),
);

protected readonly someChecked = computed(() => {
  const checked = permissions.filter(p => this.values[p.key]()).length;
  return checked > 0 && checked < permissions.length;
});

protected toggleAll(next: boolean): void {
  for (const p of permissions) this.values[p.key].set(next);
}`;

  protected readonly indeterminateHtmlSnippet = `<tw-checkbox
  [checked]="allChecked()"
  [indeterminate]="someChecked()"
  (change)="toggleAll($event)"
  label="Grant all permissions"
  description="Toggle every scope below at once."
/>
@for (p of permissions; track p.key) {
  <tw-checkbox
    [(checked)]="values[p.key]"
    [label]="p.label"
    [description]="p.hint"
    size="sm"
  />
}`;

  protected readonly descriptionSnippet = `<tw-checkbox
  label="Subscribe to the product newsletter"
  description="We'll send a short monthly digest. You can unsubscribe in one click."
  color="info"
  [(checked)]="newsletter"
/>`;

  protected readonly multilineSnippet = `<!-- Box stays aligned to the first line of the label regardless of length. -->
<tw-checkbox
  size="md"
  label="I agree to receive transactional emails about my account, billing reminders, security alerts, and occasional product updates from the team."
  description="You can change this preference any time from the notification settings page in your dashboard."
  [(checked)]="agreed"
/>`;

  protected readonly labelPositionSnippet = `<tw-checkbox
  labelPosition="after"
  label="Send me product updates"
  [(checked)]="updates"
/>

<tw-checkbox
  labelPosition="before"
  label="Show desktop notifications for new messages"
  [(checked)]="notifications"
/>`;

  protected readonly customIconSnippet = `<tw-checkbox label="Draft project brief" color="success" size="lg" [(checked)]="done">
  <svg slot="check-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M9.937 15.5A2 2 0 0 1 8.523 14.914l-3.523-3.5a1 1 0 0 1 1.414-1.414l3.523 3.5 7.05-7a1 1 0 0 1 1.414 1.414l-7.05 7a2 2 0 0 1-1.414.586z"/>
  </svg>
</tw-checkbox>`;

  protected readonly statesSnippet = `<!-- Disabled -->
<tw-checkbox label="Disabled, unchecked" [disabled]="true" />
<tw-checkbox label="Disabled, checked" [disabled]="true" [checked]="true" />
<tw-checkbox label="Disabled, indeterminate" [disabled]="true" [indeterminate]="true" />

<!-- Required -->
<tw-checkbox
  label="Accept the terms and privacy policy"
  description="Required to create your account."
  [required]="true"
  [(checked)]="accepted"
/>`;

  protected readonly tdTsSnippet = `protected readonly newsletter = signal(false);`;

  protected readonly tdHtmlSnippet = `<tw-checkbox
  name="newsletter"
  label="Subscribe to weekly digest"
  description="Friday roundup of new articles and releases."
  color="info"
  [(ngModel)]="newsletter"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly remember = new FormControl<boolean>(false, { nonNullable: true });`;

  protected readonly reactiveHtmlSnippet = `<tw-checkbox
  label="Remember this device for 30 days"
  color="info"
  [formControl]="remember"
/>`;

  protected readonly signalTsSnippet = `protected readonly model = signal({ accepted: false });
protected readonly termsForm = form(this.model, (p) => {
  required(p.accepted);
});`;

  protected readonly signalHtmlSnippet = `<tw-checkbox
  label="Accept the terms and conditions"
  description="Required to continue."
  [formField]="termsForm.accepted"
/>`;

  protected readonly formFieldSnippet = `<form [formGroup]="termsGroup" (ngSubmit)="submit()">
  <tw-form-field>
    <label twLabel>I accept the privacy policy</label>
    <tw-checkbox formControlName="accepted" color="primary" />
    <span twHint>Required to create the account.</span>
    <span twError>You must accept the policy before continuing.</span>
  </tw-form-field>
</form>`;

  protected readonly errorStateSnippet = `protected readonly confirmDestructive = new FormControl<boolean>(false, {
  nonNullable: true,
  validators: [Validators.requiredTrue],
});

// In the template
<tw-checkbox
  label="Confirm the destructive action"
  description="Required — the operation cannot be undone."
  color="error"
  [formControl]="confirmDestructive"
/>`;

  protected readonly nativeFormSnippet = `<form>
  <tw-checkbox name="newsletter" label="Subscribe" [(checked)]="newsletter" />
  <tw-checkbox name="terms" label="Accept terms" [(checked)]="terms" />
  <button type="submit">Submit</button>
</form>

<!-- The hidden <input type="checkbox" name="..."> ensures
     FormData includes both fields on submit. -->`;
}
