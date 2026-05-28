import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import {
  AlertComponent,
  AlertIconDirective,
  AlertTitleDirective,
  AlertContentDirective,
  AlertActionsDirective,
  type AlertVariant,
} from 'ngx-tw/alert';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';
import type { TwColor } from 'ngx-tw/core';

const VARIANTS: AlertVariant[] = ['solid', 'outline', 'soft'];
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
const POLITENESS: ('polite' | 'assertive' | 'off')[] = ['polite', 'assertive', 'off'];

interface ColorSample {
  readonly color: TwColor;
  readonly title: string;
  readonly message: string;
}

const COLOR_SAMPLES: readonly ColorSample[] = [
  { color: 'primary', title: 'Launch on schedule', message: 'The v3 release is queued to ship on Friday at 14:00 UTC.' },
  { color: 'secondary', title: 'Feedback requested', message: 'Three beta testers have left notes on your pull request.' },
  { color: 'accent', title: 'Tip of the day', message: 'Press ⌘K anywhere in the app to open the command palette.' },
  { color: 'neutral', title: 'Scheduled maintenance', message: 'Background workers will pause tonight between 02:00 and 02:30.' },
  { color: 'info', title: 'New version available', message: 'v2.4.0 adds keyboard shortcuts for navigation — see the release notes for details.' },
  { color: 'success', title: 'Payment received', message: 'We processed your invoice #A-1048 for $1,240.00.' },
  { color: 'warning', title: 'Trial expires in 3 days', message: 'Upgrade now to keep access to advanced reporting and unlimited seats.' },
  { color: 'error', title: 'Couldn’t reach the API', message: 'The last sync attempt failed with a 502. We’ll keep retrying in the background.' },
];

interface DismissibleAlert {
  readonly id: string;
  readonly color: TwColor;
  readonly title: string;
  readonly message: string;
}

const DISMISSIBLE_INITIAL: readonly DismissibleAlert[] = [
  { id: 'storage', color: 'warning', title: 'Storage 87% full', message: 'Clean up old backups to avoid new uploads being rejected.' },
  { id: 'connection', color: 'success', title: 'Connection restored', message: 'We reconnected to the realtime server. No data was lost.' },
  { id: 'invite', color: 'info', title: 'Invite pending', message: 'Tomás Aguilar hasn’t accepted their team invitation yet.' },
];

