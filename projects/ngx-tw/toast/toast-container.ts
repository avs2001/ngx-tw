import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  type ComponentRef,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  Injector,
  TemplateRef,
  ViewEncapsulation,
  inject,
  signal,
  untracked,
} from '@angular/core';
import {
  CdkPortalOutlet,
  type CdkPortalOutletAttachedRef,
} from '@angular/cdk/portal';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { ToastActionDirective, ToastComponent } from './toast-component';
import {
  TW_TOAST_DATA,
  TW_TOAST_REF,
  type ToastPosition,
  type ToastTemplateContext,
} from './toast-config';
import type { ToastRef } from './toast-ref';

type ToastKind = 'string' | 'template' | 'component';

interface Entry {
  ref: ToastRef;
  kind: ToastKind;
  enterClass: string;
  leaveClass: string;
}

const POSITION_AXIS: Record<ToastPosition, 'right' | 'left' | 'top' | 'bottom'> = {
  'top-right': 'right',
  'bottom-right': 'right',
  'top-left': 'left',
  'bottom-left': 'left',
  'top-center': 'top',
  'bottom-center': 'bottom',
};

const POSITION_HOST_CLASSES: Record<ToastPosition, string> = {
  'top-right': 'items-end',
  'bottom-right': 'items-end',
  'top-left': 'items-start',
  'bottom-left': 'items-start',
  'top-center': 'items-center',
  'bottom-center': 'items-center',
};

const POSITION_ORDER_REVERSED: Record<ToastPosition, boolean> = {
  'top-right': false,
  'top-left': false,
  'top-center': false,
  'bottom-right': true,
  'bottom-left': true,
  'bottom-center': true,
};

const SWIPE_DISMISS_FRACTION = 0.4;
const SWIPE_MAX_OPACITY_FADE = 0.6;

/**
 * Internal flex-column host rendered inside each per-position CDK overlay.
 * Stacks visible toasts via `@for`, wires pause-on-interaction, Escape
 * dismissal, swipe gestures, and `LiveAnnouncer` announcements.
 *
 * @docs-private
 */
@Component({
  selector: 'tw-toast-container',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet, CdkPortalOutlet, ToastComponent, ToastActionDirective],
  host: {
    role: 'region',
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'regionLabel()',
    '[attr.data-position]': 'position()',
  },
  template: `
    @for (entry of orderedEntries(); track entry.ref.id) {
      <!-- Toast entry wrapper; the projected <tw-toast> is the focusable affordance.
           This element only forwards pointer/focus events so the container can
           pause auto-dismiss while the user is interacting. -->
      <!-- eslint-disable-next-line @angular-eslint/template/interactive-supports-focus -->
      <div
        class="pointer-events-auto w-full max-w-sm"
        [attr.data-toast-id]="entry.ref.id"
        [style.transform]="entry.ref.swipeTransform() || null"
        [style.opacity]="entry.ref.swipeOpacity() ?? null"
        [style.touch-action]="'pan-y'"
        [animate.enter]="entry.enterClass"
        [animate.leave]="entry.ref.leaveAnimationOverride() ?? entry.leaveClass"
        (pointerenter)="onPointerEnter(entry.ref)"
        (pointerleave)="onPointerLeave(entry.ref)"
        (focusin)="onFocusIn(entry.ref)"
        (focusout)="onFocusOut(entry.ref, $event)"
        (keydown.escape)="onEscape(entry.ref, $event)"
        (pointerdown)="onSwipeStart(entry.ref, $event, swipeEl)"
        #swipeEl
      >
        @switch (entry.kind) {
          @case ('string') {
            <tw-toast
              [severity]="entry.ref.severity()"
              [dismissible]="entry.ref.dismissible()"
              [icon]="entry.ref.icon()"
              [aria-label]="entry.ref.ariaLabel()"
              [class]="panelClassFor(entry.ref)"
              (dismissed)="entry.ref._dismissWith('manual')"
              (actionClicked)="entry.ref.triggerAction()"
            >
              {{ asString(entry.ref.content()) }}
              @if (entry.ref.action(); as action) {
                <button twToastAction>{{ action.label }}</button>
              }
            </tw-toast>
          }
          @case ('template') {
            <tw-toast
              [severity]="entry.ref.severity()"
              [dismissible]="entry.ref.dismissible()"
              [icon]="entry.ref.icon()"
              [aria-label]="entry.ref.ariaLabel()"
              [class]="panelClassFor(entry.ref)"
              (dismissed)="entry.ref._dismissWith('manual')"
              (actionClicked)="entry.ref.triggerAction()"
            >
              <ng-container
                [ngTemplateOutlet]="asTemplate(entry.ref.content())"
                [ngTemplateOutletContext]="templateContext(entry.ref)"
              />
              @if (entry.ref.action(); as action) {
                <button twToastAction>{{ action.label }}</button>
              }
            </tw-toast>
          }
          @case ('component') {
            <ng-template
              [cdkPortalOutlet]="entry.ref._portal"
              (attached)="onPortalAttached(entry.ref, $event)"
            />
          }
        }
      </div>
    }
  `,
})
export class ToastContainerComponent {
  /** Per-position stacking anchor. Mutated from {@link ToastService} via `.instance.position.set(...)`. */
  readonly position = signal<ToastPosition>('bottom-right');

