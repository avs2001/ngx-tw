import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import {
  TW_DIALOG_DATA,
  TwDialog,
  DialogActionsDirective,
  DialogCloseDirective,
  DialogContentDirective,
  DialogDescriptionDirective,
  DialogHeaderDirective,
  DialogIconDirective,
  TwDialogRef,
  DialogSubtitleDirective,
  DialogTitleDirective,
  type TwDialogRole,
  type TwDialogScrollStrategy,
  type TwDialogSize,
} from '@cdevhub/ngx-tw/dialog';
import { ButtonDirective } from '@cdevhub/ngx-tw/button';
import { CodeBlockComponent } from '@cdevhub/ngx-tw/code-block';

const SIZES: TwDialogSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'fullscreen'];
const ROLES: TwDialogRole[] = ['dialog', 'alertdialog'];
const SCROLL_BEHAVIORS: TwDialogScrollStrategy[] = ['block', 'reposition', 'close', 'noop'];

interface UserProfileData {
  readonly name: string;
  readonly handle: string;
  readonly role: string;
  readonly location: string;
  readonly bio: string;
  readonly stats: { readonly followers: number; readonly projects: number; readonly reviews: number };
  readonly activity: readonly { readonly label: string; readonly meta: string }[];
}

/** Component-based dialog content used to demonstrate data injection + TwDialogRef. */
@Component({
  selector: 'app-dialog-user-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
  ],
  template: `
    <div twDialogContent>
      <div class="flex items-start gap-4">
        <div class="size-14 shrink-0 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-base font-semibold">
          EM
        </div>
        <div class="flex-1 min-w-0">
          <h2 class="text-base font-semibold text-fg">{{ data.name }}</h2>
          <p class="text-sm text-fg-muted">{{ '@' + data.handle }} · {{ data.role }}</p>
          <div class="mt-1 flex items-center gap-1.5 text-xs text-fg-subtle">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-3.5 shrink-0">
              <path fill-rule="evenodd" d="M9.69 18.933l.003.001C9.89 19.02 10 19 10 19s.11.02.308-.066l.002-.001.006-.003.018-.008a5.741 5.741 0 00.281-.14c.186-.096.446-.24.757-.433.62-.384 1.445-.966 2.274-1.765C15.302 14.988 17 12.493 17 9A7 7 0 103 9c0 3.492 1.698 5.988 3.355 7.584a13.731 13.731 0 002.273 1.765 11.842 11.842 0 00.976.544l.062.029.018.008.006.003zM10 11.25a2.25 2.25 0 100-4.5 2.25 2.25 0 000 4.5z" clip-rule="evenodd"/>
            </svg>
            <span>{{ data.location }}</span>
          </div>
        </div>
      </div>

      <p class="mt-5 text-sm text-fg-muted leading-relaxed">{{ data.bio }}</p>

      <div class="mt-5 grid grid-cols-3 gap-2">
        <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
          <p class="text-base font-semibold text-fg tabular-nums">{{ data.stats.followers }}</p>
          <p class="text-xs text-fg-muted">Followers</p>
        </div>
        <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
          <p class="text-base font-semibold text-fg tabular-nums">{{ data.stats.projects }}</p>
          <p class="text-xs text-fg-muted">Projects</p>
        </div>
        <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
          <p class="text-base font-semibold text-fg tabular-nums">{{ data.stats.reviews }}</p>
          <p class="text-xs text-fg-muted">Reviews</p>
        </div>
      </div>

      <p class="mt-5 text-xs font-medium text-fg-muted uppercase tracking-wide">Recent activity</p>
      <ul class="mt-2 divide-y divide-border-muted">
        @for (a of data.activity; track a.label) {
          <li class="flex items-center justify-between gap-4 py-2 text-sm">
            <span class="text-fg">{{ a.label }}</span>
            <span class="text-xs text-fg-subtle shrink-0 tabular-nums">{{ a.meta }}</span>
          </li>
        }
      </ul>
    </div>
    <div twDialogActions>
      <button twButton variant="ghost" twDialogClose>Dismiss</button>
      <button twButton variant="outline" [twDialogClose]="'messaged'">Message</button>
      <button twButton [twDialogClose]="'followed'">Follow</button>
    </div>
  `,
})
class DialogUserProfile {
  protected readonly data = inject<UserProfileData>(TW_DIALOG_DATA);
  protected readonly ref = inject<TwDialogRef<string>>(TwDialogRef);
}

interface Teammate {
  readonly initials: string;
  readonly name: string;
  readonly role: string;
  readonly avatar: string;
}

const TEAMMATES: readonly Teammate[] = [
  { initials: 'EM', name: 'Elena Moreau',  role: 'Engineering lead',  avatar: 'bg-primary-100 text-primary-700' },
  { initials: 'JK', name: 'Jonah Kwon',    role: 'Product designer',  avatar: 'bg-success-100 text-success-700' },
  { initials: 'RP', name: 'Ravi Patel',    role: 'Platform engineer', avatar: 'bg-info-100 text-info-700' },
  { initials: 'NH', name: 'Nadia Haidari', role: 'Data engineer',     avatar: 'bg-accent-100 text-accent-700' },
];

interface ReleaseFeature {
  readonly title: string;
  readonly body: string;
  readonly tag: 'New' | 'Improved' | 'Fixed';
  readonly tagClass: string;
}

const RELEASE_FEATURES: readonly ReleaseFeature[] = [
  {
    title: 'Command palette',
    body: 'Jump to any project, issue, or setting from one keyboard-driven surface.',
    tag: 'New',
    tagClass: 'bg-primary-100 text-primary-700',
  },
  {
    title: 'Draft autosave',
    body: 'Drafts now save every 4 seconds and recover after network drops.',
    tag: 'Improved',
    tagClass: 'bg-success-100 text-success-700',
  },
  {
    title: 'Saved filters',
    body: 'Pin filter combinations to your sidebar and share them with your team.',
    tag: 'New',
    tagClass: 'bg-primary-100 text-primary-700',
  },
  {
    title: 'Reports export',
    body: 'Exported CSVs now preserve grouping and respect locale-formatted dates.',
    tag: 'Fixed',
    tagClass: 'bg-surface-muted text-fg',
  },
];

