import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { email, form, FormField, required } from '@angular/forms/signals';
import type { TwColor } from 'ngx-tw/core';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  PrefixDirective,
  SuffixDirective,
} from 'ngx-tw/form-field';
import type { FloatLabel, FormFieldAppearance } from 'ngx-tw/form-field';
import { InputDirective } from 'ngx-tw/input';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

const COLORS: TwColor[] = [
  'primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error',
];
const APPEARANCES: FormFieldAppearance[] = ['outline', 'filled'];
const FLOAT_LABELS: FloatLabel[] = ['auto', 'always'];

@Component({
  selector: 'app-form-field-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    PrefixDirective,
    SuffixDirective,
    InputDirective,
    ButtonDirective,
    CodeBlockComponent,
    ReactiveFormsModule,
    FormsModule,
    FormField,
  ],
  template: `
    <!-- Appearance -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Appearance</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">appearance</code>
        input is the primary visual axis. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        for neutral surfaces where the field should carry its own weight, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">filled</code>
        when fields sit close together or inside a dense form where the surface tint
        improves scannability.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <tw-form-field appearance="outline">
            <label twLabel>Outline</label>
            <input twInput placeholder="Acme Industries" />
            <span twHint>Full legal company name.</span>
          </tw-form-field>

          <tw-form-field appearance="filled">
            <label twLabel>Filled</label>
            <input twInput placeholder="Acme Industries" />
            <span twHint>Full legal company name.</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="appearanceSnippet" language="html" />
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints the focused border and the floated label. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code>
        for the main form surface, semantic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        when a form region needs a themed accent, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        when the field should read as a supporting control. Focus any field below to see its
        accent appear.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          @for (c of colors; track c) {
            <tw-form-field [color]="c" floatLabel="always">
              <label twLabel>{{ labelFor(c) }}</label>
              <input twInput [placeholder]="placeholderFor(c)" />
            </tw-form-field>
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        When the wrapped control enters its error state, the field always tints red regardless
        of the configured color — validation feedback takes priority over theming.
      </p>
    </section>

    <!-- Floating Label -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Floating Label</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">auto</code>
        keeps the label in its resting position until the field is focused or non-empty, then
        floats it to the border. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">always</code>
        when you need the label visible from the start — typically when fields have
        placeholders the user should read before filling the value.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <tw-form-field floatLabel="auto">
            <label twLabel>Auto (default)</label>
            <input twInput />
          </tw-form-field>

          <tw-form-field floatLabel="always">
            <label twLabel>Always floated</label>
            <input twInput placeholder="e.g. Remote, EU" />
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="floatLabelSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A disabled wrapped control fades the whole field and blocks pointer interaction.
        Required controls show a red asterisk next to the label; hide it with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hideRequiredMarker</code>
        for forms where every visible field is required — the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required</code>
        attribute on the control stays set either way.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled</p>
            <tw-form-field>
              <label twLabel>Account tier</label>
              <input twInput [disabled]="true" value="Enterprise — managed by billing" />
              <span twHint>Contact your administrator to upgrade.</span>
            </tw-form-field>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required marker</p>
            <tw-form-field>
              <label twLabel>Username</label>
              <input twInput required placeholder="jane-doe" />
              <span twHint>3–20 characters; letters, numbers, and hyphens only.</span>
            </tw-form-field>
          </div>

          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required, marker hidden</p>
            <tw-form-field [hideRequiredMarker]="true">
              <label twLabel>Work email</label>
              <input twInput type="email" required placeholder="you@company.com" />
              <span twHint>The asterisk is hidden, but screen readers still hear "required".</span>
            </tw-form-field>
          </div>
        </div>
      </div>
      <tw-code-block [code]="statesSnippet" language="html" />
    </section>

    <!-- Prefix & Suffix -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Prefix &amp; Suffix</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project adornments through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slot="prefix"</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">slot="suffix"</code>
        for currency symbols, units, search icons, and keyboard shortcut hints. The resting
        label shifts right to sit flush against the prefix, so the layout still reads as a
        single cohesive row.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <tw-form-field>
            <label twLabel>Amount</label>
            <span slot="prefix" class="font-medium text-fg">$</span>
            <input twInput type="number" placeholder="0.00" />
            <span slot="suffix" class="text-xs font-medium">USD</span>
            <span twHint>Pre-tax total.</span>
          </tw-form-field>

          <tw-form-field appearance="filled">
            <label twLabel>Search</label>
            <svg slot="prefix" class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd"/>
            </svg>
            <input twInput placeholder="Search invoices, clients, or projects" />
            <kbd slot="suffix" class="text-2xs font-mono bg-surface-sunken border border-border rounded px-1.5 py-0.5 text-fg-muted">⌘K</kbd>
          </tw-form-field>

          <tw-form-field>
            <label twLabel>Website</label>
            <span slot="prefix" class="text-fg-muted font-mono text-xs">https://</span>
            <input twInput placeholder="example.com" />
          </tw-form-field>

          <tw-form-field>
            <label twLabel>Storage quota</label>
            <input twInput type="number" placeholder="100" />
            <span slot="suffix" class="text-xs font-medium">GB</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="prefixSuffixSnippet" language="html" />
    </section>

    <!-- Hints -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Hints</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project up to two
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twHint</code>
        elements — one with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="start"</code>
        and one with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="end"</code>.
        The start hint typically describes the field; the end hint carries a live counter or
        secondary metadata. Both are merged into the control's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-6">
          <tw-form-field>
            <label twLabel>Project name</label>
            <input twInput [(ngModel)]="projectName" name="projectName" maxlength="48" />
            <span twHint>Visible to every workspace member.</span>
            <span twHint align="end">{{ projectName().length }} / 48</span>
          </tw-form-field>

          <tw-form-field>
            <label twLabel>API key</label>
            <input twInput value="sk_live_••••••••••••d3f" [disabled]="true" />
            <span twHint>Rotated every 90 days.</span>
            <span twHint align="end">Last used 2 hours ago</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="hintsSnippet" language="html" />
    </section>

    <!-- Textarea -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Textarea</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twInput</code>
        directive attaches to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;textarea&gt;</code>
        exactly the same way. The floating label tracks the first line, the hint subscript
        works the same, and a start/end hint pair is a natural fit for a remaining-characters
        counter.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Release notes</label>
          <textarea
            twInput
            rows="4"
            maxlength="280"
            [(ngModel)]="releaseNotes"
            name="releaseNotes"
            placeholder="What changed, why it matters, and what to watch for."
          ></textarea>
          <span twHint>Markdown supported.</span>
          <span twHint align="end">{{ releaseNotes().length }} / 280</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="textareaSnippet" language="html" />
    </section>

    <!-- Template-Driven Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind the wrapped control with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        and native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minlength</code>
        attributes — the form-field reads the resulting error state and flips the subscript
        automatically. The example below echoes the current value to confirm the binding.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-sm">
          <label twLabel>Display name</label>
          <input twInput name="displayName" [(ngModel)]="displayName" required minlength="2" />
          <span twHint>Shown next to your avatar in the sidebar.</span>
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono">value = "{{ displayName() || '' }}"</p>
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
        With a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormGroup</code>,
        every field mirrors its control's validity and touched state. Project one
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twError</code>
        per failure condition and let the form-field swap the hint for the active error when
        the control enters its error state. Press
        <strong class="text-fg">Validate</strong>
        to mark every control as touched and surface all pending errors at once.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <form [formGroup]="inviteForm" (ngSubmit)="submitInvite()" class="space-y-5">
          <div class="space-y-4">
            <tw-form-field>
              <label twLabel>Full name</label>
              <input twInput formControlName="name" placeholder="Alex Morgan" />
              <span twHint>How teammates will see you in the workspace.</span>
              @if (inviteForm.controls.name.hasError('required')) {
                <span twError>Enter your full name.</span>
              }
              @if (inviteForm.controls.name.hasError('minlength')) {
                <span twError>Name must be at least 2 characters.</span>
              }
            </tw-form-field>

            <tw-form-field>
              <label twLabel>Work email</label>
              <span slot="prefix">
                <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path d="M3 4a2 2 0 00-2 2v1.161l8.441 4.221a1.25 1.25 0 001.118 0L19 7.162V6a2 2 0 00-2-2H3z"/>
                  <path d="M19 8.839l-7.77 3.885a2.75 2.75 0 01-2.46 0L1 8.839V14a2 2 0 002 2h14a2 2 0 002-2V8.839z"/>
                </svg>
              </span>
              <input twInput type="email" formControlName="email" placeholder="you@company.com" />
              <span twHint>Invitation and receipts go here.</span>
              @if (inviteForm.controls.email.hasError('required')) {
                <span twError>Email is required.</span>
              }
              @if (inviteForm.controls.email.hasError('email')) {
                <span twError>Enter a valid email address.</span>
              }
            </tw-form-field>

            <tw-form-field appearance="filled">
              <label twLabel>Seat count</label>
              <input twInput type="number" formControlName="seats" min="1" max="50" />
              <span slot="suffix" class="text-xs font-medium">seats</span>
              <span twHint>Between 1 and 50.</span>
              @if (inviteForm.controls.seats.hasError('required')) {
                <span twError>Pick a seat count.</span>
              }
              @if (inviteForm.controls.seats.hasError('min') || inviteForm.controls.seats.hasError('max')) {
                <span twError>Must be between 1 and 50.</span>
              }
            </tw-form-field>
          </div>

          <div class="flex items-center gap-2 pt-2 border-t border-border">
            <button twButton type="submit" color="primary" size="sm">Send invite</button>
            <button twButton type="button" variant="outline" color="neutral" size="sm" (click)="markInviteTouched()">
              Validate
            </button>
            <button twButton type="button" variant="ghost" color="neutral" size="sm" (click)="resetInvite()">
              Reset
            </button>
            <span class="ml-auto text-xs text-fg-muted font-mono">
              valid = {{ inviteForm.valid }}
            </span>
          </div>
        </form>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="reactiveTsSnippet" language="ts" />
        <tw-code-block [code]="reactiveHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Errors only render when the control is both invalid and touched — that's the default
        matcher. For immediate feedback on blur, nothing else needs changing; for immediate
        feedback on change, mark the control as touched in a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueChanges</code>
        subscription.
      </p>
    </section>

    <!-- Signal Forms -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Signal Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For Angular v21 signal forms, build a model with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>
        and bind each control with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errors</code>,
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        so you can drive error rendering without subscribing to anything.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field class="max-w-sm">
          <label twLabel>Email (signal forms)</label>
          <input twInput type="email" [formField]="signalForm.email" placeholder="you@company.com" />
          <span twHint>Used for account recovery.</span>
          @if (signalForm.email().errors().length && signalForm.email().touched()) {
            <span twError>Enter a valid email.</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = "{{ signalForm.email().value() || '' }}" ·
          touched = {{ signalForm.email().touched() }} ·
          valid = {{ signalForm.email().valid() }}
        </p>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="signalTsSnippet" language="ts" />
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every form-field input at once. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        to reveal the asterisk, switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">appearance</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        together to preview themed filled fields, or flip
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">floatLabel</code>
        to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">always</code>
        when pairing the label with a placeholder.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Appearance</label>
            <div class="flex gap-1">
              @for (a of appearances; track a) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playAppearance() === a"
                  [class.!text-primary-700]="playAppearance() === a"
                  (click)="playAppearance.set(a)"
                >{{ a }}</button>
              }
            </div>
          </div>

          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Float label</label>
            <div class="flex gap-1">
              @for (f of floatLabels; track f) {
                <button
                  twButton variant="ghost" color="neutral" size="xs"
                  [class.!bg-primary-100]="playFloatLabel() === f"
                  [class.!text-primary-700]="playFloatLabel() === f"
                  (click)="playFloatLabel.set(f)"
                >{{ f }}</button>
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Flags</label>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playRequired()"
                [class.!text-primary-700]="playRequired()"
                (click)="playRequired.update(v => !v)"
              >required</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playHideMarker()"
                [class.!text-primary-700]="playHideMarker()"
                (click)="playHideMarker.update(v => !v)"
              >hide marker</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDisabled()"
                [class.!text-primary-700]="playDisabled()"
                (click)="playDisabled.update(v => !v)"
              >disabled</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playPrefix()"
                [class.!text-primary-700]="playPrefix()"
                (click)="playPrefix.update(v => !v)"
              >prefix</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playSuffix()"
                [class.!text-primary-700]="playSuffix()"
                (click)="playSuffix.update(v => !v)"
              >suffix</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playHintEnd()"
                [class.!text-primary-700]="playHintEnd()"
                (click)="playHintEnd.update(v => !v)"
              >end hint</button>
            </div>
          </div>
        </div>

        <div class="p-8 rounded-lg bg-surface-sunken">
          <tw-form-field
            class="max-w-md"
            [appearance]="playAppearance()"
            [floatLabel]="playFloatLabel()"
            [color]="playColor()"
            [hideRequiredMarker]="playHideMarker()"
          >
            <label twLabel>Domain</label>
            @if (playPrefix()) {
              <span slot="prefix" class="text-fg-muted font-mono text-xs">https://</span>
            }
            <input
              twInput
              [(ngModel)]="playValue"
              name="playDomain"
              [required]="playRequired()"
              [disabled]="playDisabled()"
              placeholder="example.com"
            />
            @if (playSuffix()) {
              <span slot="suffix" class="text-xs font-medium">.com</span>
            }
            <span twHint>Where visitors will reach your site.</span>
            @if (playHintEnd()) {
              <span twHint align="end">{{ playValue().length }} chars</span>
            }
          </tw-form-field>
          <p class="text-xs text-fg-muted mt-4 font-mono">value = "{{ playValue() }}"</p>
        </div>
      </div>
    </section>
  `,
})
export class FormFieldExamples {
  protected readonly colors = COLORS;
  protected readonly appearances = APPEARANCES;
  protected readonly floatLabels = FLOAT_LABELS;

