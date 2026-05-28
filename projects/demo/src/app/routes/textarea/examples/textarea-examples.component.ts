import {
  ChangeDetectionStrategy,
  Component,
  signal,
} from '@angular/core';
import {
  FormControl,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { form, FormField, minLength, required } from '@angular/forms/signals';
import type { ErrorStateMatcher, TwSize } from 'ngx-tw/core';
import {
  ErrorDirective,
  FormFieldComponent,
  HintDirective,
  LabelDirective,
  SuffixDirective,
} from 'ngx-tw/form-field';
import { TextareaDirective, type TwTextareaResize } from 'ngx-tw/textarea';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

const SUBMIT_ONLY_MATCHER: ErrorStateMatcher = {
  isErrorState(control, form) {
    return !!control?.invalid && !!form?.submitted;
  },
};

@Component({
  selector: 'app-textarea-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    TextareaDirective,
    FormFieldComponent,
    LabelDirective,
    HintDirective,
    ErrorDirective,
    SuffixDirective,
    FormsModule,
    ReactiveFormsModule,
    FormField,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Standalone vs form-field -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Standalone vs Form Field</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Outside a form-field the textarea paints its own border, hover state, and focus ring.
        Drop the same element inside <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">&lt;tw-form-field&gt;</code> and the directive strips its own chrome — the form-field
        owns the border, floats the label, and wires <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-describedby</code> to hint / error regions.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Standalone</p>
          <div class="space-y-3 max-w-md">
            <textarea twTextarea rows="3" placeholder="Notes on this release…"></textarea>
          </div>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Inside tw-form-field</p>
          <tw-form-field>
            <label twLabel>Bio</label>
            <textarea twTextarea rows="3" placeholder="Tell us about yourself…"></textarea>
            <span twHint>A short blurb for your profile page.</span>
          </tw-form-field>
        </div>
      </div>
      <tw-code-block [code]="standaloneVsFieldSnippet" language="html" />
    </section>

    <!-- Size -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Size</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Standalone textareas accept a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code> input that
        maps to the canonical inline-padding scale plus a matching font step. Inherited from the
        input directive — inside a form-field the wrapper's own <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        carries density.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3 max-w-md">
        @for (s of sizes; track s) {
          <textarea twTextarea rows="2" [size]="s" [placeholder]="'size=&quot;' + s + '&quot;'"></textarea>
        }
      </div>
      <tw-code-block [code]="sizeSnippet" language="html" />
    </section>

    <!-- Autosize -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Autosize</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[autosize]="true"</code> to grow the textarea with
        its content. Cap the growth with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">minRows</code> and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxRows</code> so the field doesn't run off the page.
        Under the hood the directive composes Angular CDK's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkTextareaAutosize</code>
        via <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hostDirectives</code> — no manual height
        measurement. With autosize on the user-resize handle is forced off (the two would fight on
        every keystroke).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Release notes</label>
          <textarea
            twTextarea
            [autosize]="true"
            [minRows]="2"
            [maxRows]="8"
            placeholder="Type to see it grow…"
          ></textarea>
          <span twHint>Grows between 2 and 8 rows.</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="autosizeSnippet" language="html" />
    </section>

    <!-- Character count -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Character Count</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Set <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxLength</code> to mirror the native
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxlength</code> attribute and read
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valueLength()</code> via a template ref to render a
        trailing "X / N" counter. The counter goes in a second <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twHint</code> with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">align="end"</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Bio</label>
          <textarea
            #bioTa="twTextarea"
            twTextarea
            rows="3"
            [maxLength]="240"
            [(ngModel)]="bio"
            name="bio"
          ></textarea>
          <span twHint>A short blurb for your profile page.</span>
          <span twHint align="end" data-testid="char-count">{{ bioTa.valueLength() }} / 240</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="charCountSnippet" language="html" />
    </section>

    <!-- Resize axis -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Resize Axis</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pick how the user-resize handle behaves. <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'vertical'</code> (default) is the most
        common; <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'none'</code> locks the size; <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'both'</code> allows both axes
        (rarely useful inside a form-field — the textarea overflows the wrapper).
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3 max-w-md">
        @for (r of resizeValues; track r) {
          <textarea twTextarea rows="2" [resize]="r" [placeholder]="'resize=&quot;' + r + '&quot;'"></textarea>
        }
      </div>
      <tw-code-block [code]="resizeSnippet" language="html" />
    </section>

    <!-- Disabled & read-only -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Disabled &amp; Read-only</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code> prevents interaction and dims the field; <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code> keeps it
        focusable and selectable but blocks edits. Same semantics as the input directive.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <tw-form-field>
          <label twLabel>Commit message</label>
          <textarea twTextarea readonly rows="3">feat(textarea): add multi-line input with autosize</textarea>
          <span twHint>Read-only — select to copy.</span>
        </tw-form-field>
        <tw-form-field>
          <label twLabel>Legacy notes</label>
          <textarea twTextarea [disabled]="true" rows="3">Locked after the v3 migration.</textarea>
          <span twHint>Disabled — no longer editable.</span>
        </tw-form-field>
      </div>
      <tw-code-block [code]="disabledSnippet" language="html" />
    </section>

    <!-- Template-driven forms -->
    <section class="mb-10" data-section="td">
      <h2 class="text-sm font-semibold mb-3">Template-Driven Forms</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Bind with <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code> just like a plain textarea.
        The directive picks up the bound <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">NgControl</code> automatically, so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code> inference and error-state tracking work without
        extra wiring.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Comment</label>
          <textarea
            twTextarea
            rows="3"
            name="comment"
            [(ngModel)]="comment"
            [disabled]="commentDisabled()"
            required
          ></textarea>
          <span twHint>Bound model below.</span>
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ comment() }}" · disabled = {{ commentDisabled() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="comment.set('Great work!\\nShipped on time.')">Set value</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="commentDisabled.update(v => !v)">Toggle disabled</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="comment.set(''); commentDisabled.set(false)">Reset</button>
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
        Bind a <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">FormControl</code> with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formControl]</code> or use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">formControlName</code> inside a form group. Validators flow through to the
        directive's error-state signal.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Description</label>
          <textarea twTextarea rows="3" [formControl]="descCtrl"></textarea>
          <span twHint>Required, max 80 characters.</span>
          @if (descCtrl.hasError('required')) {
            <span twError>Description is required.</span>
          }
          @if (descCtrl.hasError('maxlength')) {
            <span twError>Too long — keep it under 80 characters.</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ descCtrl.value }}" · touched = {{ descCtrl.touched }} · valid = {{ descCtrl.valid }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="descCtrl.setValue('A short description.')">Set value</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="descCtrl.disable()">Disable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="descCtrl.enable()">Enable</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="descCtrl.markAsTouched()">Mark touched</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="descCtrl.reset('')">Reset</button>
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
        Angular v21 signal forms attach through <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>. The
        field signal stays in sync with the textarea and exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>, <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code> as signals.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Notes</label>
          <textarea twTextarea rows="3" [formField]="signalForm.notes"></textarea>
          <span twHint>Minimum 2 characters.</span>
          @if (signalForm.notes().errors().length && signalForm.notes().touched()) {
            <span twError>Notes are required (min 2 chars).</span>
          }
        </tw-form-field>
        <p class="text-xs text-fg-muted mt-4 font-mono" data-testid="value-readout">
          value = "{{ signalForm.notes().value() || '' }}" · touched = {{ signalForm.notes().touched() }} · valid = {{ signalForm.notes().valid() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.notes().value.set('Multi\\nline value')">Set value</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.notes().reset('')">Reset</button>
        </div>
      </div>
      <tw-code-block [code]="signalTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="signalHtmlSnippet" language="html" />
      </div>
    </section>

    <!-- Custom error-state matcher -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Error-State Matcher</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Override when the field enters its error state via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">errorStateMatcher</code> input, or globally via the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_ERROR_STATE_MATCHER</code> token. The matcher below only
        shows errors after the parent form is submitted.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <form (ngSubmit)="onSubmit()" #f="ngForm" class="space-y-4">
          <tw-form-field>
            <label twLabel>Feedback</label>
            <textarea twTextarea rows="3" [formControl]="submitOnlyCtrl" [errorStateMatcher]="submitOnlyMatcher"></textarea>
            <span twHint>Type then click away — no error until you submit.</span>
            @if (submitOnlyCtrl.hasError('required')) {
              <span twError>Feedback is required.</span>
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

    <!-- Inside form-field with suffix slot -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Suffix Slot (Composition)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The form-field's <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twSuffix]</code> works for textareas
        too. The example below pairs autosize with a "clear" affordance.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-form-field>
          <label twLabel>Draft</label>
          <textarea twTextarea [autosize]="true" [minRows]="2" [maxRows]="6" [formControl]="draftCtrl" placeholder="Start typing…"></textarea>
          @if (draftCtrl.value) {
            <button
              twSuffix
              type="button"
              twButton
              variant="ghost"
              color="neutral"
              size="xs"
              aria-label="Clear draft"
              (click)="draftCtrl.reset('')"
            >
              <svg class="size-4" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clip-rule="evenodd" />
              </svg>
            </button>
          }
        </tw-form-field>
      </div>
      <tw-code-block [code]="suffixSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing input to sanity-check a configuration. Toggle
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">autosize</code>
        to watch the textarea grow with content, or pair
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">readonly</code>
        with a non-empty value to demo the "view-only" pattern.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Resize</label>
            <div class="flex gap-1">
              @for (r of resizeValues; track r) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playResize() === r"
                        [class.!text-primary-700]="playResize() === r"
                        (click)="playResize.set(r)">{{ r }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Autosize</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playAutosize()"
                      [class.!text-primary-700]="playAutosize()"
                      (click)="playAutosize.update(v => !v)">autosize</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">State</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisabled()"
                      [class.!text-primary-700]="playDisabled()"
                      (click)="playDisabled.update(v => !v)">disabled</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playReadonly()"
                      [class.!text-primary-700]="playReadonly()"
                      (click)="playReadonly.update(v => !v)">readonly</button>
            </div>
          </div>
          <div>
            <label for="playRows" class="block text-xs font-medium text-fg-muted mb-1">Rows ({{ playRows() }})</label>
            <input
              id="playRows"
              type="range"
              min="1"
              max="10"
              [value]="playRows()"
              (input)="playRows.set(+$any($event.target).value)"
              class="w-32"
            />
          </div>
          <div>
            <label for="playMaxLength" class="block text-xs font-medium text-fg-muted mb-1">maxLength ({{ playMaxLength() ?? 'none' }})</label>
            <input
              id="playMaxLength"
              type="range"
              min="0"
              max="240"
              step="20"
              [value]="playMaxLength() ?? 0"
              (input)="playMaxLength.set(+$any($event.target).value || null)"
              class="w-32"
            />
          </div>
        </div>
        <div class="p-6 rounded-lg bg-surface-sunken">
          <tw-form-field>
            <label twLabel>Playground</label>
            <textarea
              twTextarea
              [size]="playSize()"
              [resize]="playResize()"
              [autosize]="playAutosize()"
              [rows]="playRows()"
              [maxLength]="playMaxLength() ?? undefined"
              [disabled]="playDisabled()"
              [readonly]="playReadonly()"
              [(ngModel)]="playValue"
              name="playValue"
              placeholder="Type to try out the configuration…"
              aria-label="Playground"
            ></textarea>
            <span twHint>Bound model below.</span>
          </tw-form-field>
          <p data-testid="output-playground" class="text-xs text-fg-muted mt-3 font-mono">
            value length = {{ playValue().length }}{{ playMaxLength() ? ' / ' + playMaxLength() : '' }}
          </p>
        </div>
      </div>
    </section>
  `,
})
export class TextareaExamples {
  protected readonly sizes: readonly TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];
  protected readonly resizeValues: readonly TwTextareaResize[] = ['none', 'vertical', 'both'];

  protected readonly bio = signal('');
  protected readonly comment = signal('');
  protected readonly commentDisabled = signal(false);

  protected readonly descCtrl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required, Validators.maxLength(80)],
  });

  protected readonly submitOnlyCtrl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  protected readonly submitOnlyMatcher = SUBMIT_ONLY_MATCHER;

  protected readonly draftCtrl = new FormControl<string>('', { nonNullable: true });

  protected readonly signalModel = signal({ notes: '' });
  protected readonly signalForm = form(this.signalModel, (p) => {
    required(p.notes);
    minLength(p.notes, 2);
  });

  // ── Playground ──
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playResize = signal<TwTextareaResize>('vertical');
  protected readonly playAutosize = signal(false);
  protected readonly playRows = signal(3);
  protected readonly playMaxLength = signal<number | null>(null);
  protected readonly playDisabled = signal(false);
  protected readonly playReadonly = signal(false);
  protected readonly playValue = signal('');

  protected onSubmit(): void {
    // ngSubmit triggers the form's `submitted` flag; the matcher reads it.
  }

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly standaloneVsFieldSnippet = `<!-- Standalone — directive paints its own chrome -->
<textarea twTextarea rows="3" placeholder="Notes on this release…"></textarea>

<!-- Inside tw-form-field — directive strips its chrome; wrapper owns it -->
<tw-form-field>
  <label twLabel>Bio</label>
  <textarea twTextarea rows="3" placeholder="Tell us about yourself…"></textarea>
  <span twHint>A short blurb for your profile page.</span>
</tw-form-field>`;

  protected readonly sizeSnippet = `<textarea twTextarea size="xs" rows="2" placeholder="xs"></textarea>
<textarea twTextarea size="sm" rows="2" placeholder="sm"></textarea>
<textarea twTextarea size="md" rows="2" placeholder="md (default)"></textarea>
<textarea twTextarea size="lg" rows="2" placeholder="lg"></textarea>
<textarea twTextarea size="xl" rows="2" placeholder="xl"></textarea>`;

  protected readonly autosizeSnippet = `<tw-form-field>
  <label twLabel>Release notes</label>
  <textarea
    twTextarea
    [autosize]="true"
    [minRows]="2"
    [maxRows]="8"
    placeholder="Type to see it grow…"
  ></textarea>
  <span twHint>Grows between 2 and 8 rows.</span>
</tw-form-field>`;

  protected readonly charCountSnippet = `<tw-form-field>
  <label twLabel>Bio</label>
  <textarea
    #bioTa="twTextarea"
    twTextarea
    rows="3"
    [maxLength]="240"
    [(ngModel)]="bio"
    name="bio"
  ></textarea>
  <span twHint>A short blurb for your profile page.</span>
  <span twHint align="end">{{ '{{' }} bioTa.valueLength() {{ '}}' }} / 240</span>
</tw-form-field>`;

  protected readonly resizeSnippet = `<textarea twTextarea resize="none" rows="2"></textarea>
<textarea twTextarea resize="vertical" rows="2"></textarea>
<textarea twTextarea resize="both" rows="2"></textarea>

<!-- With autosize the user-resize handle is forced off -->
<textarea twTextarea [autosize]="true"></textarea>`;

  protected readonly disabledSnippet = `<tw-form-field>
  <label twLabel>Commit message</label>
  <textarea twTextarea readonly rows="3">feat(textarea): add multi-line input with autosize</textarea>
  <span twHint>Read-only — select to copy.</span>
</tw-form-field>

<tw-form-field>
  <label twLabel>Legacy notes</label>
  <textarea twTextarea [disabled]="true" rows="3">Locked after the v3 migration.</textarea>
</tw-form-field>`;

  protected readonly reactiveTsSnippet = `protected readonly descCtrl = new FormControl<string>('', {
  nonNullable: true,
  validators: [Validators.required, Validators.maxLength(80)],
});`;

  protected readonly reactiveHtmlSnippet = `<tw-form-field>
  <label twLabel>Description</label>
  <textarea twTextarea rows="3" [formControl]="descCtrl"></textarea>
  <span twHint>Required, max 80 characters.</span>
  @if (descCtrl.hasError('required')) {
    <span twError>Description is required.</span>
  }
  @if (descCtrl.hasError('maxlength')) {
    <span twError>Too long — keep it under 80 characters.</span>
  }
</tw-form-field>`;

  protected readonly ngModelTsSnippet = `protected readonly comment = signal('');
protected readonly commentDisabled = signal(false);`;

  protected readonly ngModelHtmlSnippet = `<tw-form-field>
  <label twLabel>Comment</label>
  <textarea
    twTextarea
    rows="3"
    name="comment"
    [(ngModel)]="comment"
    [disabled]="commentDisabled()"
    required
  ></textarea>
</tw-form-field>`;

  protected readonly signalTsSnippet = `protected readonly signalModel = signal({ notes: '' });
protected readonly signalForm = form(this.signalModel, (p) => {
  required(p.notes);
  minLength(p.notes, 2);
});`;

  protected readonly signalHtmlSnippet = `<tw-form-field>
  <label twLabel>Notes</label>
  <textarea twTextarea rows="3" [formField]="signalForm.notes"></textarea>
  <span twHint>Minimum 2 characters.</span>
  @if (signalForm.notes().errors().length && signalForm.notes().touched()) {
    <span twError>Notes are required (min 2 chars).</span>
  }
</tw-form-field>`;

  protected readonly matcherTsSnippet = `import type { ErrorStateMatcher } from 'ngx-tw/core';

const SUBMIT_ONLY_MATCHER: ErrorStateMatcher = {
  isErrorState(control, form) {
    return !!control?.invalid && !!form?.submitted;
  },
};

protected readonly submitOnlyCtrl = new FormControl<string>('', {
  nonNullable: true,
  validators: [Validators.required],
});
protected readonly submitOnlyMatcher = SUBMIT_ONLY_MATCHER;`;

  protected readonly matcherHtmlSnippet = `<form (ngSubmit)="onSubmit()" #f="ngForm">
  <tw-form-field>
    <label twLabel>Feedback</label>
    <textarea
      twTextarea rows="3"
      [formControl]="submitOnlyCtrl"
      [errorStateMatcher]="submitOnlyMatcher"
    ></textarea>
    @if (submitOnlyCtrl.hasError('required')) {
      <span twError>Feedback is required.</span>
    }
  </tw-form-field>
  <button twButton type="submit">Submit</button>
</form>`;

  protected readonly suffixSnippet = `<tw-form-field>
  <label twLabel>Draft</label>
  <textarea
    twTextarea
    [autosize]="true"
    [minRows]="2"
    [maxRows]="6"
    [formControl]="draftCtrl"
  ></textarea>
  @if (draftCtrl.value) {
    <button twSuffix type="button" twButton variant="ghost" color="neutral" size="xs"
            aria-label="Clear draft" (click)="draftCtrl.reset('')">
      <svg class="size-4" viewBox="0 0 20 20" fill="currentColor">…</svg>
    </button>
  }
</tw-form-field>`;
}