interface TermsSection {
  readonly heading: string;
  readonly body: string;
}

const TERMS_SECTIONS: readonly TermsSection[] = [
  {
    heading: '1. Acceptance of terms',
    body: 'By creating an account or using the service you agree to these terms. If you are using the service on behalf of an organization, you represent that you have the authority to bind that organization to these terms.',
  },
  {
    heading: '2. Your account',
    body: 'You are responsible for keeping your credentials confidential and for any activity that occurs under your account. Notify us immediately if you suspect unauthorized access.',
  },
  {
    heading: '3. Acceptable use',
    body: 'Do not use the service to store or distribute malware, send unsolicited messages, infringe the rights of others, or to interfere with the operation of the service for other customers.',
  },
  {
    heading: '4. Content ownership',
    body: 'You retain all rights to the content you upload. You grant us a limited license to process, display, and back up that content solely to operate the service on your behalf.',
  },
  {
    heading: '5. Privacy',
    body: 'Our privacy notice describes the categories of personal data we process, why we process it, and the choices available to you. We do not sell personal data to third parties.',
  },
  {
    heading: '6. Availability and support',
    body: 'We target 99.9% monthly uptime for paid plans. Planned maintenance is announced at least 48 hours in advance through the status page and in-app banners.',
  },
  {
    heading: '7. Subscriptions and billing',
    body: 'Paid plans renew automatically on their billing cycle until cancelled. Taxes, where applicable, are added on top of the plan price and shown on every invoice.',
  },
  {
    heading: '8. Suspension and termination',
    body: 'We may suspend or terminate access for material breach of these terms, non-payment, or suspected fraud. You may export your content for 30 days after an account is closed.',
  },
  {
    heading: '9. Liability',
    body: 'To the extent permitted by law, our aggregate liability under these terms is limited to the fees paid in the twelve months preceding the event giving rise to the claim.',
  },
  {
    heading: '10. Changes to these terms',
    body: 'We may update these terms from time to time. Material changes are announced at least 30 days before they take effect; continued use after that date constitutes acceptance.',
  },
];

