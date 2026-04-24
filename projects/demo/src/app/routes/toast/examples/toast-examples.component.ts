import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
  type TemplateRef,
  viewChild,
} from '@angular/core';
import {
  TW_TOAST_DATA,
  TW_TOAST_REF,
  ToastService,
  type ToastPosition,
  type ToastRef,
  type ToastSeverity,
  type ToastTemplateContext,
} from 'ngx-tw/toast';
import { ButtonDirective } from 'ngx-tw/button';
import { CodeBlockComponent } from 'ngx-tw/code-block';

const POSITIONS: ToastPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

const SEVERITIES: ToastSeverity[] = ['info', 'success', 'warning', 'error', 'neutral'];

interface SeveritySample {
  readonly severity: ToastSeverity;
  readonly message: string;
}

const SEVERITY_SAMPLES: readonly SeveritySample[] = [
  { severity: 'info', message: 'Build #4812 started. We’ll let you know when it finishes.' },
  { severity: 'success', message: 'Deployment to production finished in 18 seconds.' },
  { severity: 'warning', message: 'Disk is 92% full — old backups older than 30 days will be pruned tonight.' },
  { severity: 'error', message: 'Couldn’t save the pull request. The upstream branch was force-pushed.' },
  { severity: 'neutral', message: 'Settings synced from acme-production at 14:21 UTC.' },
];

interface InviteData {
  readonly name: string;
}

@Component({
  selector: 'app-toast-invite-card',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective],
  template: `
    <div class="flex items-start gap-3 bg-primary-50 text-primary-900 border border-primary-200 rounded-lg p-4 shadow-md w-full max-w-sm pointer-events-auto">
      <div class="size-9 rounded-full bg-primary-600 text-white flex items-center justify-center shrink-0">
        <svg class="size-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
          <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm3.707 6.707a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" />
        </svg>
      </div>
      <div class="flex-1 min-w-0">
        <p class="font-semibold text-sm">Invite sent to {{ data.name }}</p>
        <p class="text-xs text-primary-800/80 mt-0.5">They'll receive an email with your team link.</p>
        <div class="flex gap-2 mt-3">
          <button twButton size="sm" (click)="ref.dismiss()">Got it</button>
          <button twButton size="sm" variant="ghost" (click)="ref.dismiss()">Revoke</button>
        </div>
      </div>
    </div>
  `,
})
class InviteToastComponent {
  protected readonly data = inject<InviteData>(TW_TOAST_DATA);
  protected readonly ref = inject<ToastRef>(TW_TOAST_REF);
}

