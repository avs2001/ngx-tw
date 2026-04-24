import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  effect,
  ElementRef,
  InjectionToken,
  inject,
  input,
  linkedSignal,
} from '@angular/core';
import { tv } from 'tailwind-variants';
import type { TwColor, TwSize } from 'ngx-tw/core';

/** Status indicator for the avatar. */
export type AvatarStatus = 'online' | 'busy' | 'away' | 'offline';

/** Border radius shape for the avatar. */
export type AvatarRounded = 'full' | 'lg' | 'none';

/**
 * Injection token used by `AvatarGroupComponent` to propagate its size
 * to child avatars. When present, overrides the individual avatar's `size` input.
 */
export const AVATAR_GROUP_SIZE = new InjectionToken<() => TwSize>('AVATAR_GROUP_SIZE');

const avatarVariants = tv({
  slots: {
    root: 'relative inline-flex items-center justify-center overflow-hidden shrink-0',
    img: 'size-full object-cover',
    initials: 'font-medium select-none',
    fallback: 'size-[60%] text-fg-subtle',
    status: 'absolute rounded-full ring-2 ring-surface',
  },
  variants: {
    size: {
      xs: { root: 'size-6 text-xs', status: 'size-2' },
      sm: { root: 'size-8 text-xs', status: 'size-2' },
      md: { root: 'size-10 text-sm', status: 'size-2.5' },
      lg: { root: 'size-12 text-sm', status: 'size-3' },
      xl: { root: 'size-16 text-base', status: 'size-3' },
    },
    rounded: {
      full: { root: 'rounded-full', status: 'bottom-0 right-0' },
      lg: { root: 'rounded-lg', status: '-bottom-0.5 -right-0.5' },
      none: { root: 'rounded-none', status: '-bottom-0.5 -right-0.5' },
    },
    color: {
      primary: { root: 'bg-primary-100 text-primary-700' },
      secondary: { root: 'bg-secondary-100 text-secondary-700' },
      accent: { root: 'bg-accent-100 text-accent-700' },
      neutral: { root: 'bg-surface-muted text-fg-muted' },
      info: { root: 'bg-info-100 text-info-700' },
      success: { root: 'bg-success-100 text-success-700' },
      warning: { root: 'bg-warning-100 text-warning-700' },
      error: { root: 'bg-error-100 text-error-700' },
    },
  },
  defaultVariants: {
    size: 'md',
    rounded: 'full',
    color: 'neutral',
  },
}, {
  twMerge: true,
});

const statusColorMap: Record<AvatarStatus, string> = {
  online: 'bg-success-500',
  busy: 'bg-error-500',
  away: 'bg-warning-500',
  offline: 'bg-fg-subtle',
};

@Component({
  selector: 'tw-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
    '[attr.role]': 'displayMode() !== "image" ? "img" : null',
    '[attr.aria-label]': 'displayMode() !== "image" && alt() ? alt() : null',
    '[attr.aria-hidden]': '!alt() ? "true" : null',
  },
  template: `
    @switch (displayMode()) {
      @case ('image') {
        <img
          [src]="src()"
          [alt]="alt()"
          [class]="imgClasses()"
          (load)="imageLoaded.set(true)"
          (error)="imageLoaded.set(false)"
        />
      }
      @case ('initials') {
        <span [class]="initialsClasses()">{{ initials() }}</span>
      }
      @case ('fallback') {
        <ng-content>
          <svg [class]="fallbackClasses()" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path fill-rule="evenodd" d="M7.5 6a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM3.751 20.105a8.25 8.25 0 0 1 16.498 0 .75.75 0 0 1-.437.695A18.683 18.683 0 0 1 12 22.5c-2.786 0-5.433-.608-7.812-1.7a.75.75 0 0 1-.437-.695Z" clip-rule="evenodd" />
          </svg>
        </ng-content>
      }
    }
    @if (status()) {
      <span [class]="statusClasses()" aria-hidden="true"></span>
    }
  `,
})
export class AvatarComponent {
  /** URL of the avatar image. When set, renders an `<img>`. Falls back to initials or projected content on load error. Defaults to `null`. */
  readonly src = input<string | null>(null);

  /** Alt text for the avatar image. Also used as `aria-label` for non-image avatars. Defaults to `''`. */
  readonly alt = input('');

  /** Text initials displayed when no image is available (1-2 characters). Defaults to `null`. */
  readonly initials = input<string | null>(null);