@Component({
  selector: 'app-dialog-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ButtonDirective,
    DialogHeaderDirective,
    DialogIconDirective,
    DialogTitleDirective,
    DialogSubtitleDirective,
    DialogDescriptionDirective,
    DialogContentDirective,
    DialogActionsDirective,
    DialogCloseDirective,
    CodeBlockComponent,
  ],
  template: `
    <!-- Sizes -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Sizes</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        config option maps the dialog panel to one of six Tailwind
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max-w-*</code>
        values and a shared
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max-h-[85vh]</code>
        cap. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">sm</code>
        for confirmations,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">md</code>
        for standard forms, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fullscreen</code>
        for task-takeover flows on mobile or immersive editors.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          @for (s of sizes; track s) {
            <button twButton variant="outline" size="sm" (click)="openSize(s)">
              {{ s }}
            </button>
          }
        </div>
      </div>
      <tw-code-block [code]="sizesSnippet" language="ts" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">fullscreen</code>
        drops the rounded corners and border to fill the viewport —
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max-h-[85vh]</code>
        is also removed so the body can scroll the full height.
      </p>

      <ng-template #sizeTpl let-s>
        @switch (s) {
          @case ('xs') {
            <div twDialogContent>
              <h2 twDialogTitle>Leave this page?</h2>
              <p class="mt-2 text-sm text-fg-muted">Your progress is saved in this browser.</p>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Stay</button>
              <button twButton color="error" [twDialogClose]="'leave'">Leave</button>
            </div>
          }
          @case ('sm') {
            <div twDialogHeader>
              <div twDialogIcon color="warning">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
                  <path fill-rule="evenodd" d="M4 5a2 2 0 012-2h3a2 2 0 012 2v1h3a2 2 0 012 2v5a2 2 0 01-2 2H4a2 2 0 01-2-2V8a2 2 0 012-2V5zm6 0v1H6V5a.5.5 0 01.5-.5h3a.5.5 0 01.5.5zm-6 3h12v5H4V8z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 twDialogTitle>Archive this item?</h2>
                <p twDialogSubtitle>You can restore it from the archive within 30 days.</p>
              </div>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Cancel</button>
              <button twButton [twDialogClose]="'archived'">Archive</button>
            </div>
          }
          @case ('md') {
            <div twDialogContent>
              <h2 twDialogTitle>Create a new project</h2>
              <p twDialogSubtitle class="mt-1">Fill in the details and pick a starting template.</p>

              <div class="mt-5 space-y-4">
                <div>
                  <label class="block text-xs font-medium text-fg-muted mb-1">Project name</label>
                  <div class="flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-fg">
                    acme-ledger
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-fg-muted mb-1">Visibility</label>
                  <div class="flex gap-2">
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-primary-100 text-primary-700 px-2.5 py-1 text-xs font-medium">
                      <span class="size-1.5 rounded-full bg-primary-500"></span>
                      Private
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-surface-muted text-fg-muted px-2.5 py-1 text-xs">
                      Public
                    </span>
                    <span class="inline-flex items-center gap-1.5 rounded-md bg-surface-muted text-fg-muted px-2.5 py-1 text-xs">
                      Internal
                    </span>
                  </div>
                </div>
                <div>
                  <label class="block text-xs font-medium text-fg-muted mb-1">Template</label>
                  <div class="grid grid-cols-3 gap-2">
                    <div class="rounded-md border border-primary-500 ring-2 ring-primary-500/20 bg-primary-50/40 px-3 py-2 text-xs">
                      <p class="font-medium text-fg">Blank</p>
                      <p class="text-fg-muted">Empty project</p>
                    </div>
                    <div class="rounded-md border border-border px-3 py-2 text-xs">
                      <p class="font-medium text-fg">Reporting</p>
                      <p class="text-fg-muted">Dashboards + ETL</p>
                    </div>
                    <div class="rounded-md border border-border px-3 py-2 text-xs">
                      <p class="font-medium text-fg">Playbook</p>
                      <p class="text-fg-muted">Runbooks + tasks</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Cancel</button>
              <button twButton [twDialogClose]="'created'">Create project</button>
            </div>
          }
          @case ('lg') {
            <div twDialogContent>
              <h2 twDialogTitle>Share report · Q4 revenue</h2>
              <p twDialogSubtitle class="mt-1">Recipients will get read-only access to the latest snapshot.</p>

              <div class="mt-5 rounded-lg border border-border-muted bg-surface-muted px-4 py-3 flex items-center justify-between gap-3">
                <div class="min-w-0">
                  <p class="text-xs text-fg-muted">Shareable link</p>
                  <p class="truncate font-mono text-sm text-fg">app.acme.co/r/q4-rev-2025</p>
                </div>
                <button twButton size="sm" variant="outline">Copy</button>
              </div>

              <p class="mt-5 text-xs font-medium text-fg-muted uppercase tracking-wide">Shared with</p>
              <ul class="mt-2 divide-y divide-border-muted">
                @for (t of teammates; track t.initials) {
                  <li class="flex items-center justify-between py-2.5">
                    <div class="flex items-center gap-3 min-w-0">
                      <div [class]="'size-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ' + t.avatar">
                        {{ t.initials }}
                      </div>
                      <div class="min-w-0">
                        <p class="text-sm text-fg truncate">{{ t.name }}</p>
                        <p class="text-xs text-fg-muted truncate">{{ t.role }}</p>
                      </div>
                    </div>
                    <span class="text-xs text-fg-subtle shrink-0">Can view</span>
                  </li>
                }
              </ul>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Done</button>
              <button twButton [twDialogClose]="'shared'">Send invites</button>
            </div>
          }
          @case ('xl') {
            <div twDialogHeader>
              <div twDialogIcon color="primary">
                <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
                  <path fill-rule="evenodd" d="M9 4.5a.75.75 0 01.721.544l.813 2.846a3.75 3.75 0 002.576 2.576l2.846.813a.75.75 0 010 1.442l-2.846.813a3.75 3.75 0 00-2.576 2.576l-.813 2.846a.75.75 0 01-1.442 0l-.813-2.846a3.75 3.75 0 00-2.576-2.576l-2.846-.813a.75.75 0 010-1.442l2.846-.813A3.75 3.75 0 007.466 7.89l.813-2.846A.75.75 0 019 4.5z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <h2 twDialogTitle>Release notes · v2.4</h2>
                <p twDialogSubtitle>Four updates shipping this week.</p>
              </div>
            </div>
            <div twDialogContent>
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                @for (f of releaseFeatures; track f.title) {
                  <div class="rounded-lg border border-border-muted p-4 bg-surface">
                    <div class="flex items-center gap-2 mb-1.5">
                      <span [class]="'inline-flex items-center rounded-md px-2 py-0.5 text-2xs font-medium ' + f.tagClass">
                        {{ f.tag }}
                      </span>
                      <p class="text-sm font-semibold text-fg truncate">{{ f.title }}</p>
                    </div>
                    <p class="text-sm text-fg-muted leading-relaxed">{{ f.body }}</p>
                  </div>
                }
              </div>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Close</button>
              <button twButton variant="outline" [twDialogClose]="'changelog'">Read changelog</button>
              <button twButton [twDialogClose]="'acknowledged'">Got it</button>
            </div>
          }
          @case ('fullscreen') {
            <div twDialogContent>
              <div class="flex items-center justify-between gap-4">
                <div>
                  <h2 twDialogTitle>New message</h2>
                  <p twDialogSubtitle class="mt-1">Drafted to the operations team.</p>
                </div>
                <span class="inline-flex items-center gap-1.5 rounded-md bg-success-100 text-success-700 px-2.5 py-1 text-xs font-medium">
                  <span class="size-1.5 rounded-full bg-success-500"></span>
                  Autosaved · 2s ago
                </span>
              </div>

              <div class="mt-5 grid grid-cols-[auto_1fr] gap-x-4 gap-y-3 text-sm">
                <span class="text-fg-muted">To</span>
                <div class="flex flex-wrap gap-1.5">
                  @for (t of teammates; track t.initials) {
                    <span class="inline-flex items-center gap-1.5 rounded-md border border-border-muted bg-surface-muted px-2 py-0.5 text-xs text-fg">
                      <span [class]="'size-4 rounded-full flex items-center justify-center text-[9px] font-semibold ' + t.avatar">{{ t.initials }}</span>
                      {{ t.name }}
                    </span>
                  }
                </div>

                <span class="text-fg-muted">Subject</span>
                <span class="text-fg">Q4 retrospective agenda</span>
              </div>

              <div class="mt-5 rounded-lg border border-border bg-surface p-4 h-64 overflow-y-auto text-sm text-fg leading-relaxed space-y-3">
                <p>Hi team — I've put together the agenda for Friday's Q4 retro.</p>
                <p>Topics to cover:</p>
                <ul class="list-disc list-inside text-fg-muted space-y-1">
                  <li>What we shipped vs. what we planned.</li>
                  <li>Reliability incidents and remediation timelines.</li>
                  <li>Customer research themes from the last two cycles.</li>
                  <li>Capacity plan for Q1 with the new hires factored in.</li>
                </ul>
                <p>Please add any topics you want to discuss to the shared doc before EOD Thursday.</p>
                <p class="text-fg-muted">— E.</p>
              </div>
            </div>
            <div twDialogActions>
              <button twButton variant="ghost" twDialogClose>Discard</button>
              <button twButton variant="outline" [twDialogClose]="'saved-draft'">Save as draft</button>
              <button twButton [twDialogClose]="'sent'">Send</button>
            </div>
          }
        }
      </ng-template>
    </section>

    <!-- Confirmation (alertdialog) -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Confirmation (alertdialog)</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        For destructive or time-critical confirmations pass
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role: 'alertdialog'</code>
        — this signals to assistive tech that the message is urgent and, when combined with a
        typed result on
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterClosed()</code>,
        gives you a boolean commit/cancel flow in a single call.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton color="error" variant="outline" (click)="openConfirm()">
            Delete repository
          </button>
          @if (lastConfirmResult() !== undefined) {
            <span class="text-sm text-fg-muted">
              Result:
              <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">
                {{ lastConfirmResult() ? 'confirmed' : 'cancelled' }}
              </code>
            </span>
          }
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="confirmTsSnippet" language="ts" />
        <tw-code-block [code]="confirmHtmlSnippet" language="html" />
      </div>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        Reserve
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">alertdialog</code>
        for messages that interrupt a task — routine forms and neutral prompts should keep the
        default
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">role: 'dialog'</code>.
      </p>

      <ng-template #confirmTpl>
        <div twDialogHeader>
          <div twDialogIcon color="error">
            <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 twDialogTitle>Permanently delete acme-ledger?</h2>
            <p twDialogSubtitle>This removes the repository and everything it contains.</p>
          </div>
        </div>
        <div twDialogContent>
          <p twDialogDescription class="text-sm text-fg-muted">
            The following will be permanently deleted and cannot be recovered.
          </p>
          <ul class="mt-3 space-y-1.5 text-sm">
            <li class="flex items-center justify-between py-1 border-b border-border-muted">
              <span class="text-fg">Open issues</span>
              <span class="tabular-nums text-fg-muted">14</span>
            </li>
            <li class="flex items-center justify-between py-1 border-b border-border-muted">
              <span class="text-fg">Deploy environments</span>
              <span class="tabular-nums text-fg-muted">3</span>
            </li>
            <li class="flex items-center justify-between py-1 border-b border-border-muted">
              <span class="text-fg">Automated runs (last 30 days)</span>
              <span class="tabular-nums text-fg-muted">128</span>
            </li>
            <li class="flex items-center justify-between py-1">
              <span class="text-fg">Contributor access</span>
              <span class="tabular-nums text-fg-muted">6 people</span>
            </li>
          </ul>
          <div class="mt-4 flex items-start gap-2 rounded-md border border-error-300 bg-error-50 px-3 py-2 text-xs text-error-800">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4 shrink-0 mt-0.5">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clip-rule="evenodd"/>
            </svg>
            <span>This action cannot be undone. Consider archiving if you might need the history later.</span>
          </div>
        </div>
        <div twDialogActions>
          <button twButton variant="ghost" [twDialogClose]="false">Cancel</button>
          <button twButton color="error" [twDialogClose]="true">Delete repository</button>
        </div>
      </ng-template>
    </section>

    <!-- Long scrollable content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Long scrollable content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        The
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">twDialogContent</code>
        directive is the scroll region — apply it between the header and actions and content that
        exceeds
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">max-h-[85vh]</code>
        scrolls internally while the header, actions, and backdrop stay pinned. The directive
        hosts CDK's
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">CdkScrollable</code>
        so overlay scroll strategies and nested scrollables continue to work as expected.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="openScroll()">Open terms of service</button>
      </div>
      <tw-code-block [code]="scrollSnippet" language="html" />

      <ng-template #scrollTpl>
        <div twDialogHeader>
          <div twDialogIcon color="neutral">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
              <path fill-rule="evenodd" d="M4.5 2A1.5 1.5 0 003 3.5v13A1.5 1.5 0 004.5 18h11a1.5 1.5 0 001.5-1.5V7.621a1.5 1.5 0 00-.44-1.06l-4.12-4.122A1.5 1.5 0 0011.378 2H4.5zm2.25 8.5a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5zm0 3a.75.75 0 000 1.5h6.5a.75.75 0 000-1.5h-6.5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 twDialogTitle>Terms of service</h2>
            <p twDialogSubtitle>Last updated 12 March 2026 · takes about 3 minutes to read.</p>
          </div>
        </div>
        <div twDialogContent>
          @for (t of termsSections; track t.heading) {
            <section class="pb-5 mb-5 border-b border-border-muted last:border-0 last:pb-0 last:mb-0">
              <h3 class="text-sm font-semibold text-fg">{{ t.heading }}</h3>
              <p class="mt-1.5 text-sm text-fg-muted leading-relaxed">{{ t.body }}</p>
            </section>
          }
        </div>
        <div twDialogActions>
          <button twButton variant="ghost" [twDialogClose]="false">Decline</button>
          <button twButton [twDialogClose]="true">Accept</button>
        </div>
      </ng-template>
    </section>

    <!-- Component content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Component content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Open any standalone component by passing its class to
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dialog.open()</code>.
        The component receives the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TW_DIALOG_DATA</code>
        payload through DI and can inject
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDialogRef</code>
        to drive the lifecycle (close, read state, subscribe to animation events). Reach for
        component content over templates when the dialog has non-trivial logic or is reused across
        call sites.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton (click)="openProfile()">Open teammate card</button>
          @if (lastProfileResult()) {
            <span class="text-sm text-fg-muted">
              Result:
              <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">
                {{ lastProfileResult() }}
              </code>
            </span>
          }
        </div>
      </div>
      <div class="space-y-3">
        <tw-code-block [code]="componentTsSnippet" language="ts" />
        <tw-code-block [code]="componentCallSnippet" language="ts" />
      </div>
    </section>

    <!-- Close guard -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Close guard</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">closePredicate</code>
        to veto close attempts from Escape, the backdrop, and programmatic
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">close()</code>
        calls alike. The predicate receives the pending result and config — return
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">false</code>
        to block and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">true</code>
        to allow. Typical use: warn before discarding unsaved form changes.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <button twButton variant="outline" (click)="openGuarded()">Discard unsaved changes</button>
      </div>
      <tw-code-block [code]="guardSnippet" language="ts" />
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mt-4">
        A guarded dialog still respects
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disableClose</code>
        — you can combine them to block Escape / backdrop entirely and only allow close through an
        explicit action button.
      </p>

      <ng-template #guardTpl>
        <div twDialogHeader>
          <div twDialogIcon color="warning">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
              <path fill-rule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 twDialogTitle>Discard unsaved changes?</h2>
            <p twDialogSubtitle>You've edited 3 fields that haven't been saved.</p>
          </div>
        </div>
        <div twDialogContent>
          <ul class="space-y-2">
            <li class="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2 text-sm">
              <span class="text-fg-muted">Display name</span>
              <span class="flex items-center gap-2 text-fg">
                <span class="text-fg-subtle line-through">E. Moreau</span>
                <span aria-hidden="true" class="text-fg-subtle">→</span>
                <span>Elena Moreau</span>
              </span>
            </li>
            <li class="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2 text-sm">
              <span class="text-fg-muted">Role</span>
              <span class="flex items-center gap-2 text-fg">
                <span class="text-fg-subtle line-through">Engineer</span>
                <span aria-hidden="true" class="text-fg-subtle">→</span>
                <span>Engineering lead</span>
              </span>
            </li>
            <li class="flex items-center justify-between rounded-md border border-border-muted bg-surface-muted px-3 py-2 text-sm">
              <span class="text-fg-muted">Bio</span>
              <span class="text-fg-subtle italic">3 new lines</span>
            </li>
          </ul>

          <label class="mt-5 flex items-start gap-3 rounded-md border border-warning-300 bg-warning-50 px-3 py-2.5 text-sm text-warning-800 cursor-pointer">
            <input
              type="checkbox"
              class="mt-0.5 size-4 rounded border-warning-400 text-warning-600 focus-visible:outline-warning-500"
              [checked]="guardReady()"
              (change)="guardReady.set(!guardReady())"
            />
            <span>Yes, discard my changes. I understand this cannot be undone.</span>
          </label>

          <p class="mt-3 text-xs text-fg-subtle">
            Escape and backdrop clicks stay disabled until you confirm — this is what
            <code class="font-mono text-fg-muted">closePredicate</code> enforces.
          </p>
        </div>
        <div twDialogActions>
          <button twButton color="error" twDialogClose>Discard changes</button>
        </div>
      </ng-template>
    </section>

    <!-- Lifecycle events -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Lifecycle events</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TwDialogRef</code>
        exposes three lifecycle observables:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterOpened()</code>
        fires once the enter animation finishes,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">beforeClosed()</code>
        at the start of the exit animation, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterClosed()</code>
        once the overlay is fully disposed. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">beforeClosed</code>
        for cleanup that must run with the dialog still mounted (focus restoration hints, for
        instance), and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterClosed</code>
        for handling the result.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3 flex-wrap">
          <button twButton variant="outline" (click)="openLifecycle()">Open import summary</button>
          <span class="text-sm text-fg-muted">
            Events:
            <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ lifecycleLog() || '—' }}</code>
          </span>
        </div>
      </div>
      <tw-code-block [code]="lifecycleSnippet" language="ts" />

      <ng-template #lifecycleTpl>
        <div twDialogHeader>
          <div twDialogIcon color="success">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 twDialogTitle>Import complete</h2>
            <p twDialogSubtitle>Processed 1,248 records in 12.4 seconds.</p>
          </div>
        </div>
        <div twDialogContent>
          <div class="grid grid-cols-3 gap-2">
            <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
              <p class="text-lg font-semibold text-success-700 tabular-nums">1,242</p>
              <p class="text-xs text-fg-muted">Imported</p>
            </div>
            <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
              <p class="text-lg font-semibold text-warning-700 tabular-nums">6</p>
              <p class="text-xs text-fg-muted">Skipped</p>
            </div>
            <div class="rounded-lg border border-border-muted bg-surface-muted px-3 py-2">
              <p class="text-lg font-semibold text-fg tabular-nums">0</p>
              <p class="text-xs text-fg-muted">Errors</p>
            </div>
          </div>
          <p class="mt-4 text-sm text-fg-muted">
            Six rows were skipped because they duplicated existing IDs. The full report is available
            in the activity log.
          </p>
        </div>
        <div twDialogActions>
          <button twButton variant="ghost" twDialogClose>Close</button>
          <button twButton [twDialogClose]="'open-report'">Open report</button>
        </div>
      </ng-template>
    </section>

    <!-- Stacked dialogs -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Stacked dialogs</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Calling
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">open()</code>
        from inside another dialog stacks them; only the top dialog receives focus and keyboard
        events, and closing it returns focus to the parent. Read
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dialog.openDialogs</code>
        for a reactive list,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dialog.closeAll()</code>
        to dismiss everything, or
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dialog.afterAllClosed</code>
        to run work once the full stack is gone.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton variant="outline" (click)="openStacked()">Invite to project</button>
          <span class="text-sm text-fg-muted">
            Stack depth:
            <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ openCount().length }}</code>
          </span>
        </div>
      </div>
      <tw-code-block [code]="stackedSnippet" language="ts" />

      <ng-template #parentTpl>
        <div twDialogContent>
          <h2 twDialogTitle>Invite to acme-ledger</h2>
          <p twDialogSubtitle class="mt-1">Pick a teammate or add someone new by email.</p>

          <p class="mt-5 text-xs font-medium text-fg-muted uppercase tracking-wide">Recent collaborators</p>
          <ul class="mt-2 divide-y divide-border-muted">
            @for (t of teammates; track t.initials) {
              <li class="flex items-center justify-between py-2.5">
                <div class="flex items-center gap-3 min-w-0">
                  <div [class]="'size-9 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ' + t.avatar">
                    {{ t.initials }}
                  </div>
                  <div class="min-w-0">
                    <p class="text-sm text-fg truncate">{{ t.name }}</p>
                    <p class="text-xs text-fg-muted truncate">{{ t.role }}</p>
                  </div>
                </div>
                <button twButton size="xs" variant="outline">Invite</button>
              </li>
            }
          </ul>
        </div>
        <div twDialogActions align="start">
          <button twButton variant="outline" (click)="openChild()">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-4 shrink-0">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z"/>
            </svg>
            Invite someone new
          </button>
          <span class="ml-auto"></span>
          <button twButton variant="ghost" twDialogClose>Done</button>
        </div>
      </ng-template>

      <ng-template #childTpl>
        <div twDialogContent>
          <h2 twDialogTitle>Add a new teammate</h2>
          <p twDialogSubtitle class="mt-1">They'll receive an email with the project link.</p>

          <div class="mt-5 space-y-4">
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Email</label>
              <div class="flex h-9 items-center rounded-md border border-border bg-surface px-3 text-sm text-fg font-mono">
                maya.okafor&#64;acme.co
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Role</label>
              <div class="flex gap-2">
                <span class="inline-flex items-center gap-1.5 rounded-md bg-primary-100 text-primary-700 px-2.5 py-1 text-xs font-medium">
                  <span class="size-1.5 rounded-full bg-primary-500"></span>
                  Editor
                </span>
                <span class="inline-flex items-center rounded-md bg-surface-muted text-fg-muted px-2.5 py-1 text-xs">
                  Viewer
                </span>
                <span class="inline-flex items-center rounded-md bg-surface-muted text-fg-muted px-2.5 py-1 text-xs">
                  Admin
                </span>
              </div>
            </div>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">Personal note</label>
              <div class="rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg-muted italic">
                "Welcome to the team — ping me on Slack if anything's unclear."
              </div>
            </div>
          </div>
        </div>
        <div twDialogActions>
          <button twButton variant="ghost" twDialogClose>Back</button>
          <button twButton [twDialogClose]="'invited'">Send invite</button>
        </div>
      </ng-template>
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every open-time option at once. Switch
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">size</code>
        with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">scrollBehavior</code>
        to see how the overlay reacts to page scroll, or turn off
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">hasBackdrop</code>
        and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">disableClose</code>
        to build a persistent modal that only closes through a button.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="flex flex-wrap gap-4 mb-6">
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Size</label>
            <div class="flex flex-wrap gap-1">
              @for (s of sizes; track s) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playSize() === s"
                        [class.!text-primary-700]="playSize() === s"
                        (click)="playSize.set(s)">{{ s }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Role</label>
            <div class="flex gap-1">
              @for (r of roles; track r) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playRole() === r"
                        [class.!text-primary-700]="playRole() === r"
                        (click)="playRole.set(r)">{{ r }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Scroll behavior</label>
            <div class="flex gap-1">
              @for (b of scrollBehaviors; track b) {
                <button twButton variant="ghost" color="neutral" size="xs"
                        [class.!bg-primary-100]="playScroll() === b"
                        [class.!text-primary-700]="playScroll() === b"
                        (click)="playScroll.set(b)">{{ b }}</button>
              }
            </div>
          </div>
          <div>
            <label class="block text-xs font-medium text-fg-muted mb-1">Features</label>
            <div class="flex gap-1">
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playHasBackdrop()"
                      [class.!text-primary-700]="playHasBackdrop()"
                      (click)="playHasBackdrop.update(v => !v)">backdrop</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playDisableClose()"
                      [class.!text-primary-700]="playDisableClose()"
                      (click)="playDisableClose.update(v => !v)">disableClose</button>
              <button twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playInstant()"
                      [class.!text-primary-700]="playInstant()"
                      (click)="playInstant.update(v => !v)">instant</button>
            </div>
          </div>
        </div>
        <div class="p-8 rounded-lg bg-surface-sunken">
          <button twButton (click)="openPlayground()">Open dialog</button>
          <p class="text-xs text-fg-muted mt-4 font-mono">
            size = {{ playSize() }} · role = {{ playRole() }} · scrollBehavior = {{ playScroll() }}
          </p>
        </div>
      </div>

      <ng-template #playgroundTpl>
        <div twDialogHeader>
          <div twDialogIcon color="primary">
            <svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" class="size-5">
              <path fill-rule="evenodd" d="M7.84 1.804A1 1 0 018.82 1h2.36a1 1 0 01.98.804l.331 1.652a6.993 6.993 0 011.929 1.115l1.598-.54a1 1 0 011.186.447l1.18 2.044a1 1 0 01-.205 1.251l-1.267 1.113a7.047 7.047 0 010 2.228l1.267 1.113a1 1 0 01.206 1.25l-1.18 2.045a1 1 0 01-1.187.447l-1.598-.54a6.993 6.993 0 01-1.929 1.115l-.33 1.652a1 1 0 01-.98.804H8.82a1 1 0 01-.98-.804l-.331-1.652a6.993 6.993 0 01-1.929-1.115l-1.598.54a1 1 0 01-1.186-.447l-1.18-2.044a1 1 0 01.205-1.251l1.267-1.114a7.05 7.05 0 010-2.227L1.821 7.773a1 1 0 01-.206-1.25l1.18-2.045a1 1 0 011.187-.447l1.598.54A6.993 6.993 0 017.51 3.456l.33-1.652zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="flex-1 min-w-0">
            <h2 twDialogTitle>Review your configuration</h2>
            <p twDialogSubtitle>These values come straight from the playground controls.</p>
          </div>
        </div>
        <div twDialogContent>
          <dl class="divide-y divide-border-muted text-sm">
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">size</dt>
              <dd class="font-mono text-xs text-fg">{{ playSize() }}</dd>
            </div>
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">role</dt>
              <dd class="font-mono text-xs text-fg">{{ playRole() }}</dd>
            </div>
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">scrollBehavior</dt>
              <dd class="font-mono text-xs text-fg">{{ playScroll() }}</dd>
            </div>
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">hasBackdrop</dt>
              <dd class="font-mono text-xs text-fg">{{ playHasBackdrop() }}</dd>
            </div>
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">disableClose</dt>
              <dd class="font-mono text-xs text-fg">{{ playDisableClose() }}</dd>
            </div>
            <div class="flex items-center justify-between py-2">
              <dt class="text-fg-muted">enter / exit animation</dt>
              <dd class="font-mono text-xs text-fg">{{ playInstant() ? '0ms / 0ms' : '150ms / 120ms' }}</dd>
            </div>
          </dl>
        </div>
        <div twDialogActions>
          <button twButton variant="ghost" twDialogClose>Cancel</button>
          <button twButton [twDialogClose]="'done'">Confirm</button>
        </div>
      </ng-template>
    </section>
  `,
})
export class DialogExamples {
  private readonly dialog = inject(TwDialog);