@Component({
  selector: 'app-toast-examples',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ButtonDirective, CodeBlockComponent],
  template: `
    <!-- Severities -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Severities</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Severity picks the color palette, the default icon, and the live-region politeness. Use
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">error</code>
        only for genuine failures — it forces
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">aria-live="assertive"</code>
        which interrupts the current screen-reader utterance.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">neutral</code>
        is the right choice for factual notices ("Settings synced") where a colored toast would
        feel alarmist.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-2">
          @for (s of severitySamples; track s.severity) {
            <button twButton variant="outline" (click)="openSeverity(s)">{{ s.severity }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="severitiesSnippet" language="ts" />
    </section>

    <!-- Positions -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Positions</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each position opens its own lazy CDK overlay the first time it's used, and toasts at the
        same position stack vertically. Pick one position per use case and keep it consistent —
        users learn where to look, so don't mix
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom-right</code>
        for success and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">top-center</code>
        for errors.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="grid grid-cols-3 gap-2 max-w-md">
          @for (p of positions; track p) {
            <button twButton variant="outline" size="sm" (click)="openAt(p)">{{ p }}</button>
          }
        </div>
      </div>
      <tw-code-block [code]="positionsSnippet" language="ts" />
    </section>

    <!-- Action button -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Action Button</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        A toast can carry a single action — the canonical example is an <em>Undo</em> button after
        a destructive operation. Supply a handler that receives the
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastRef</code>
        so you can call
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ref.dismiss()</code>
        after reverting. Bump
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">duration</code>
        to 6–8 seconds — the default 4s is too short for users to read and decide.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton variant="outline" color="error" (click)="openUndo()">Archive item</button>
          @if (lastAction(); as action) {
            <span class="text-sm text-fg-muted">
              Last action:
              <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ action }}</code>
            </span>
          }
        </div>
      </div>
      <tw-code-block [code]="actionSnippet" language="ts" />
    </section>

    <!-- Promise helper -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">promise()</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Pass a promise and three messages — the helper opens a pinned loading toast, then mutates
        the same
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastRef</code>
        to show success or error when the promise settles. It re-announces through
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">LiveAnnouncer</code>
        on each transition so screen reader users hear the final result. Use this for any
        user-initiated async operation where you already know what "done" looks like.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex items-center gap-3">
          <button twButton variant="outline" color="success" (click)="runPromise(true)">Simulate save success</button>
          <button twButton variant="outline" color="error" (click)="runPromise(false)">Simulate save failure</button>
        </div>
      </div>
      <tw-code-block [code]="promiseSnippet" language="ts" />
    </section>

    <!-- Pause + swipe -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Pause on Interaction &amp; Swipe</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Two user-friendly defaults worth knowing about.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">pauseOnInteraction</code>
        pauses the auto-dismiss timer while the toast is hovered or keyboard-focused so users can
        finish reading long messages.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">swipeToDismiss</code>
        lets pointer users drag a toast off-screen — disabled automatically under
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">prefers-reduced-motion</code>.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-4">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Pause on hover / focus</p>
          <button twButton variant="outline" (click)="openHoverable()">Open 3s toast — hover to pause</button>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Swipe to dismiss</p>
          <div class="flex flex-wrap gap-2">
            <button twButton variant="outline" (click)="openSwipe(true)">Swipeable (default)</button>
            <button twButton variant="outline" (click)="openSwipe(false)">Swipe disabled</button>
          </div>
        </div>
      </div>
      <tw-code-block [code]="interactionSnippet" language="ts" />
    </section>

    <!-- Custom content -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Custom Content</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Any
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastService.show()</code>
        call accepts three content shapes: a plain
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">string</code>
        for the built-in visual, a
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">TemplateRef</code>
        (with
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">$implicit</code> +
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ref</code>
        in scope), or a component class that receives the ref and data via DI. Reach for the
        component form for anything with its own state — e.g., an invite card that lets users
        revoke from inside the toast.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4 space-y-6">
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">TemplateRef</p>
          <button twButton variant="outline" (click)="openTemplate()">Open templated toast</button>
          <ng-template #tmpl let-data let-ref="ref">
            <strong class="text-sm">{{ data.items }} items updated.</strong>
            <button class="ml-2 text-xs underline cursor-pointer" (click)="ref.dismiss()">Dismiss</button>
          </ng-template>
        </div>
        <div>
          <p class="text-xs font-medium text-fg-muted mb-2 uppercase tracking-wide">Component class</p>
          <button twButton variant="outline" (click)="openComponent()">Open invite card</button>
        </div>
      </div>
      <tw-code-block [code]="templateSnippet" language="html" />
      <div class="mt-3">
        <tw-code-block [code]="componentSnippet" language="ts" />
      </div>
    </section>

    <!-- Stacking -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Stacking &amp; maxVisible</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Each position caps at
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">maxVisible</code>
        (default 5). Open more and the oldest is evicted with dismiss reason
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">'max-exceeded'</code>
        so you can distinguish intentional closes from overflow in analytics.
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">dismissAll()</code>
        is the escape hatch for clearing every active toast across every position.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap gap-2">
          <button twButton variant="outline" (click)="openSpam(3)">Open 3 toasts</button>
          <button twButton variant="outline" (click)="openSpam(8)">Open 8 toasts (max 5)</button>
          <button twButton variant="ghost" (click)="toast.dismissAll()">Dismiss all</button>
        </div>
      </div>
      <tw-code-block [code]="stackingSnippet" language="ts" />
    </section>

    <!-- Lifecycle observables -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Lifecycle Observables</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Every
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">ToastRef</code>
        exposes three lifecycle observables and a state signal:
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterOpened()</code>
        fires once the enter animation finishes,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">beforeDismissed()</code>
        fires at the start of the leave sequence, and
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">afterDismissed()</code>
        fires after the toast is fully removed, carrying the dismiss reason. Use the reason to
        distinguish user dismissals ("manual" / "swipe" / "action") from system ones ("timeout" /
        "max-exceeded" / "programmatic").
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised mb-4">
        <div class="flex flex-wrap items-center gap-3">
          <button twButton variant="outline" (click)="openLifecycle()">Trigger lifecycle</button>
          <span class="text-sm text-fg-muted">
            Events:
            <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">{{ lifecycleLog() || '—' }}</code>
          </span>
        </div>
      </div>
      <tw-code-block [code]="lifecycleSnippet" language="ts" />
    </section>

    <!-- Playground -->
    <section class="mb-10">
      <h2 class="text-sm font-semibold mb-3">Playground</h2>
      <p class="text-sm text-fg-muted leading-relaxed max-w-2xl mb-4">
        Combine every user-facing option at once. A realistic starting config is
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">success</code>
        severity,
        <code class="font-mono text-xs bg-surface-muted px-1 py-0.5 rounded">bottom-right</code>
        position, and the default 4s duration — the most common shape in production apps. Flip
        duration to 0 to pin the toast, and toggle on the action to see how wide the panel grows.
      </p>
      <div class="rounded-lg border border-border p-6 bg-surface-raised">
        <div class="space-y-5 mb-6">
          <div>
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Appearance</p>
            <div class="flex flex-wrap gap-4">
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Severity</label>
                <div class="flex flex-wrap gap-1">
                  @for (s of severities; track s) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playSeverity() === s"
                      [class.!text-primary-700]="playSeverity() === s"
                      (click)="playSeverity.set(s)"
                    >{{ s }}</button>
                  }
                </div>
              </div>
              <div>
                <label class="block text-xs font-medium text-fg-muted mb-1">Position</label>
                <div class="flex flex-wrap gap-1">
                  @for (p of positions; track p) {
                    <button
                      twButton variant="ghost" color="neutral" size="xs"
                      [class.!bg-primary-100]="playPosition() === p"
                      [class.!text-primary-700]="playPosition() === p"
                      (click)="playPosition.set(p)"
                    >{{ p }}</button>
                  }
                </div>
              </div>
            </div>
          </div>

          <div class="border-t border-border-muted pt-5">
            <p class="text-xs font-semibold text-fg uppercase tracking-wide mb-3">Timing</p>
            <div>
              <label class="block text-xs font-medium text-fg-muted mb-1">
                Duration: {{ playDuration() === 0 ? 'pinned' : playDuration() + 'ms' }}
              </label>
              <input
                type="range" min="0" max="10000" step="500"
                [value]="playDuration()"
                (input)="playDuration.set($any($event.target).valueAsNumber)"
                class="accent-primary-600"
              />
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
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playPause()"
                [class.!text-primary-700]="playPause()"
                (click)="playPause.update(v => !v)"
              >pauseOnInteraction</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playSwipe()"
                [class.!text-primary-700]="playSwipe()"
                (click)="playSwipe.update(v => !v)"
              >swipeToDismiss</button>
              <button
                twButton variant="ghost" color="neutral" size="xs"
                [class.!bg-primary-100]="playAction()"
                [class.!text-primary-700]="playAction()"
                (click)="playAction.update(v => !v)"
              >action</button>
            </div>
          </div>
        </div>

        <div class="flex flex-wrap items-center gap-3">
          <button twButton (click)="openPlayground()">Open toast</button>
          <button twButton variant="ghost" color="neutral" (click)="toast.dismissAll()">Dismiss all</button>
        </div>
      </div>
    </section>
  `,
})
export class ToastExamples {
  protected readonly toast = inject(ToastService);
  protected readonly positions = POSITIONS;
  protected readonly severities = SEVERITIES;
  protected readonly severitySamples = SEVERITY_SAMPLES;