  // Section-local state
  protected readonly projectName = signal('Payments rewrite');
  protected readonly releaseNotes = signal('');
  protected readonly displayName = signal('');

  // Reactive form
  protected readonly inviteForm = new FormGroup({
    name: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.minLength(2)],
    }),
    email: new FormControl<string>('', {
      nonNullable: true,
      validators: [Validators.required, Validators.email],
    }),
    seats: new FormControl<number | null>(null, {
      validators: [Validators.required, Validators.min(1), Validators.max(50)],
    }),
  });

  // Signal form
  protected readonly signalModel = signal({ email: '' });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.email);
    email(p.email);
  });

  // Playground
  protected readonly playAppearance = signal<FormFieldAppearance>('outline');
  protected readonly playFloatLabel = signal<FloatLabel>('auto');
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playRequired = signal(false);
  protected readonly playHideMarker = signal(false);
  protected readonly playDisabled = signal(false);
  protected readonly playPrefix = signal(true);
  protected readonly playSuffix = signal(false);
  protected readonly playHintEnd = signal(false);
  protected readonly playValue = signal('');

  protected submitInvite(): void {
    this.markInviteTouched();
  }

  protected markInviteTouched(): void {
    this.inviteForm.markAllAsTouched();
  }

  protected resetInvite(): void {
    this.inviteForm.reset({ name: '', email: '', seats: null });
  }

  protected labelFor(color: TwColor): string {
    const labels: Record<TwColor, string> = {
      primary: 'Workspace name',
      secondary: 'Team handle',
      accent: 'Display color',
      neutral: 'Notes',
      info: 'Help topic',
      success: 'Confirmation code',
      warning: 'Grace period',
      error: 'Incident ID',
    };
    return labels[color];
  }

  protected placeholderFor(color: TwColor): string {
    const placeholders: Record<TwColor, string> = {
      primary: 'Acme HQ',
      secondary: '@acme-growth',
      accent: '#7c3aed',
      neutral: 'Optional',
      info: 'Billing',
      success: '8-digit code',
      warning: '7 days',
      error: 'INC-1042',
    };
    return placeholders[color];
  }

  // ── Code snippets ──

  protected readonly appearanceSnippet = `<tw-form-field appearance="outline">
  <label twLabel>Outline</label>
  <input twInput placeholder="Acme Industries" />
  <span twHint>Full legal company name.</span>
</tw-form-field>

<tw-form-field appearance="filled">
  <label twLabel>Filled</label>
  <input twInput placeholder="Acme Industries" />
  <span twHint>Full legal company name.</span>
</tw-form-field>`;

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-form-field [color]="c" floatLabel="always">
    <label twLabel>{{ labelFor(c) }}</label>
    <input twInput [placeholder]="placeholderFor(c)" />
  </tw-form-field>
}`.trim();

  protected readonly floatLabelSnippet = `<tw-form-field floatLabel="auto">
  <label twLabel>Auto (default)</label>
  <input twInput />