  protected readonly sizes = SIZES;
  protected readonly roles = ROLES;
  protected readonly scrollBehaviors = SCROLL_BEHAVIORS;
  protected readonly teammates = TEAMMATES;
  protected readonly releaseFeatures = RELEASE_FEATURES;
  protected readonly termsSections = TERMS_SECTIONS;

  protected readonly lastConfirmResult = signal<boolean | undefined>(undefined);
  protected readonly lastProfileResult = signal<string | undefined>(undefined);
  protected readonly lifecycleLog = signal('');
  protected readonly guardReady = signal(false);
  protected readonly openCount = this.dialog.openDialogs;

  protected readonly sizeTpl = viewChild.required<TemplateRef<{ $implicit: TwDialogSize }>>('sizeTpl');
  protected readonly confirmTpl = viewChild.required<TemplateRef<unknown>>('confirmTpl');
  protected readonly scrollTpl = viewChild.required<TemplateRef<unknown>>('scrollTpl');
  protected readonly guardTpl = viewChild.required<TemplateRef<unknown>>('guardTpl');
  protected readonly lifecycleTpl = viewChild.required<TemplateRef<unknown>>('lifecycleTpl');
  protected readonly parentTpl = viewChild.required<TemplateRef<unknown>>('parentTpl');
  protected readonly childTpl = viewChild.required<TemplateRef<unknown>>('childTpl');
  protected readonly playgroundTpl = viewChild.required<TemplateRef<unknown>>('playgroundTpl');