  /** Semantic color for the initials/icon background. Only applies when no image is shown. Defaults to `'neutral'`. */
  readonly color = input<TwColor>('neutral');

  /** Controls the avatar dimensions. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Border radius shape. `'full'` for circle, `'lg'` for rounded square, `'none'` for sharp square. Defaults to `'full'`. */
  readonly rounded = input<AvatarRounded>('full');

  /** Shows a status indicator dot. Position adapts to the rounded shape. Defaults to `null` (no indicator). */
  readonly status = input<AvatarStatus | null>(null);

  /** @internal */
  readonly elementRef = inject(ElementRef<HTMLElement>);

  private readonly groupSize = inject(AVATAR_GROUP_SIZE, { optional: true });

  readonly resolvedSize = computed(() => this.groupSize ? this.groupSize() : this.size());

  readonly imageLoaded = linkedSignal<string | null, boolean | null>({
    source: this.src,
    computation: () => null,
  });

  readonly displayMode = computed<'image' | 'initials' | 'fallback'>(() => {
    if (this.src() && this.imageLoaded() !== false) return 'image';
    if (this.initials()) return 'initials';
    return 'fallback';
  });

  private readonly variantResult = computed(() =>
    avatarVariants({
      size: this.resolvedSize(),
      rounded: this.rounded(),
      color: this.color(),
    }),
  );

  readonly rootClasses = computed(() => this.variantResult().root());
  readonly imgClasses = computed(() => this.variantResult().img());
  readonly initialsClasses = computed(() => this.variantResult().initials());
  readonly fallbackClasses = computed(() => this.variantResult().fallback());

  readonly statusClasses = computed(() => {
    const base = this.variantResult().status();
    const statusValue = this.status();
    if (!statusValue) return base;
    return `${base} ${statusColorMap[statusValue]}`;
  });
}

const groupOverlapMap: Record<TwSize, string> = {
  xs: '[&>tw-avatar+tw-avatar]:-ml-1.5 [&>tw-avatar+span]:-ml-1.5',
  sm: '[&>tw-avatar+tw-avatar]:-ml-1.5 [&>tw-avatar+span]:-ml-1.5',
  md: '[&>tw-avatar+tw-avatar]:-ml-2 [&>tw-avatar+span]:-ml-2',
  lg: '[&>tw-avatar+tw-avatar]:-ml-3 [&>tw-avatar+span]:-ml-3',
  xl: '[&>tw-avatar+tw-avatar]:-ml-3 [&>tw-avatar+span]:-ml-3',
};

@Component({
  selector: 'tw-avatar-group',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: AVATAR_GROUP_SIZE,
      useFactory: () => {
        const group = inject(AvatarGroupComponent);
        return () => group.size();
      },
    },
  ],
  host: {
    role: 'group',
    '[class]': 'hostClasses()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    <ng-content />
    @if (overflowCount() > 0) {
      <span [class]="overflowClasses()">+{{ overflowCount() }}</span>
    }
  `,
})
export class AvatarGroupComponent {
  /** Sets the size for all child avatars. Individual avatar size inputs are ignored when inside a group. Defaults to `'md'`. */
  readonly size = input<TwSize>('md');

  /** Maximum number of avatars to display. Remaining count is shown as a "+N" overflow indicator. Defaults to `null` (show all). */
  readonly max = input<number | null>(null);

  /** Accessible label for the avatar group. Defaults to `'Avatar group'`. */
  readonly ariaLabel = input('Avatar group');

  private readonly avatars = contentChildren(AvatarComponent);

  readonly overflowCount = computed(() => {
    const all = this.avatars();
    const maxVal = this.max();
    if (maxVal === null || maxVal >= all.length) return 0;
    return all.length - maxVal;
  });

  readonly hostClasses = computed(() => {
    const s = this.size();
    return `inline-flex items-center [&>tw-avatar]:ring-2 [&>tw-avatar]:ring-surface ${groupOverlapMap[s]}`;
  });

  readonly overflowClasses = computed(() => {
    const s = this.size();
    const sizeClasses = avatarVariants({ size: s, rounded: 'full', color: 'neutral' });
    return `${sizeClasses.root()} bg-surface-muted text-fg-muted font-medium ring-2 ring-surface`;
  });

  private readonly visibilityEffect = effect(() => {
    const all = this.avatars();
    const maxVal = this.max();
    all.forEach((avatar, index) => {
      const el = avatar.elementRef.nativeElement;
      el.style.display = maxVal !== null && index >= maxVal ? 'none' : '';
    });
  });
}
