import {
  ChangeDetectionStrategy,
  Component,
  Directive,
  signal,
  type WritableSignal,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import type { ErrorStateMatcher } from 'ngx-tw/core';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  PrefixDirective,
  SuffixDirective,
} from 'ngx-tw/form-field';
import { InputDirective, TW_INPUT_VALUE_ACCESSOR } from 'ngx-tw/input';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

// Shows errors only after the parent form is submitted — used below.
const SUBMIT_ONLY_MATCHER: ErrorStateMatcher = {
  isErrorState(control, form) {
    return !!control?.invalid && !!form?.submitted;
  },
};

// Demonstrates the TW_INPUT_VALUE_ACCESSOR extension point — the directive owns
// value storage and normalizes every keystroke to uppercase.
@Directive({
  selector: 'input[uppercaseValue]',
  providers: [
    { provide: TW_INPUT_VALUE_ACCESSOR, useExisting: UppercaseValueDirective },
  ],
  host: {
    '(input)': '_onInput($event)',
    '[value]': 'value()',
  },
})
class UppercaseValueDirective {
  readonly value: WritableSignal<string> = signal('');
  _onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value.toUpperCase());
  }
}

@Component({
  selector: 'app-input-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    InputDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    PrefixDirective,
    SuffixDirective,
    FormsModule,
    ReactiveFormsModule,
    FormField,
    UppercaseValueDirective,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Standalone vs form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Standalone vs Form Field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Outside a form-field the directive paints its own border, hover state, and focus ring so a
        bare
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input twInput&gt;</code>
        looks presentable without extra scaffolding. Drop the same element inside
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code>
        and the directive strips its own chrome — the form-field owns the border, floats the
        label, and wires
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>
        to any hint / error regions.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Standalone</p>
          <div class="space-y-3 max-w-md">
            <input twInput placeholder="Search projects…" />
            <input twInput type="email" placeholder="you@example.com" />
            <textarea twInput rows="3" placeholder="Notes on this release…"></textarea>
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Inside tw-form-field</p>
          <tw-form-field>
            <label twLabel>Email</label>
            <input twInput type="email" />
            <span twHint>We'll never share your email.</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="standaloneVsFieldSnippet" language="html" />
    </section>

    <!-- Types -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Input Types</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every native HTML input type works — the directive forwards
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type</code>
        through to the underlying element. Dev mode throws on the types that belong to dedicated
        ngx-tw components (<code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">checkbox</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">radio</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">submit</code>, etc.) so you
        don't accidentally double-style them.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-form-field>
          <label twLabel>Email</label>
          <input twInput type="email" placeholder="you@example.com" />
        </tw-form-field>
        <tw-form-field>
          <label twLabel>Password</label>
          <input twInput type="password" />
        </tw-form-field>
        <tw-form-field>
          <label twLabel>Age</label>
          <input twInput type="number" min="0" max="120" />
        </tw-form-field>
        <tw-form-field floatLabel="always">
          <label twLabel>Date of birth</label>
          <input twInput type="date" />
        </tw-form-field>
      </div>
      <tw-code-block [code]="typesSnippet" language="html" />
    </section>

    <!-- Prefix & suffix -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Prefix &amp; Suffix</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project content into the form-field's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="prefix"]</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="suffix"]</code>
        to flank the input with inline adornments — currency symbols, unit labels, URL schemes,
        icon buttons. Prefix / suffix content is visual only; always pair icons with a real label
        for assistive tech.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-form-field>
          <label twLabel>Amount</label>
          <span slot="prefix">$</span>
          <input twInput type="number" />
          <span slot="suffix">USD</span>
        </tw-form-field>
        <tw-form-field>
          <label twLabel>Website</label>
          <span slot="prefix">https://</span>
          <input twInput placeholder="example.com" />
        </tw-form-field>
      </div>
      <tw-code-block [code]="prefixSuffixSnippet" language="html" />
    </section>

    <!-- Textarea -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Textarea</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The same directive attaches to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea twInput&gt;</code>
        and keeps every feature — form-field integration, error state, autofill tracking. Use a
        second
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twHint</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="end"</code>
        for a trailing character counter.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-form-field>
          <label twLabel>Bio</label>
          <textarea twInput rows="3" maxlength="240" [(ngModel)]="bio" name="bio"></textarea>
          <span twHint>A short blurb for your profile page.</span>
          <span twHint align="end">{{ bio().length }} / 240</span>
        </tw-form-field>
        <textarea twInput rows="4" placeholder="Standalone textarea — default chrome."></textarea>
      </div>
      <tw-code-block [code]="textareaSnippet" language="html" />
    </section>

    <!-- Disabled & read-only -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled &amp; Read-only</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        prevents interaction and dims the field — use it when the value is not editable yet
        (awaiting dependent data) or permanently for the current user.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code>
        keeps the field focusable and selectable but blocks edits — useful when the value should
        be copyable (IDs, generated tokens) but not user-mutable.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-form-field>
          <label twLabel>Account ID</label>
          <input twInput readonly value="acct_1Kj8dFZ9oX2p" />
          <span twHint>Read-only — select to copy.</span>
        </tw-form-field>
        <tw-form-field>
          <label twLabel>Legacy slug</label>
          <input twInput [disabled]="true" value="acme-corp-2019" />
          <span twHint>Disabled — slugs can no longer be edited after the v3 migration.</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Template-driven forms -->
    <section class="mb-10" data-section="td">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        just like a plain input. The directive picks up the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgControl</code>
        automatically, so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        inference and error-state tracking work without extra wiring.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Display name</label>
          <input
            twInput
            name="displayName"
            [(ngModel)]="displayName"
            [disabled]="displayNameDisabled()"
            required
          />
          <span twHint>Bound model below.</span>
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ displayName() }}" · disabled = {{ displayNameDisabled() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button
            twButton variant="outline" color="neutral" size="xs"
            (click)="displayName.set('Ada Lovelace')"
          >Set value</button>
          <button
            twButton variant="outline" color="neutral" size="xs"
            (click)="displayNameDisabled.set(!displayNameDisabled())"
          >Toggle disabled</button>
          <button
            twButton variant="outline" color="neutral" size="xs"
            (click)="displayName.set(''); displayNameDisabled.set(false)"
          >Reset</button>
        </div>
      </div>
      <tw-code-block [code]="ngModelTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="ngModelHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Reactive forms -->
    <section class="mb-10" data-section="reactive">
      <h2 class="text-sm font-semibold mb-3">Reactive Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code>
        or use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code>
        inside a form group. Toggling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable()</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">enable()</code>
        on the control propagates to the native element, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">reset()</code>
        clears the value without touching validators.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Username</label>
          <input twInput [formControl]="usernameCtrl" />
          <span twHint>At least 3 characters.</span>
          @if (usernameCtrl.hasError('required')) {
            <span twError>Username is required.</span>
          }
          @if (usernameCtrl.hasError('minlength')) {
            <span twError>Too short.</span>
          }
        </tw-form-field>

        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ usernameCtrl.value }}" · touched = {{ usernameCtrl.touched }} · valid = {{ usernameCtrl.valid }} · disabled = {{ usernameCtrl.disabled }}
        </p>

        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="usernameCtrl.setValue('Ada Lovelace')">Set value</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="usernameCtrl.disable()">Disable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="usernameCtrl.enable()">Enable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="usernameCtrl.markAsTouched()">Mark touched</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="usernameCtrl.reset('')">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="reactiveTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Signal forms -->
    <section class="mb-10" data-section="signal">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Angular v21 signal forms attach through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal stays in sync with the input and exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        as signals you can read anywhere in the template.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Full name</label>
          <input twInput [formField]="signalForm.fullName" />
          <span twHint>Minimum 2 characters.</span>
          @if (signalForm.fullName().errors().length && signalForm.fullName().touched()) {
            <span twError>Full name is required (min 2 chars).</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ signalForm.fullName().value() || '' }}" · touched = {{ signalForm.fullName().touched() }} · valid = {{ signalForm.fullName().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fullName().value.set('Ada Lovelace')">Set value</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.fullName().reset('')">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="signalTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Custom error matcher -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Error-State Matcher</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        By default the field enters the error state when the control is invalid and either
        touched or dirty — mirroring Angular Material's default. Override that rule per field via
        the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorStateMatcher</code>
        input, or globally by providing a value for the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_ERROR_STATE_MATCHER</code>
        token. The matcher below only shows errors after the form is submitted — typing and
        clicking away doesn't trigger the error state.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
          <tw-form-field>
            <label twLabel>Email</label>
            <input twInput [formControl]="submitOnlyCtrl" [errorStateMatcher]="submitOnlyMatcher" />
            <span twHint>Try typing then clicking away — no error until you submit.</span>
            @if (submitOnlyCtrl.hasError('required')) {
              <span twError>Email is required.</span>
            }
            @if (submitOnlyCtrl.hasError('email')) {
              <span twError>Enter a valid email address.</span>
            }
          </tw-form-field>
          <button twButton type="submit" size="sm">Submit</button>
        </form>
      </div>
      <tw-code-block [code]="matcherTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="matcherHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Custom value accessor -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Value Accessor</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Provide
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_INPUT_VALUE_ACCESSOR</code>
        from a sibling directive to own value storage on top of an existing
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;input twInput&gt;</code>.
        This is the extension point that masked inputs, date-picker triggers, and currency
        formatters use — the directive below uppercases every keystroke as a minimal example.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Product code</label>
          <input twInput uppercaseValue />
          <span twHint>Every character is normalized to uppercase.</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="accessorTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="accessorHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine the common boolean states and input type to audition the field's appearance. A
        realistic starting config is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">type="text"</code>
        with the field inside a form-field and nothing else enabled — that's the shape of most
        application forms.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Element</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Control</label>
                <div class="flex gap-1">
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playControl() === 'input'"
                    [class.!text-primary-700]="playControl() === 'input'"
                    (click)="playControl.set('input')"
                  >input</button>
                  <button
                    twButton variant="ghost" color="neutral" size="xs"
                    [class.!bg-primary-100]="playControl() === 'textarea'"
                    [class.!text-primary-700]="playControl() === 'textarea'"
                    (click)="playControl.set('textarea')"
                  >textarea</button>
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Type (input only)</label>
                <div class="flex flex-wrap gap-1">
                  @for (t of types; track t) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playType() === t"
                      [class.!text-primary-700]="playType() === t"
                      [disabled]="playControl() === 'textarea'"
                      (click)="playType.set(t)"
                    >{{ t }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Wrapper</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playInFormField()"
                [class.!text-primary-700]="playInFormField()"
                (click)="playInFormField.update(v => !v)"
              >inside tw-form-field</button>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">State</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playReadonly()"
                [class.!text-primary-700]="playReadonly()"
                (click)="playReadonly.update(v => !v)"
              >readonly</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playRequired()"
                [class.!text-primary-700]="playRequired()"
                (click)="playRequired.update(v => !v)"
              >required</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playError()"
                [class.!text-primary-700]="playError()"
                (click)="playError.update(v => !v)"
              >error (touch + invalid)</button>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          @if (playInFormField()) {
            <tw-form-field>
              <label twLabel>Playground field</label>
              @if (playControl() === 'input') {
                <input
                  twInput
                  [type]="playType()"
                  [formControl]="playCtrl"
                  [disabled]="playDisabled()"
                  [readonly]="playReadonly()"
                  [required]="playRequired()"
                />
              } @else {
                <textarea
                  twInput
                  rows="3"
                  [formControl]="playCtrl"
                  [disabled]="playDisabled()"
                  [readonly]="playReadonly()"
                  [required]="playRequired()"
                ></textarea>
              }
              <span twHint>Type into the field to see behavior.</span>
              @if (playError() && playRequired()) {
                <span twError>This field is required.</span>
              }
            </tw-form-field>
          } @else {
            @if (playControl() === 'input') {
              <input
                twInput
                [type]="playType()"
                [formControl]="playCtrl"
                [disabled]="playDisabled()"
                [readonly]="playReadonly()"
                [required]="playRequired()"
                placeholder="Standalone input"
              />
            } @else {
              <textarea
                twInput
                rows="3"
                [formControl]="playCtrl"
                [disabled]="playDisabled()"
                [readonly]="playReadonly()"
                [required]="playRequired()"
                placeholder="Standalone textarea"
              ></textarea>
            }
          }
        </div>
      </div>
    </section>
  `,
})
export class InputExamples {
  protected readonly displayName = signal('');
  protected readonly displayNameDisabled = signal(false);
  protected readonly bio = signal('');

  protected readonly usernameCtrl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(3)],
  });

  protected readonly submitOnlyCtrl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  });
  protected readonly submitOnlyMatcher = SUBMIT_ONLY_MATCHER;

  protected readonly signalModel = signal({ fullName: '' });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.fullName);
    minLength(p.fullName, 2);
  });

  protected onSubmit(): void {
    // ngSubmit triggers the form's `submitted` flag; the matcher reads it.
  }

  // Playground
  protected readonly types: readonly string[] = ['text', 'email', 'password', 'number', 'search', 'tel', 'url'];
  protected readonly playControl = signal<'input' | 'textarea'>('input');
  protected readonly playType = signal('text');
  protected readonly playInFormField = signal(true);
  protected readonly playDisabled = signal(false);
  protected readonly playReadonly = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playError = signal(false);
  protected readonly playCtrl = new FormControl<string>('', { nonNullable: true });

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly standaloneVsFieldSnippet = `<!-- Standalone — directive paints its own chrome -->
<input twInput placeholder="Search projects…" />
<textarea twInput rows="3" placeholder="Notes on this release…"></textarea>

<!-- Inside tw-form-field — directive strips its chrome; wrapper owns it -->
<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" />
  <span twHint>We'll never share your email.</span>
</tw-form-field>`;

  protected readonly typesSnippet = `<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" placeholder="you@example.com" />
</tw-form-field>
<tw-form-field>
  <label twLabel>Password</label>
  <input twInput type="password" />
</tw-form-field>
<tw-form-field>
  <label twLabel>Age</label>
  <input twInput type="number" min="0" max="120" />
</tw-form-field>

<!-- Date controls are "never empty" — float the label always -->
<tw-form-field floatLabel="always">
  <label twLabel>Date of birth</label>
  <input twInput type="date" />
</tw-form-field>`;

  protected readonly prefixSuffixSnippet = `<tw-form-field>
  <label twLabel>Amount</label>
  <span slot="prefix">$</span>
  <input twInput type="number" />
  <span slot="suffix">USD</span>
</tw-form-field>

<tw-form-field>
  <label twLabel>Website</label>
  <span slot="prefix">https://</span>
  <input twInput placeholder="example.com" />
</tw-form-field>`;

  protected readonly textareaSnippet = `<tw-form-field>
  <label twLabel>Bio</label>
  <textarea twInput rows="3" maxlength="240" [(ngModel)]="bio" name="bio"></textarea>
  <span twHint>A short blurb for your profile page.</span>
  <span twHint align="end">{{ bio().length }} / 240</span>
</tw-form-field>

<!-- Standalone textarea — default chrome -->
<textarea twInput rows="4" placeholder="…"></textarea>`;

  protected readonly disabledSnippet = `<!-- Read-only: focusable and copyable, not editable -->
<tw-form-field>
  <label twLabel>Account ID</label>
  <input twInput readonly value="acct_1Kj8dFZ9oX2p" />
  <span twHint>Read-only — select to copy.</span>
</tw-form-field>

<!-- Disabled: removed from the tab order, dimmed, not submitted -->
<tw-form-field>
  <label twLabel>Legacy slug</label>
  <input twInput [disabled]="true" value="acme-corp-2019" />
</tw-form-field>`;

  protected readonly ngModelTsSnippet = `protected readonly displayName = signal('');
protected readonly displayNameDisabled = signal(false);`;

  protected readonly ngModelHtmlSnippet = `<tw-form-field>
  <label twLabel>Display name</label>
  <input
    twInput
    name="displayName"
    [(ngModel)]="displayName"
    [disabled]="displayNameDisabled()"
    required
  />
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly usernameCtrl = new FormControl<string>('', {
  nonNullable: true,
  validators: [Validators.required, Validators.minLength(3)],
});`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Username</label>
  <input twInput [formControl]="usernameCtrl" />
  <span twHint>At least 3 characters.</span>
  @if (usernameCtrl.hasError('required')) {
    <span twError>Username is required.</span>
  }
  @if (usernameCtrl.hasError('minlength')) {
    <span twError>Too short.</span>
  }
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly signalModel = signal({ fullName: '' });
protected readonly signalForm = form(this.signalModel, (p) => {
  required(p.fullName);
  minLength(p.fullName, 2);
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Full name</label>
  <input twInput [formField]="signalForm.fullName" />
  <span twHint>Minimum 2 characters.</span>
  @if (signalForm.fullName().errors().length && signalForm.fullName().touched()) {
    <span twError>Full name is required (min 2 chars).</span>
  }
</tw-form-field>

<!-- Note: FieldState.reset() resets only touched/dirty by default; pass an
     explicit value if you want to clear the model too. -->
<button (click)="signalForm.fullName().reset('')">Reset</button>`;

  protected readonly matcherTsSnippet = `import type { ErrorStateMatcher } from 'ngx-tw/core';

const SUBMIT_ONLY_MATCHER: ErrorStateMatcher = {
  isErrorState(control, form) {
    return !!control?.invalid && !!form?.submitted;
  },
};

protected readonly submitOnlyCtrl = new FormControl<string>('', {
  nonNullable: true,
  validators: [Validators.required, Validators.email],
});
protected readonly submitOnlyMatcher = SUBMIT_ONLY_MATCHER;`;

  protected readonly matcherHtmlSnippet = `<form (ngSubmit)="onSubmit()" #f="ngForm">
  <tw-form-field>
    <label twLabel>Email</label>
    <input
      twInput
      [formControl]="submitOnlyCtrl"
      [errorStateMatcher]="submitOnlyMatcher"
    />
    @if (submitOnlyCtrl.hasError('required')) {
      <span twError>Email is required.</span>
    }
  </tw-form-field>
  <button twButton type="submit">Submit</button>
</form>`;

  protected readonly accessorTsSnippet = `@Directive({
  selector: 'input[uppercaseValue]',
  providers: [
    { provide: TW_INPUT_VALUE_ACCESSOR, useExisting: UppercaseValueDirective },
  ],
  host: {
    '(input)': '_onInput($event)',
    '[value]': 'value()',
  },
})
class UppercaseValueDirective {
  readonly value: WritableSignal<string> = signal('');

  _onInput(event: Event): void {
    this.value.set((event.target as HTMLInputElement).value.toUpperCase());
  }
}`;

  protected readonly accessorHtmlSnippet = `<tw-form-field>
  <label twLabel>Product code</label>
  <input twInput uppercaseValue />
  <span twHint>Every character is normalized to uppercase.</span>
</tw-form-field>`;
}