  // Playground signals
  protected readonly playSize = signal<TwDialogSize>('md');
  protected readonly playRole = signal<TwDialogRole>('dialog');
  protected readonly playScroll = signal<TwDialogScrollStrategy>('block');
  protected readonly playHasBackdrop = signal(true);
  protected readonly playDisableClose = signal(false);
  protected readonly playInstant = signal(false);

  protected openSize(size: TwDialogSize): void {
    this.dialog.open(this.sizeTpl(), { size, data: size });
  }

  protected openConfirm(): void {
    const ref = this.dialog.open<boolean>(this.confirmTpl(), {
      size: 'sm',
      role: 'alertdialog',
    });
    ref.afterClosed().subscribe((result) => this.lastConfirmResult.set(result));
  }

  protected openProfile(): void {
    const ref = this.dialog.open<string, UserProfileData>(DialogUserProfile, {
      size: 'sm',
      data: {
        name: 'Elena Moreau',
        handle: 'elena',
        role: 'Engineering lead',
        location: 'Lyon, France',
        bio: 'Runs the platform team. Writes about distributed systems, occasionally teaches, rarely tweets.',
        stats: { followers: 1284, projects: 18, reviews: 342 },
        activity: [
          { label: 'Reviewed PR #1482 in acme-ledger',   meta: '2h ago' },
          { label: 'Merged PR #1480 — replay backfills', meta: 'yesterday' },
          { label: 'Opened issue #912 — worker timeouts', meta: '3d ago' },
        ],
      },
    });
    ref.afterClosed().subscribe((result) => this.lastProfileResult.set(result));
  }