</tw-form-field>

<tw-form-field floatLabel="always">
  <label twLabel>Always floated</label>
  <input twInput placeholder="e.g. Remote, EU" />
</tw-form-field>`;

  protected readonly statesSnippet = `<!-- Disabled -->
<tw-form-field>
  <label twLabel>Account tier</label>
  <input twInput [disabled]="true" value="Enterprise — managed by billing" />
  <span twHint>Contact your administrator to upgrade.</span>
</tw-form-field>

<!-- Required (marker visible) -->
<tw-form-field>
  <label twLabel>Username</label>
  <input twInput required placeholder="jane-doe" />
</tw-form-field>

<!-- Required, marker hidden -->
<tw-form-field [hideRequiredMarker]="true">
  <label twLabel>Work email</label>
  <input twInput type="email" required placeholder="you@company.com" />
</tw-form-field>`;

  protected readonly prefixSuffixSnippet = `<tw-form-field>
  <label twLabel>Amount</label>
  <span slot="prefix">$</span>
  <input twInput type="number" placeholder="0.00" />
  <span slot="suffix">USD</span>
  <span twHint>Pre-tax total.</span>
</tw-form-field>

<tw-form-field appearance="filled">
  <label twLabel>Search</label>
  <svg slot="prefix" class="size-4">…</svg>
  <input twInput placeholder="Search invoices, clients, or projects" />
  <kbd slot="suffix">⌘K</kbd>
