/** Canonical option shape for `tw-combobox`. Consumers using arbitrary records override the accessor inputs instead. */
export interface TwComboboxOption<T> {
  /** Visible label. Used by the default filter and trigger render. */
  label: string;
  /** Value emitted via `valueCommit` / `optionSelected` when this option is picked. */
  value: T;
  /** When true, the option cannot be highlighted, selected, or matched by the resolver. */
  disabled?: boolean;
  /** Optional group label. Options sharing a group render under a labelled `role="group"` region. */
  group?: string;
  /** Optional secondary description rendered under the label in the default option row. */
  description?: string;
}

/** Discriminator for the origin of a `valueCommit` emission. */
export type TwComboboxValueSource = 'option' | 'free-text' | 'reset' | 'programmatic';

/** Filter callback applied to `options` whenever `inputValue` changes. Return `true` to keep the option visible. */
export type TwComboboxFilterFn = (option: unknown, query: string) => boolean;

/** Payload of the `optionSelected` output. */
export interface TwComboboxOptionSelectedEvent<T> {
  /** The raw option object (or arbitrary record when accessors are overridden). */
  option: unknown;
  /** Resolved value from `optionValue`. */
  value: T;
  /** Resolved label from `optionLabel`. */
  label: string;
}

/** Payload of the `valueCommit` output. Distinguishes selection / free-text / reset / programmatic. */
export interface TwComboboxValueCommitEvent<T> {
  /** The committed value. */
  value: T | string | null;
  /** What triggered the commit. */
  source: TwComboboxValueSource;
}

/** Payload of the `openedChange` output. */
export interface TwComboboxOpenedEvent {
  /** Whether the popover is now open. */
  open: boolean;
  /** The combobox input element. */
  trigger: HTMLElement;
}

/** Template context passed to `*twComboboxOption` consumer templates. */
export interface TwComboboxOptionContext<T, O = TwComboboxOption<T>> {
  /** Raw option object (or arbitrary record). */
  $implicit: O;
  /** Same as `$implicit`, named for clarity. */
  option: O;
  /** Resolved label. */
  label: string;
  /** Resolved value. */
  value: T;
  /** Whether this option is the currently committed selection. */
  selected: boolean;
  /** Whether this option is the active descendant (keyboard highlight). */
  active: boolean;
  /** Whether this option is disabled. */
  disabled: boolean;
  /** Index within the visible (filtered) options. */
  index: number;
}

/** Internal: resolved option view pairing the raw option with its derived fields. */
export interface ComboboxVisibleOption<T> {
  readonly option: unknown;
  readonly label: string;
  readonly value: T;
  readonly disabled: boolean;
  readonly group?: string;
  readonly description?: string;
}

/** Internal rendered-row discriminated union — either a group header or an option row. */
export type ComboboxRenderedRow<T> =
  | { readonly kind: 'group'; readonly group: string }
  | { readonly kind: 'option'; readonly option: ComboboxVisibleOption<T>; readonly index: number };
