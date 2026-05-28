import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  Directive,
  inject,
  input,
  model,
  output,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';

/** Visual style of the code block container. */
export type CodeBlockVariant = 'filled' | 'outlined';

/**
 * Localizable strings used by the code block. Provide a partial override —
 * any missing fields fall back to English defaults.
 */
export interface CodeBlockLabels {
  /** aria-label for the copy button in its resting state. Defaults to `'Copy code'`. */
  copy?: string;
  /** aria-label for the copy button after a successful copy. Defaults to `'Copied'`. */
  copied?: string;
  /** Text passed to LiveAnnouncer after a successful copy. Defaults to `'Copied to clipboard'`. */
  announcement?: string;
}

/**
 * Marker directive for projected header content (e.g. filename, secondary
 * actions). Sits alongside the language label inside the code block's
 * header row.
 *
 * @remarks
 * The host class (`inline-flex items-center gap-2 min-w-0`) styles the
 * projected element's *own* children — e.g. a filename `<span>` next to a
 * "modified" badge — and is distinct from the library's `headerStart` slot
 * wrapper that contains this element. The two carry overlapping utility names
 * (`items-center gap-2 min-w-0`) because both lay out flex children, but they
 * apply to different DOM nodes (parent slot vs the projected element itself)
 * and serve different jobs (slot row geometry vs the consumer's badge group).
 */
@Directive({
  selector: '[twCodeBlockHeader]',
  host: {
    class: 'inline-flex items-center gap-2 min-w-0',
  },
})
export class CodeBlockHeaderDirective {}

const codeBlockVariants = tv({
  slots: {
    root: 'flex flex-col rounded-lg overflow-hidden font-mono text-sm',
    header:
      'flex items-center justify-between gap-2 px-4 py-2 border-b border-border text-xs text-fg-muted',
    headerStart: 'flex items-center gap-2 min-w-0 flex-1',
    pre: 'p-4 text-fg overflow-x-auto tw-scrollbar-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    copyButton:
      'inline-flex items-center justify-center size-8 rounded-md cursor-pointer text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-normal motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    copyIcon: 'size-4 shrink-0',
  },
  variants: {
    variant: {
      filled: { root: 'bg-surface-sunken border border-border-strong' },
      outlined: { root: 'bg-transparent border border-border' },
    },
    copied: {
      true: { copyButton: 'text-success-500 hover:text-success-500' },
      false: {},
    },
  },
  defaultVariants: {
    variant: 'filled',
    copied: false,
  },
}, {
  twMerge: true,
});

/**
 * Code-display surface with copy-to-clipboard, optional language label, and a
 * projection slot for filename / extra actions.
 *
 * @remarks
 * **`role="region"` ownership.** The outer host is a presentational container —
 * the inner `<pre tabindex="0" role="region" aria-label="...">` owns the
 * scrollable-content region semantics that screen readers and AXE care about.
 * Promoting the host to `role="region"` as well would double-announce the
 * landmark; the `<pre>` is the focusable, keyboard-reachable target, so the
 * region role belongs there. This matches APG guidance for scroll-region
 * widgets and Material's `pre`-as-region pattern.
 */
@Component({
  selector: 'tw-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    <div [class]="headerClasses()">
      <div [class]="headerStartClasses()">
        @if (language()) {
          <span class="font-sans font-medium select-none">{{ language() }}</span>
        }
        <ng-content select="[twCodeBlockHeader]" />
      </div>
      <button
        type="button"
        [attr.aria-label]="isCopied() ? resolvedLabels().copied : resolvedLabels().copy"
        [class]="copyButtonClasses()"
        (click)="copyToClipboard()"
      >
        @if (isCopied()) {
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" [class]="copyIconClasses()" aria-hidden="true">
            <path fill-rule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clip-rule="evenodd"/>
          </svg>
        } @else {
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" [class]="copyIconClasses()" aria-hidden="true">
            <path fill-rule="evenodd" d="M10.986 3H12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h1.014A2.25 2.25 0 0 1 7.25 1h1.5a2.25 2.25 0 0 1 2.236 2ZM9.5 4v-.75a.75.75 0 0 0-.75-.75h-1.5a.75.75 0 0 0-.75.75V4h3Z" clip-rule="evenodd"/>
          </svg>
        }
      </button>
    </div>
    <pre
      role="region"
      tabindex="0"
      [attr.aria-label]="preAriaLabel()"
      [class]="preClasses()"
    ><code>{{ code() }}</code></pre>
  `,
})
export class CodeBlockComponent {
  /** The code string to display and copy to clipboard. */
  readonly code = input.required<string>();

  /** Optional language label displayed in the header (e.g. `'TypeScript'`, `'HTML'`). */
  readonly language = input<string>();

  /** Visual style of the container. Defaults to `'filled'`. */
  readonly variant = input<CodeBlockVariant>('filled');

  /** When true, wraps long lines instead of horizontal scrolling. Defaults to `false`. */
  readonly wrap = input(false, { transform: booleanAttribute });

  /**
   * Localizable strings for the copy button's aria-labels and the
   * screen-reader announcement. Provide a partial override; missing fields
   * fall back to English defaults.
   */
  readonly labels = input<CodeBlockLabels>({});

  /** Fires when code is successfully copied to clipboard. */
  readonly copied = output<void>();

  /** Fires when the clipboard copy fails (e.g. user denied permission, no clipboard API available). Payload is an `Error` describing the failure. */
  readonly copyFailed = output<Error>();

  /** Whether the copy-to-clipboard button is currently in its "copied" confirmation state. Two-way bindable via `[(isCopied)]`. Set to `true` for ~2s after a successful copy, then auto-resets to `false`. Defaults to `false`. */
  readonly isCopied = model(false);

  private readonly clipboard = inject(Clipboard);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);

  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  protected readonly resolvedLabels = computed(() => {
    const l = this.labels();
    return {
      copy: l.copy ?? 'Copy code',
      copied: l.copied ?? 'Copied',
      announcement: l.announcement ?? 'Copied to clipboard',
    };
  });

  private readonly variantResult = computed(() =>
    codeBlockVariants({ variant: this.variant(), copied: this.isCopied() }),
  );

  protected readonly rootClasses = computed(() => this.variantResult().root());
  protected readonly headerClasses = computed(() => this.variantResult().header());
  protected readonly headerStartClasses = computed(() => this.variantResult().headerStart());

  protected readonly preClasses = computed(() => {
    const base = this.variantResult().pre();
    return this.wrap() ? `${base} whitespace-pre-wrap` : `${base} whitespace-pre`;
  });

  protected readonly copyButtonClasses = computed(() => this.variantResult().copyButton());
  protected readonly copyIconClasses = computed(() => this.variantResult().copyIcon());

  protected readonly preAriaLabel = computed(() => {
    const lang = this.language();
    return lang ? `${lang} code` : 'Code';
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
    });
  }

  protected copyToClipboard(): void {
    // `Clipboard.copy()` (CDK) is synchronous and returns `false` when the
    // underlying clipboard write was blocked (permissions, insecure context,
    // jsdom). Surface that as `copyFailed` so consumers can show their own
    // fallback UI instead of silently dropping the action.
    const success = this.clipboard.copy(this.code());
    if (success) {
      this.isCopied.set(true);
      this.copied.emit();
      this.liveAnnouncer.announce(this.resolvedLabels().announcement);

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => this.isCopied.set(false), 2000);
    } else {
      this.copyFailed.emit(new Error('Clipboard copy failed'));
    }
  }
}
