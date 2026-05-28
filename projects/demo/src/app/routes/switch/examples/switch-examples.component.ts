import { ChangeDetectionStrategy, Component, signal, type WritableSignal } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { form, FormField } from '@angular/forms/signals';
import { SwitchComponent } from '@cdevhub/ngx-tw/switch';
import type { SwitchLabelPosition } from '@cdevhub/ngx-tw/switch';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';
import type { TwColor, TwSize } from '@cdevhub/ngx-tw/core';

const COLORS: TwColor[] = ['primary', 'secondary', 'accent', 'neutral', 'info', 'success', 'warning', 'error'];
const SIZES: TwSize[] = ['xs', 'sm', 'md', 'lg', 'xl'];

@Component({
  selector: 'app-switch-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    SwitchComponent,
    ButtonDirective,
    CodeBlockComponent,
    FormsModule,
    ReactiveFormsModule,
    FormField,
  ],
  template: `
    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">color</code>
        input tints only the active (checked) track — an unchecked switch always uses the neutral
        surface color so the "off" state reads as inert regardless of theme. Match the color to
        the semantic meaning of the setting:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        for safe automations,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>
        for opt-ins with consequences,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        for destructive toggles.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (c of colors; track c) {
            <tw-switch [color]="c" [(checked)]="colorValues[c]" [label]="c" />
          }
        </div>
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Size scales the track, thumb, and label typography together. Reach for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        inside dense data tables or toolbars,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        (the default) for most settings panels, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        only when a switch is the focal action of a page. Avoid
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xs</code>
        except for consumer affordances where vertical space is genuinely at a premium —
        descriptive text becomes hard to read below
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          @for (s of sizes; track s) {
            <tw-switch [size]="s" [(checked)]="sizeValues[s]" [label]="s" />
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="html" />
    </section>

    <!-- With Icons -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icons</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project SVGs into the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="on-icon"]</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="off-icon"]</code>
        slots to render a state indicator inside the track. The icons fade between states alongside
        the thumb and pick up the contrasting text color automatically, so you do not need to
        theme them per switch color. Reserve icons for
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">lg</code>
        or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">xl</code>
        sizes — the track is otherwise too narrow to read them.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-switch label="Sound" color="info" size="lg" [(checked)]="soundValue">
          <svg slot="on-icon" class="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.482A5.73 5.73 0 002 10c0 .887.2 1.727.556 2.479a.75.75 0 00.61.338h1.537l4.033 3.796A.75.75 0 0010 16.25V3.75zM14.95 5.05a.75.75 0 00-1.06 1.061A5.5 5.5 0 0114.5 10a5.5 5.5 0 01-.61 3.89.75.75 0 101.061 1.06A7 7 0 0016 10a7 7 0 00-1.05-4.95z"/>
          </svg>
          <svg slot="off-icon" class="size-3" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path d="M10 3.75a.75.75 0 00-1.264-.546L4.703 7H3.167a.75.75 0 00-.7.482A5.73 5.73 0 002 10c0 .887.2 1.727.556 2.479a.75.75 0 00.61.338h1.537l4.033 3.796A.75.75 0 0010 16.25V3.75zM17.28 5.22a.75.75 0 10-1.06 1.06L17.94 8l-1.72 1.72a.75.75 0 101.06 1.06L19 9.06l1.72 1.72a.75.75 0 101.06-1.06L20.06 8l1.72-1.72a.75.75 0 00-1.06-1.06L19 6.94 17.28 5.22z"/>
          </svg>
        </tw-switch>
      </div>
      <tw-code-block [code]="iconsSnippet" language="html" />
    </section>

    <!-- With description -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Description</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">description</code>
        input renders a muted secondary line below the label. Use it when the label itself is a
        short verb phrase and the user needs context to decide: what the switch enables, how often
        it runs, what it costs. For rich content (links, inline badges), project into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[slot="description"]</code>
        instead.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <tw-switch
            label="Auto-sync"
            description="Sync changes every minute"
            color="success"
            [(checked)]="syncValue"
          />
          <tw-switch
            label="Beta features"
            description="Opt in to experimental functionality"
            color="accent"
            [(checked)]="betaValue"
          />
        </div>
      </div>
      <tw-code-block [code]="descriptionSnippet" language="html" />
    </section>

    <!-- Label position -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Label Position</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The default label position is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'after'</code>
        — label text follows the control. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'before'</code>
        in settings lists where the label describes a row and the switch reads as the control on
        the right-hand rail; this matches the platform conventions of macOS System Settings and
        iOS Settings.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <tw-switch label="Label after (default)" labelPosition="after" [(checked)]="afterValue" />
          <tw-switch label="Label before" labelPosition="before" [(checked)]="beforeValue" />
        </div>
      </div>
      <tw-code-block [code]="labelPositionSnippet" language="html" />
    </section>

    <!-- States -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">States</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disabled</code>
        blocks interaction and applies muted styling while keeping the current value visible — use
        it when a setting is temporarily unavailable (e.g., a plan upgrade required).
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        sets
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-required="true"</code>
        for assistive tech; pair it with explicit description text since switches don't render a
        visible asterisk.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="space-y-4">
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled (off)</p>
            <tw-switch label="Notifications" [disabled]="true" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Disabled (on)</p>
            <tw-switch label="Analytics" [disabled]="true" [checked]="true" color="info" />
          </div>
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Required</p>
            <tw-switch
              label="I agree to the terms"
              description="Required to continue"
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
        The switch implements
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ControlValueAccessor</code>,
        so
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[(ngModel)]</code>
        works with no wiring. This is the most compact shape for settings pages where each switch
        owns a single boolean and you don't need a form group.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-switch
          name="notificationsTd"
          label="Notifications"
          color="info"
          [(ngModel)]="tdNotifications"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">value = {{ tdNotifications() }}</p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdNotifications.set(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="tdNotifications.set(false)">Set false</button>
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
        to participate in a form group. Toggling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disable()</code>
        on the control blocks interaction — no separate
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[disabled]</code>
        attribute required.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-switch label="Marketing emails" color="info" [formControl]="marketingControl" />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          control.value = {{ marketingControl.value }} · touched = {{ marketingControl.touched }} · disabled = {{ marketingControl.disabled }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="marketingControl.setValue(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="marketingControl.setValue(false)">Set false</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="toggleMarketingDisabled()">
            {{ marketingControl.disabled ? 'Enable' : 'Disable' }}
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
        For Angular v21 signal forms, bind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[formField]</code>
        to a field from
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">form()</code>.
        The field signal exposes
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">value</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">touched</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">valid</code>
        directly — no subscriptions needed.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <tw-switch
          label="Dark mode"
          description="Use the dark color palette"
          color="accent"
          [formField]="signalForm.darkMode"
        />
        <p class="text-xs text-fg-muted mt-3 font-mono">
          value = {{ signalForm.darkMode().value() }} · touched = {{ signalForm.darkMode().touched() }}
        </p>
        <div class="flex gap-2 mt-3">
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.darkMode().value.set(true)">Set true</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.darkMode().value.set(false)">Set false</button>
          <button twButton variant="outline" color="neutral" size="xs" (click)="signalForm.darkMode().reset()">Reset</button>
        </div>
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
        Combine every user-facing input at once. Try a large
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        switch with a description and the label placed before the control to preview a settings-row
        layout, or turn
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">required</code>
        on with a warning color to show how it pairs with a themed form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
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
            <label class="block text-xs font-medium text-fg-muted mb-1">Label position</label>
            <div class="flex gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLabelPos() === 'after'"
                [class.!text-primary-700]="playLabelPos() === 'after'"
                (click)="playLabelPos.set('after')"
              >after</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playLabelPos() === 'before'"
                [class.!text-primary-700]="playLabelPos() === 'before'"
                (click)="playLabelPos.set('before')"
              >before</button>
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Options</label>
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
          <tw-switch
            [color]="playColor()"
            [size]="playSize()"
            [labelPosition]="playLabelPos()"
            [disabled]="playDisabled()"
            [required]="playRequired()"
            label="Toggle setting"
            [description]="playDescription() ? 'A longer explanation of what this setting controls' : undefined"
            [(checked)]="playValue"
          />
          <p class="text-xs text-fg-muted mt-4 font-mono">checked = {{ playValue() }}</p>
        </div>
      </div>
    </section>
  `,
})
export class SwitchExamples {
  protected readonly colors = COLORS;
  protected readonly sizes = SIZES;