  /** Accessible label applied to the `role="region"` host. Mutated from the service on init. */
  readonly regionLabel = signal<string>('Notifications');

  /**
   * Toasts currently assigned to this container. The service pushes toasts
   * into this signal; the container filters by state to drive `animate.leave`.
   */
  readonly visibleRefs = signal<readonly ToastRef[]>([]);

  private readonly injector = inject(Injector);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly host = inject(ElementRef<HTMLElement>);

  /**
   * Teardown for every swipe currently in flight.
   *
   * `swipeSessions` is a WeakMap and the listeners are bound to the toast
   * element, so neither outlives the DOM — but a swipe interrupted by destroy
   * (the toast auto-dismisses mid-drag) would otherwise leave the pointer
   * capture unreleased. Each entry removes its listeners and releases capture.
   */
  private readonly activeSwipeTeardowns = new Set<() => void>();

  /** Per-toast handle into {@link activeSwipeTeardowns}. */
  private readonly swipeTeardowns = new WeakMap<ToastRef, () => void>();

  private readonly swipeSessions = new WeakMap<
    ToastRef,
    { pointerId: number; startX: number; width: number; active: boolean }
  >();

  constructor() {
    // A toast can auto-dismiss (or the whole container can be torn down) while
    // a drag is still in flight, in which case `onSwipeEnd` never runs.
    inject(DestroyRef).onDestroy(() => {
      for (const teardown of [...this.activeSwipeTeardowns]) teardown();
      this.activeSwipeTeardowns.clear();
    });
  }

  private readonly entries = computed<readonly Entry[]>(() => {
    const pos = this.position();
    const axis = POSITION_AXIS[pos];
    const enter = `toast-enter-${axis}`;
    const leave = `toast-leave-${axis}`;
    const refs = this.visibleRefs().filter((ref) => {
      const s = ref.state();
      return s === 'entering' || s === 'visible' || s === 'paused';
    });
    return refs.map((ref) => ({
      ref,
      kind: resolveKind(ref.content()),
      enterClass: enter,
      leaveClass: leave,
    }));
  });

  protected readonly orderedEntries = computed(() => {
    const list = this.entries();
    return POSITION_ORDER_REVERSED[this.position()] ? [...list].reverse() : list;
  });

  protected readonly hostClasses = computed(() => {
    const base = 'flex flex-col gap-2 w-full max-w-sm';
    const align = POSITION_HOST_CLASSES[this.position()];
    return `${base} ${align}`;
  });

  /** @internal Called by the service right after attaching a new toast. Runs `LiveAnnouncer`. */
  _announceOpen(ref: ToastRef): void {
    const politeness = this.resolvePoliteness(ref);
    if (politeness === 'off') return;
    const msg = this.resolveAnnouncementText(ref);
    if (msg) this.liveAnnouncer.announce(msg, politeness);
  }

  /** @internal Called by the service when `ref.update()` fires — re-announces with the new severity / content. */
  _announceUpdate(ref: ToastRef): void {
    this._announceOpen(ref);
  }

  /** @internal Captures the component instance after `cdkPortalOutlet` attaches. */
  protected onPortalAttached(ref: ToastRef, attached: CdkPortalOutletAttachedRef): void {
    if (attached && 'instance' in attached) {
      ref.componentInstance = (attached as ComponentRef<unknown>).instance;
    }
  }

  /** @internal Injector factory for component-class content. Provides `TW_TOAST_DATA` + `TW_TOAST_REF`. */
  _createContentInjector(ref: ToastRef): Injector {
    return Injector.create({
      parent: this.injector,
      providers: [
        { provide: TW_TOAST_REF, useValue: ref },
        { provide: TW_TOAST_DATA, useValue: ref.data() },
      ],
    });
  }

  // ── Template helpers ──

  protected asString(content: unknown): string {
    return typeof content === 'string' ? content : '';
  }

  protected asTemplate(content: unknown): TemplateRef<ToastTemplateContext> | null {
    return content instanceof TemplateRef ? (content as TemplateRef<ToastTemplateContext>) : null;
  }

  protected templateContext(ref: ToastRef): ToastTemplateContext {
    return { $implicit: ref.data() as never, ref };
  }

  protected panelClassFor(ref: ToastRef): string {
    const raw = ref.config.panelClass;
    if (!raw) return '';
    return Array.isArray(raw) ? raw.join(' ') : raw;
  }

  // ── Interaction handlers ──

  protected onPointerEnter(ref: ToastRef): void {
    ref._setHovered(true);
  }

  protected onPointerLeave(ref: ToastRef): void {
    ref._setHovered(false);
  }

  protected onFocusIn(ref: ToastRef): void {
    ref._setFocused(true);
  }

  protected onFocusOut(ref: ToastRef, event: FocusEvent): void {
    const related = event.relatedTarget as Node | null;
    const target = event.currentTarget as Node | null;
    if (related && target && target.contains(related)) return;
    ref._setFocused(false);
  }