  protected openScroll(): void {
    this.dialog.open(this.scrollTpl(), { size: 'md' });
  }

  protected openGuarded(): void {
    this.guardReady.set(false);
    this.dialog.open(this.guardTpl(), {
      size: 'sm',
      closePredicate: () => this.guardReady(),
    });
  }

  protected openLifecycle(): void {
    this.lifecycleLog.set('');
    const ref = this.dialog.open(this.lifecycleTpl(), { size: 'sm' });
    const append = (event: string) =>
      this.lifecycleLog.update((l) => (l ? `${l} → ${event}` : event));
    ref.afterOpened().subscribe(() => append('opened'));
    ref.beforeClosed().subscribe(() => append('beforeClosed'));
    ref.afterClosed().subscribe(() => append('afterClosed'));
  }

  protected openStacked(): void {
    this.dialog.open(this.parentTpl(), { size: 'md' });
  }

  protected openChild(): void {
    this.dialog.open(this.childTpl(), { size: 'sm' });
  }

  protected openPlayground(): void {
    this.dialog.open(this.playgroundTpl(), {
      size: this.playSize(),
      role: this.playRole(),
      scrollBehavior: this.playScroll(),
      hasBackdrop: this.playHasBackdrop(),
      disableClose: this.playDisableClose(),
      enterAnimationDuration: this.playInstant() ? 0 : 150,
      exitAnimationDuration: this.playInstant() ? 0 : 120,
    });
  }