  protected readonly colorValues: Record<TwColor, WritableSignal<boolean>> = {
    primary: signal(true),
    secondary: signal(true),
    accent: signal(true),
    neutral: signal(true),
    info: signal(true),
    success: signal(true),
    warning: signal(true),
    error: signal(true),
  };

  protected readonly sizeValues: Record<TwSize, WritableSignal<boolean>> = {
    xs: signal(true),
    sm: signal(true),
    md: signal(true),
    lg: signal(true),
    xl: signal(true),
  };

  protected readonly soundValue = signal(true);
  protected readonly syncValue = signal(true);
  protected readonly betaValue = signal(false);
  protected readonly afterValue = signal(true);
  protected readonly beforeValue = signal(false);
  protected readonly requiredValue = signal(false);

  // Template-driven
  protected readonly tdNotifications = signal(true);

  // Reactive
  protected readonly marketingControl = new FormControl<boolean>(false, { nonNullable: true });

  // Signal Forms
  protected readonly signalModel = signal({ darkMode: false });
  protected readonly signalForm = form(this.signalModel);

  // Playground
  protected readonly playColor = signal<TwColor>('primary');
  protected readonly playSize = signal<TwSize>('md');
  protected readonly playLabelPos = signal<SwitchLabelPosition>('after');
  protected readonly playDisabled = signal(false);
  protected readonly playRequired = signal(false);
  protected readonly playDescription = signal(false);
  protected readonly playValue = signal(false);