@Component({
  selector: 'app-alert-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AlertComponent,
    AlertIconDirective,
    AlertTitleDirective,
    AlertContentDirective,
    AlertActionsDirective,
    ButtonDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Variants -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Variants</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">variant</code>
        controls how much visual weight the alert carries.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code>
        (default) is the workhorse — it sits inside a page without fighting neighbouring content.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">outline</code>
        is a lighter touch for reference notices where a subtle colored border is enough.
        Reserve
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code>
        for the one critical message on the page — it pulls focus and should not be repeated.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        @for (v of variants; track v) {
          <tw-alert [variant]="v" color="info">
            <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
            <span twAlertTitle>New version available</span>
            <span twAlertContent>v2.4.0 adds keyboard shortcuts for navigation — see the release notes for details.</span>
          </tw-alert>
        }
      </div>
      <tw-code-block [code]="variantsSnippet" language="html" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Every variant × color pair is contrast-checked. Solid variants apply the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">text-on-{{ '{role}' }}</code>
        foreground token so each combination meets WCAG AA against its filled background —
        warnings and successes pick up the deep
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">-950</code>
        foreground while the others stay white.
      </p>
    </section>

    <!-- Colors -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Colors</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Match the color to the meaning — not to brand aesthetics.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">info</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">warning</code>, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        carry conventional semantic meaning that users recognize instantly.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">primary</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">secondary</code> /
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">accent</code>
        are for brand-themed notices that aren't status messages, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        is the right choice for factual system notices where a colored alert would feel alarmist.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        @for (s of colorSamples; track s.color) {
          <tw-alert [color]="s.color">
            <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
            <span twAlertTitle>{{ s.title }}</span>
            <span twAlertContent>{{ s.message }}</span>
          </tw-alert>
        }
      </div>
      <tw-code-block [code]="colorsSnippet" language="html" />
    </section>

    <!-- With Icon & Title -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Icon &amp; Title</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project an icon into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twAlertIcon]</code>
        and a title into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twAlertTitle]</code>
        for the canonical status-alert shape. The four built-in status colors each suggest an icon
        by convention: an info circle, a check, a triangle, and an X. Keep icons decorative —
        they're marked aria-hidden and the alert's text carries all the meaning for assistive tech.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        <tw-alert color="info">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Heads up</span>
          <span twAlertContent>Scheduled maintenance starts in 30 minutes — save your work to avoid interruptions.</span>
        </tw-alert>
        <tw-alert color="success">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Deployment complete</span>
          <span twAlertContent>Your application is live at acme.com — the new build is serving traffic.</span>
        </tw-alert>
        <tw-alert color="warning">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Trial ends in 3 days</span>
          <span twAlertContent>Add a payment method to keep Advanced Reporting and your 12 invited teammates.</span>
        </tw-alert>
        <tw-alert color="error">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Couldn't reach the API</span>
          <span twAlertContent>The last sync failed with a 502. Check your network, or try again in a minute.</span>
        </tw-alert>
      </div>
      <tw-code-block [code]="iconTitleSnippet" language="html" />
    </section>

    <!-- With Actions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">With Actions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Project a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[twAlertActions]</code>
        row to attach buttons directly to the message. Use the same color as the alert on the
        primary action so it reads as part of the same affordance, and keep the secondary action
        neutral so the decision feels balanced. Two actions is the sweet spot — three starts to
        read like a form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        <tw-alert color="error" variant="outline" [dismissible]="true">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Deployment failed on web-3</span>
          <span twAlertContent>Build #4812 couldn't start — exit code 137 suggests the container ran out of memory.</span>
          <div twAlertActions>
            <button twButton color="error" variant="soft" size="sm">View build log</button>
            <button twButton color="neutral" variant="ghost" size="sm">Retry</button>
          </div>
        </tw-alert>
        <tw-alert color="info" variant="soft">
          <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
          </svg>
          <span twAlertTitle>Update available</span>
          <span twAlertContent>v2.4.0 introduces faster search and keyboard shortcuts. Install now or keep working on v2.3.</span>
          <div twAlertActions>
            <button twButton color="info" variant="soft" size="sm">Install now</button>
            <button twButton color="neutral" variant="ghost" size="sm">Later</button>
          </div>
        </tw-alert>
      </div>
      <tw-code-block [code]="actionsSnippet" language="html" />
    </section>

    <!-- Dismissible -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Dismissible</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Turning
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">[dismissible]="true"</code>
        on renders a close button in the top-right corner; wire up the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">(dismissed)</code>
        event to remove the alert from your state. Use dismissal for information the user has read
        and accepted — don't let them dismiss an error that still needs action.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        @for (alert of dismissibleAlerts(); track alert.id) {
          <tw-alert [color]="alert.color" [dismissible]="true" (dismissed)="dismissAlert(alert.id)">
            <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
            </svg>
            <span twAlertTitle>{{ alert.title }}</span>
            <span twAlertContent>{{ alert.message }}</span>
          </tw-alert>
        } @empty {
          <p class="text-sm text-fg-muted">All notifications cleared.</p>
        }
        @if (dismissibleAlerts().length < allDismissible.length) {
          <button twButton variant="ghost" color="neutral" size="xs" (click)="resetAlerts()">Reset</button>
        }
      </div>
      <tw-code-block [code]="dismissibleTsSnippet" language="ts" />
      <div class="mt-3">
        <tw-code-block [code]="dismissibleHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        The fade-out on dismiss comes from the component's built-in <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">animate.leave="fade-out"</code> host binding — no extra configuration required on your side.
      </p>
    </section>

    <!-- Politeness -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Politeness</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">politeness</code>
        input drives the host
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role</code>:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'polite'</code>
        renders
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="status"</code>
        and is the right default — the message is announced when the screen reader next pauses.
        Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'assertive'</code>
        (maps to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role="alert"</code>)
        only for errors that must interrupt — it cuts off the screen reader's current utterance.
        Set
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'off'</code>
        to drop the role entirely when a parent notification system owns the announcement.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-3">
        @for (p of politenessValues; track p) {
          <div>
            <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">{{ p }}</p>
            <tw-alert color="info" [politeness]="p">
              <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
              </svg>
              <span twAlertContent>Announced at <code class="font-mono">'{{ p }}'</code> politeness.</span>
            </tw-alert>
          </div>
        }
      </div>
      <tw-code-block [code]="politenessSnippet" language="html" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every input at once to audition configurations. A good starting point is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">soft</code> +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">info</code> with icon
        and title on — that's the default shape for most page-anchored status messages. Toggle
        into
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">solid</code> to see
        how the contrast shifts, and toggle title off to see the compact one-liner form.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
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
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Content</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playIcon()"
                [class.!text-primary-700]="playIcon()"
                (click)="playIcon.update(v => !v)"
              >icon</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playTitle()"
                [class.!text-primary-700]="playTitle()"
                (click)="playTitle.update(v => !v)"
              >title</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playActions()"
                [class.!text-primary-700]="playActions()"
                (click)="playActions.update(v => !v)"
              >actions</button>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Behavior</p>
            <div class="flex flex-wrap gap-1">
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playDismissible()"
                [class.!text-primary-700]="playDismissible()"
                (click)="playDismissible.update(v => !v)"
              >dismissible</button>
            </div>
          </div>
        </div>

        <div class="p-6 rounded-lg bg-surface-sunken">
          @if (playVisible()) {
            <tw-alert
              [variant]="playVariant()"
              [color]="playColor()"
              [dismissible]="playDismissible()"
              politeness="off"
              (dismissed)="playVisible.set(false)"
            >
              @if (playIcon()) {
                <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd" />
                </svg>
              }
              @if (playTitle()) {
                <span twAlertTitle>Playground alert</span>
              }
              <span twAlertContent>Toggle the controls above to see every variant × color combination.</span>
              @if (playActions()) {
                <div twAlertActions>
                  <button twButton [color]="playColor()" variant="soft" size="sm">Primary action</button>
                  <button twButton color="neutral" variant="ghost" size="sm">Cancel</button>
                </div>
              }
            </tw-alert>
          } @else {
            <div class="flex items-center justify-between gap-3 text-sm text-fg-muted">
              <span>Alert dismissed.</span>
              <button twButton variant="outline" color="neutral" size="xs" (click)="playVisible.set(true)">Restore</button>
            </div>
          }
        </div>
      </div>
    </section>
  `,
})
export class AlertExamples {
  protected readonly variants = VARIANTS;
  protected readonly colors = COLORS;
  protected readonly politenessValues = POLITENESS;
  protected readonly colorSamples = COLOR_SAMPLES;

  protected readonly allDismissible = DISMISSIBLE_INITIAL;
  protected readonly dismissibleAlerts = signal<readonly DismissibleAlert[]>(
    DISMISSIBLE_INITIAL,
  );

  protected readonly playVariant = signal<AlertVariant>('soft');
  protected readonly playColor = signal<TwColor>('info');
  protected readonly playDismissible = signal(false);
  protected readonly playIcon = signal(true);
  protected readonly playTitle = signal(true);
  protected readonly playActions = signal(false);
  protected readonly playVisible = signal(true);

  protected dismissAlert(id: string): void {
    this.dismissibleAlerts.update((alerts) => alerts.filter((a) => a.id !== id));
  }

  protected resetAlerts(): void {
    this.dismissibleAlerts.set(DISMISSIBLE_INITIAL);
  }

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly variantsSnippet = `@for (v of variants; track v) {
  <tw-alert [variant]="v" color="info">
    <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    <span twAlertTitle>New version available</span>
    <span twAlertContent>
      v2.4.0 adds keyboard shortcuts for navigation — see the release notes for details.
    </span>
  </tw-alert>
}`;

  protected readonly colorsSnippet = `@for (s of colorSamples; track s.color) {
  <tw-alert [color]="s.color">
    <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    <span twAlertTitle>{{ s.title }}</span>
    <span twAlertContent>{{ s.message }}</span>
  </tw-alert>
}`;

  protected readonly iconTitleSnippet = `<tw-alert color="info">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
  <span twAlertTitle>Heads up</span>
  <span twAlertContent>Scheduled maintenance starts in 30 minutes — save your work.</span>