  // ── Code snippets ──

  protected readonly sizesSnippet = `const SIZES: TwDialogSize[] = ['xs', 'sm', 'md', 'lg', 'xl', 'fullscreen'];

protected openSize(size: TwDialogSize): void {
  this.dialog.open(this.sizeTpl(), { size });
}`;

  protected readonly confirmTsSnippet = `const ref = this.dialog.open<boolean>(this.confirmTpl(), {
  size: 'sm',
  role: 'alertdialog',
});
ref.afterClosed().subscribe((result) => this.lastResult.set(result));`;

  protected readonly confirmHtmlSnippet = `<ng-template #confirmTpl>
  <div twDialogHeader>
    <div twDialogIcon color="error">
      <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">…</svg>
    </div>
    <div class="flex-1 min-w-0">
      <h2 twDialogTitle>Permanently delete acme-ledger?</h2>
      <p twDialogSubtitle>This removes the repository and everything it contains.</p>
    </div>
  </div>
  <div twDialogContent>
    <p twDialogDescription class="text-sm text-fg-muted">
      The following will be permanently deleted and cannot be recovered.
    </p>
    <ul class="mt-3 space-y-1.5 text-sm">
      <li>Open issues · 14</li>
      <li>Deploy environments · 3</li>
      <li>Automated runs · 128</li>
      <li>Contributor access · 6</li>
    </ul>
  </div>
  <div twDialogActions>
    <button twButton variant="ghost" [twDialogClose]="false">Cancel</button>
    <button twButton color="error" [twDialogClose]="true">Delete repository</button>
  </div>
</ng-template>`;