  protected toggleMarketingDisabled(): void {
    if (this.marketingControl.disabled) this.marketingControl.enable();
    else this.marketingControl.disable();
  }

  // ── Code snippets ──

  protected readonly colorsSnippet = `
@for (c of colors; track c) {
  <tw-switch [color]="c" [(checked)]="colorValues[c]" [label]="c" />
}`.trim();

  protected readonly sizesSnippet = `
@for (s of sizes; track s) {
  <tw-switch [size]="s" [(checked)]="sizeValues[s]" [label]="s" />
}`.trim();

  protected readonly iconsSnippet = `<tw-switch label="Sound" color="info" size="lg" [(checked)]="sound">
  <svg slot="on-icon"  class="size-3" viewBox="0 0 20 20" fill="currentColor">…</svg>
  <svg slot="off-icon" class="size-3" viewBox="0 0 20 20" fill="currentColor">…</svg>
</tw-switch>`;

  protected readonly descriptionSnippet = `<tw-switch
  label="Auto-sync"
  description="Sync changes every minute"
  color="success"
  [(checked)]="syncValue"
/>

<tw-switch
  label="Beta features"
  description="Opt in to experimental functionality"
  color="accent"
  [(checked)]="betaValue"
/>`;

  protected readonly labelPositionSnippet = `<tw-switch label="Label after (default)" labelPosition="after"  [(checked)]="afterValue" />
<tw-switch label="Label before"         labelPosition="before" [(checked)]="beforeValue" />`;

  protected readonly statesSnippet = `<!-- Disabled (off) -->
<tw-switch label="Notifications" [disabled]="true" />

<!-- Disabled (on) -->
<tw-switch label="Analytics" [disabled]="true" [checked]="true" color="info" />

<!-- Required -->
<tw-switch
  label="I agree to the terms"
  description="Required to continue"
  [required]="true"
  [(checked)]="agreedValue"
/>`;

  protected readonly tdTsSnippet = `protected readonly notifications = signal(true);`;

  protected readonly tdHtmlSnippet = `<tw-switch
  name="notifications"
  label="Notifications"
  color="info"
  [(ngModel)]="notifications"
/>`;

  protected readonly reactiveTsSnippet = `protected readonly marketingControl = new FormControl<boolean>(false, { nonNullable: true });`;

  protected readonly reactiveHtmlSnippet = `<tw-switch
  label="Marketing emails"
  color="info"
  [formControl]="marketingControl"
/>`;

  protected readonly signalTsSnippet = `protected readonly settings = signal({ darkMode: false });
protected readonly settingsForm = form(this.settings);`;

  protected readonly signalHtmlSnippet = `<tw-switch
  label="Dark mode"
  description="Use the dark color palette"
  color="accent"
  [formField]="settingsForm.darkMode"
/>`;
}