</tw-form-field>`;

  protected readonly hintsSnippet = `<tw-form-field>
  <label twLabel>Project name</label>
  <input twInput [(ngModel)]="projectName" name="projectName" maxlength="48" />
  <span twHint>Visible to every workspace member.</span>
  <span twHint align="end">{{ projectName().length }} / 48</span>
</tw-form-field>`;

  protected readonly textareaSnippet = `<tw-form-field>
  <label twLabel>Release notes</label>
  <textarea
    twInput
    rows="4"
    maxlength="280"
    [(ngModel)]="releaseNotes"
    name="releaseNotes"
    placeholder="What changed, why it matters, and what to watch for."
  ></textarea>
  <span twHint>Markdown supported.</span>
  <span twHint align="end">{{ releaseNotes().length }} / 280</span>
</tw-form-field>`;

  protected readonly tdTsSnippet = `protected readonly displayName = signal('');`;

  protected readonly tdHtmlSnippet = `<tw-form-field>
  <label twLabel>Display name</label>
  <input twInput name="displayName" [(ngModel)]="displayName" required minlength="2" />
  <span twHint>Shown next to your avatar in the sidebar.</span>
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly inviteForm = new FormGroup({
  name: new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.minLength(2)],
  }),
  email: new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.email],
  }),
  seats: new FormControl<number | null>(null, {
    validators: [Validators.required, Validators.min(1), Validators.max(50)],
  }),
});`;

  protected readonly reactiveHtmlSnippet = `<form [formGroup]="inviteForm" (ngSubmit)="submitInvite()">
  <tw-form-field>
    <label twLabel>Full name</label>
    <input twInput formControlName="name" placeholder="Alex Morgan" />
    <span twHint>How teammates will see you in the workspace.</span>
    @if (inviteForm.controls.name.hasError('required')) {
      <span twError>Enter your full name.</span>
    }
    @if (inviteForm.controls.name.hasError('minlength')) {
      <span twError>Name must be at least 2 characters.</span>
    }
  </tw-form-field>

  <tw-form-field>
    <label twLabel>Work email</label>
    <input twInput type="email" formControlName="email" />
    <span twHint>Invitation and receipts go here.</span>
    @if (inviteForm.controls.email.hasError('required')) {
      <span twError>Email is required.</span>
    }
    @if (inviteForm.controls.email.hasError('email')) {
      <span twError>Enter a valid email address.</span>
    }
  </tw-form-field>

  <tw-form-field appearance="filled">
    <label twLabel>Seat count</label>
    <input twInput type="number" formControlName="seats" min="1" max="50" />
    <span slot="suffix">seats</span>
    @if (inviteForm.controls.seats.hasError('required')) {
      <span twError>Pick a seat count.</span>
    }
  </tw-form-field>
</form>`;

  protected readonly signalTsSnippet = `protected readonly model = signal({ email: '' });
protected readonly inviteForm = form(this.model, (p) => {
  required(p.email);
  email(p.email);
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Email</label>
  <input twInput type="email" [formField]="inviteForm.email" />
  <span twHint>Used for account recovery.</span>
  @if (inviteForm.email().errors().length && inviteForm.email().touched()) {
    <span twError>Enter a valid email.</span>
  }
</tw-form-field>`;
}