  protected onEscape(ref: ToastRef, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    ref._dismissWith('manual');
  }

  protected onSwipeStart(ref: ToastRef, event: PointerEvent, el: HTMLElement): void {
    if (!ref.config.swipeToDismiss) return;
    if (event.button !== 0) return;
    const target = event.target as HTMLElement | null;
    if (target?.closest('button, a, input, select, textarea, [role="button"]')) return;

    const width = el.getBoundingClientRect().width;
    this.swipeSessions.set(ref, {
      pointerId: event.pointerId,
      startX: event.clientX,
      width,
      active: false,
    });
    try {
      el.setPointerCapture(event.pointerId);
    } catch {
      // setPointerCapture throws when the pointerId is no longer active, and
      // is absent entirely in jsdom. The swipe still tracks via the listeners
      // below — capture is an enhancement, not a prerequisite. Matches the
      // guards already on both `releasePointerCapture` call sites.
    }

    const onMove = (e: PointerEvent) => this.onSwipeMove(ref, e, el);
    const onUp = (e: PointerEvent) => this.onSwipeEnd(ref, e, el, onMove, onUp);
    el.addEventListener('pointermove', onMove);
    el.addEventListener('pointerup', onUp);
    el.addEventListener('pointercancel', onUp);

    const teardown = () => {
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerup', onUp);
      el.removeEventListener('pointercancel', onUp);
      try {
        el.releasePointerCapture(event.pointerId);
      } catch {
        /* capture already released, or the element is detached */
      }
      this.swipeSessions.delete(ref);
      this.activeSwipeTeardowns.delete(teardown);
    };
    this.swipeTeardowns.set(ref, teardown);
    this.activeSwipeTeardowns.add(teardown);
  }

  private onSwipeMove(ref: ToastRef, event: PointerEvent, _el: HTMLElement): void {
    const session = this.swipeSessions.get(ref);
    if (!session || event.pointerId !== session.pointerId) return;
    const dx = event.clientX - session.startX;
    if (!session.active && Math.abs(dx) < 6) return;
    session.active = true;
    ref.swipeTransform.set(`translate3d(${dx}px, 0, 0)`);
    const fade = 1 - Math.min(Math.abs(dx) / session.width, 1) * SWIPE_MAX_OPACITY_FADE;
    ref.swipeOpacity.set(fade);
  }

  private onSwipeEnd(
    ref: ToastRef,
    event: PointerEvent,
    el: HTMLElement,
    onMove: (e: PointerEvent) => void,
    onUp: (e: PointerEvent) => void,
  ): void {
    const session = this.swipeSessions.get(ref);
    el.removeEventListener('pointermove', onMove);
    el.removeEventListener('pointerup', onUp);
    el.removeEventListener('pointercancel', onUp);
    const teardown = this.swipeTeardowns.get(ref);
    if (teardown) {
      this.activeSwipeTeardowns.delete(teardown);
      this.swipeTeardowns.delete(ref);
    }
    if (!session || event.pointerId !== session.pointerId) return;
    try {
      el.releasePointerCapture(session.pointerId);
    } catch {
      /* no-op */
    }
    this.swipeSessions.delete(ref);

    if (!session.active) return;
    const dx = event.clientX - session.startX;
    const threshold = session.width * SWIPE_DISMISS_FRACTION;
    const allowed = this.swipeDirectionAllowed(dx);
    if (Math.abs(dx) >= threshold && allowed) {
      untracked(() => {
        ref.swipeTransform.set(`translate3d(${Math.sign(dx) * session.width * 1.2}px, 0, 0)`);
        ref.swipeOpacity.set(0);
        ref.leaveAnimationOverride.set('fade-out');
      });
      ref._dismissWith('swipe');
    } else {
      ref.swipeTransform.set(null);
      ref.swipeOpacity.set(null);
    }
  }

  private swipeDirectionAllowed(dx: number): boolean {
    const pos = this.position();
    if (pos === 'top-right' || pos === 'bottom-right') return dx > 0;
    if (pos === 'top-left' || pos === 'bottom-left') return dx < 0;
    return true;
  }

  private resolvePoliteness(ref: ToastRef): 'polite' | 'assertive' | 'off' {
    if (ref.config.politeness) return ref.config.politeness;
    return ref.severity() === 'error' ? 'assertive' : 'polite';
  }

  private resolveAnnouncementText(ref: ToastRef): string {
    const explicit = ref.ariaLabel();
    if (explicit) return explicit;
    const content = ref.content();
    if (typeof content === 'string') return content;
    const host = this.host.nativeElement.querySelector(
      `[data-toast-id="${ref.id}"]`,
    ) as HTMLElement | null;
    if (host) return host.textContent?.trim() ?? '';
    return this.host.nativeElement.textContent?.trim() ?? '';
  }
}

function resolveKind(content: unknown): ToastKind {
  if (typeof content === 'string') return 'string';
  if (content instanceof TemplateRef) return 'template';
  return 'component';
}