  protected readonly lastAction = signal<string | undefined>(undefined);
  protected readonly lifecycleLog = signal('');

  protected readonly tmpl = viewChild.required<TemplateRef<ToastTemplateContext>>('tmpl');

  // Playground state
  protected readonly playSeverity = signal<ToastSeverity>('success');
  protected readonly playPosition = signal<ToastPosition>('bottom-right');
  protected readonly playDuration = signal(4000);
  protected readonly playDismissible = signal(true);
  protected readonly playPause = signal(true);
  protected readonly playSwipe = signal(true);
  protected readonly playAction = signal(false);

  protected openSeverity(sample: SeveritySample): void {
    this.toast.show(sample.message, { severity: sample.severity });
  }

  protected openAt(position: ToastPosition): void {
    this.toast.show(`Hello from ${position}`, { position });
  }

  protected openUndo(): void {
    this.lastAction.set(undefined);
    this.toast.show('Item archived — you have 8 seconds to undo.', {
      severity: 'neutral',
      duration: 8000,
      action: {
        label: 'Undo',
        handler: (ref) => {
          this.lastAction.set('undo clicked — item restored');
          ref.dismiss();
        },
      },
    });
  }

  protected runPromise(shouldResolve: boolean): void {
    const work = new Promise<string>((resolve, reject) => {
      setTimeout(() => {
        if (shouldResolve) resolve('project-42');
        else reject(new Error('Server returned 500'));
      }, 1500);
    });

    this.toast.promise(work, {
      loading: 'Saving changes…',
      success: (id) => `Saved ${id}.`,
      error: (err) => `Could not save: ${(err as Error).message}`,
    });
  }

  protected openHoverable(): void {
    this.toast.show(
      'Hover over this toast to pause the 3-second timer — tab into it from the keyboard for the same effect.',
      { duration: 3000, severity: 'info' },
    );
  }

  protected openSwipe(enabled: boolean): void {
    this.toast.show(
      enabled
        ? 'Drag me horizontally to dismiss.'
        : 'Swipe is disabled — use the × button.',
      { duration: 0, swipeToDismiss: enabled },
    );
  }

  protected openTemplate(): void {
    this.toast.show(this.tmpl(), {
      data: { items: 12 },
      severity: 'success',
      duration: 0,
    });
  }

