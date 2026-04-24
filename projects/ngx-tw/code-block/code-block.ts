import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  input,
  output,
  signal,
} from '@angular/core';
import { Clipboard } from '@angular/cdk/clipboard';
import { LiveAnnouncer } from '@angular/cdk/a11y';
import { tv } from 'tailwind-variants';

/** Visual style of the code block container. */
export type CodeBlockVariant = 'filled' | 'outlined';

const codeBlockVariants = tv({
  slots: {
    root: 'flex flex-col rounded-lg overflow-hidden font-mono text-sm',
    header: 'flex items-center justify-between px-4 py-2 border-b border-border text-xs text-fg-muted',
    pre: 'p-4 text-fg overflow-x-auto focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
    copyButton:
      'inline-flex items-center justify-center size-8 rounded-md cursor-pointer text-fg-muted hover:text-fg hover:bg-surface-muted transition-colors duration-200 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-500',
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

@Component({
  selector: 'tw-code-block',
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    pre {
      scrollbar-width: none;
      &::-webkit-scrollbar { display: none; }
    }
  `,
  host: {
    '[class]': 'rootClasses()',
  },
  template: `
    <div [class]="headerClasses()">
      @if (language()) {
        <span class="font-sans font-medium select-none">{{ language() }}</span>
      } @else {
        <span></span>
      }
      <button
        type="button"
        [attr.aria-label]="isCopied() ? 'Copied' : 'Copy code'"
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

  /** Optional language label displayed in the header (e.g. 'TypeScript', 'HTML'). */
  readonly language = input<string>();

  /** Visual style of the container. Defaults to `'filled'`. */
  readonly variant = input<CodeBlockVariant>('filled');

  /** When true, wraps long lines instead of horizontal scrolling. Defaults to `false`. */
  readonly wrap = input(false);

  /** Fires when code is successfully copied to clipboard. */
  readonly copied = output<void>();

  private readonly clipboard = inject(Clipboard);
  private readonly liveAnnouncer = inject(LiveAnnouncer);
  private readonly destroyRef = inject(DestroyRef);

  protected readonly isCopied = signal(false);
  private timeoutId: ReturnType<typeof setTimeout> | undefined;

  private readonly variantResult = computed(() =>
    codeBlockVariants({ variant: this.variant(), copied: this.isCopied() }),
  );

  protected readonly rootClasses = computed(() => this.variantResult().root());
  protected readonly headerClasses = computed(() => this.variantResult().header());

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
    const success = this.clipboard.copy(this.code());
    if (success) {
      this.isCopied.set(true);
      this.copied.emit();
      this.liveAnnouncer.announce('Copied to clipboard');

      if (this.timeoutId) {
        clearTimeout(this.timeoutId);
      }
      this.timeoutId = setTimeout(() => this.isCopied.set(false), 2000);
    }
  }
}