</tw-alert>

<tw-alert color="success">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
  <span twAlertTitle>Deployment complete</span>
  <span twAlertContent>Your application is live at acme.com.</span>
</tw-alert>

<tw-alert color="warning">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
  <span twAlertTitle>Trial ends in 3 days</span>
  <span twAlertContent>Add a payment method to keep advanced reporting.</span>
</tw-alert>

<tw-alert color="error">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
  <span twAlertTitle>Couldn't reach the API</span>
  <span twAlertContent>The last sync failed with a 502. We'll retry in the background.</span>
</tw-alert>`;

  protected readonly actionsSnippet = `<tw-alert color="error" variant="outline" [dismissible]="true">
  <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
  <span twAlertTitle>Deployment failed on web-3</span>
  <span twAlertContent>Build #4812 couldn't start — exit code 137 suggests the container ran out of memory.</span>
  <div twAlertActions>
    <button twButton color="error"   variant="soft"  size="sm">View build log</button>
    <button twButton color="neutral" variant="ghost" size="sm">Retry</button>
  </div>
</tw-alert>`;

  protected readonly dismissibleTsSnippet = `protected readonly dismissibleAlerts = signal<readonly DismissibleAlert[]>(
  DISMISSIBLE_INITIAL,
);

protected dismissAlert(id: string): void {
  this.dismissibleAlerts.update((alerts) => alerts.filter((a) => a.id !== id));
}`;

  protected readonly dismissibleHtmlSnippet = `@for (alert of dismissibleAlerts(); track alert.id) {
  <tw-alert
    [color]="alert.color"
    [dismissible]="true"
    (dismissed)="dismissAlert(alert.id)"
  >
    <svg twAlertIcon viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    <span twAlertTitle>{{ alert.title }}</span>
    <span twAlertContent>{{ alert.message }}</span>
  </tw-alert>
}`;

  protected readonly politenessSnippet = `<!-- polite (default) — announced when the screen reader next pauses -->
<tw-alert color="info" politeness="polite">…</tw-alert>

<!-- assertive — interrupts the current utterance; use sparingly -->
<tw-alert color="error" politeness="assertive">…</tw-alert>

<!-- off — don't announce (e.g., inside a notification center) -->
<tw-alert color="info" politeness="off">…</tw-alert>`;
}