  protected readonly scrollSnippet = `<ng-template #scrollTpl>
  <div twDialogHeader>
    <div twDialogIcon color="neutral">…</div>
    <div class="flex-1 min-w-0">
      <h2 twDialogTitle>Terms of service</h2>
      <p twDialogSubtitle>Last updated 12 March 2026.</p>
    </div>
  </div>
  <div twDialogContent>
    @for (t of termsSections; track t.heading) {
      <section class="pb-5 mb-5 border-b border-border-muted last:border-0">
        <h3 class="text-sm font-semibold text-fg">{{ t.heading }}</h3>
        <p class="mt-1.5 text-sm text-fg-muted leading-relaxed">{{ t.body }}</p>
      </section>
    }
  </div>
  <div twDialogActions>
    <button twButton variant="ghost" [twDialogClose]="false">Decline</button>
    <button twButton [twDialogClose]="true">Accept</button>
  </div>
</ng-template>`;

  protected readonly componentTsSnippet = `interface UserProfileData {
  name: string;
  handle: string;
  role: string;
  location: string;
  bio: string;
  stats: { followers: number; projects: number; reviews: number };
  activity: { label: string; meta: string }[];
}

@Component({
  selector: 'app-user-profile',
  imports: [DialogContentDirective, DialogActionsDirective, DialogCloseDirective, ButtonDirective],
  template: \`
    <div twDialogContent>
      <!-- avatar + name + stats + bio + recent activity -->
    </div>
    <div twDialogActions>
      <button twButton variant="ghost" twDialogClose>Dismiss</button>
      <button twButton variant="outline" [twDialogClose]="'messaged'">Message</button>
      <button twButton [twDialogClose]="'followed'">Follow</button>
    </div>
  \`,
})
class UserProfileDialog {
  protected readonly data = inject<UserProfileData>(TW_DIALOG_DATA);
  protected readonly ref = inject<TwDialogRef<string>>(TwDialogRef);
}`;

  protected readonly componentCallSnippet = `const ref = this.dialog.open<string, UserProfileData>(UserProfileDialog, {
  size: 'sm',
  data: {
    name: 'Elena Moreau',
    handle: 'elena',
    role: 'Engineering lead',
    location: 'Lyon, France',
    bio: 'Runs the platform team…',
    stats: { followers: 1284, projects: 18, reviews: 342 },
    activity: [
      { label: 'Reviewed PR #1482',     meta: '2h ago' },
      { label: 'Merged PR #1480',       meta: 'yesterday' },
      { label: 'Opened issue #912',     meta: '3d ago' },
    ],
  },
});
ref.afterClosed().subscribe((result) => this.lastResult.set(result));`;

  protected readonly guardSnippet = `this.dialog.open(this.guardTpl(), {
  size: 'sm',
  closePredicate: () => this.dirtyForm() === false,
});`;

  protected readonly lifecycleSnippet = `const ref = this.dialog.open(this.tpl(), { size: 'sm' });
ref.afterOpened().subscribe(() => log('opened'));
ref.beforeClosed().subscribe(() => log('beforeClosed'));
ref.afterClosed().subscribe((result) => log('afterClosed', result));`;

  protected readonly stackedSnippet = `protected openParent(): void {
  this.dialog.open(this.parentTpl(), { size: 'md' });
}

protected openChild(): void {
  // Called from inside the parent dialog — CDK handles stacking + focus transfer.
  this.dialog.open(this.childTpl(), { size: 'sm' });
}

// Reactive list + bulk actions:
protected readonly openCount = this.dialog.openDialogs; // Signal<readonly TwDialogRef[]>
this.dialog.closeAll();
this.dialog.afterAllClosed.subscribe(() => resetFilters());`;
}