  protected openComponent(): void {
    this.toast.show(InviteToastComponent, {
      data: { name: 'Tomás Aguilar' } satisfies InviteData,
      duration: 0,
      dismissible: false,
    });
  }

  protected openSpam(count: number): void {
    for (let i = 1; i <= count; i++) {
      this.toast.info(`Notification #${i}`, { duration: 0 });
    }
  }

  protected openLifecycle(): void {
    this.lifecycleLog.set('');
    const ref = this.toast.show('Watch the log update as I open and close.', { duration: 2500 });
    const append = (event: string) =>
      this.lifecycleLog.update((l) => (l ? `${l} → ${event}` : event));
    ref.afterOpened().subscribe(() => append('afterOpened'));
    ref.beforeDismissed().subscribe(() => append('beforeDismissed'));
    ref.afterDismissed().subscribe((d) => append(`afterDismissed (${d.reason})`));
  }

  protected openPlayground(): void {
    this.toast.show('Playground toast — tweak the controls above and reopen.', {
      severity: this.playSeverity(),
      position: this.playPosition(),
      duration: this.playDuration(),
      dismissible: this.playDismissible(),
      pauseOnInteraction: this.playPause(),
      swipeToDismiss: this.playSwipe(),
      action: this.playAction()
        ? { label: 'Action', handler: (ref) => ref.dismiss() }
        : undefined,
    });
  }

  // ── Snippets ───────────────────────────────────────────────────

  protected readonly severitiesSnippet = `protected readonly severitySamples: readonly SeveritySample[] = [
  { severity: 'info',    message: 'Build #4812 started.' },
  { severity: 'success', message: 'Deployment to production finished in 18 seconds.' },
  { severity: 'warning', message: 'Disk is 92% full — old backups will be pruned tonight.' },
  { severity: 'error',   message: 'Could not save the pull request.' },
  { severity: 'neutral', message: 'Settings synced from acme-production.' },
];

protected openSeverity(sample: SeveritySample): void {
  this.toast.show(sample.message, { severity: sample.severity });
}`;

  protected readonly positionsSnippet = `@for (p of positions; track p) {
  <button twButton variant="outline" size="sm" (click)="openAt(p)">
    {{ p }}
  </button>
}

protected openAt(position: ToastPosition): void {
  this.toast.show(\`Hello from \${position}\`, { position });
}`;

  protected readonly actionSnippet = `this.toast.show('Item archived — you have 8 seconds to undo.', {
  severity: 'neutral',
  duration: 8000,
  action: {
    label: 'Undo',
    handler: (ref) => {
      restoreItem();
      ref.dismiss();
    },
  },
});`;

  protected readonly promiseSnippet = `this.toast.promise(saveProject(), {
  loading: 'Saving changes…',
  success: (id) => \`Saved \${id}.\`,
  error:   (err) => \`Could not save: \${(err as Error).message}\`,
});`;

  protected readonly interactionSnippet = `// Pause timer on hover / focus (default)
this.toast.show('Read this carefully — hover to pause.', {
  duration: 3000,
  pauseOnInteraction: true,
});

// Swipe to dismiss (default on)
this.toast.show('Drag me horizontally to dismiss.', {
  duration: 0,
  swipeToDismiss: true,
});`;

  protected readonly templateSnippet = `<ng-template #tmpl let-data let-ref="ref">
  <strong>{{ data.items }} items updated.</strong>
  <button class="underline" (click)="ref.dismiss()">Dismiss</button>
</ng-template>

<!-- in the class -->
this.toast.show(this.tmpl(), {
  data: { items: 12 },
  severity: 'success',
  duration: 0,
});`;

  protected readonly componentSnippet = `@Component({
  selector: 'app-invite-toast',
  template: \`<!-- custom markup -->\`,
})
class InviteToastComponent {
  protected readonly data = inject<{ name: string }>(TW_TOAST_DATA);
  protected readonly ref  = inject<ToastRef>(TW_TOAST_REF);
}

this.toast.show(InviteToastComponent, {
  data: { name: 'Tomás Aguilar' },
  duration: 0,
  dismissible: false,
});`;

  protected readonly stackingSnippet = `// Open past the cap — oldest dismisses with reason 'max-exceeded'
for (let i = 1; i <= 8; i++) {
  this.toast.info(\`Notification #\${i}\`, { duration: 0 });
}

// Clear everything
this.toast.dismissAll();`;

  protected readonly lifecycleSnippet = `const ref = this.toast.show('Watch the log update.', { duration: 2500 });

ref.afterOpened().subscribe(() => log('opened'));
ref.beforeDismissed().subscribe(() => log('beforeDismissed'));
ref.afterDismissed().subscribe((d) => log(\`afterDismissed (\${d.reason})\`));`;
}
