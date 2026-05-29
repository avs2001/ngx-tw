/**
 * Maps the committed input text to a tag value. The default returns the trimmed
 * string, so the value type defaults to `string`. Override to build object tags
 * (e.g. `(text) => ({ id: crypto.randomUUID(), name: text })`).
 */
export type TwTagFactory<T> = (text: string) => T;

/**
 * Maps a tag value to its visible chip label and the remove-button accessible
 * name. Defaults to `String(tag)`.
 */
export type TwTagLabelFn<T> = (tag: T) => string;

/**
 * Equality comparator used to dedupe tags when `allowDuplicates` is `false` and
 * to resolve a tag passed to `removeTag`. Defaults to `Object.is`.
 */
export type TwTagCompareFn<T> = (a: T, b: T) => boolean;

/** Payload of the `tagAdded` output. */
export interface TwTagAddedEvent<T> {
  /** The tag that was committed. */
  tag: T;
  /** The full tag array after the addition. A fresh array reference. */
  value: T[];
}

/** Payload of the `tagRemoved` output. */
export interface TwTagRemovedEvent<T> {
  /** The tag that was removed. */
  tag: T;
  /** The full tag array after the removal. A fresh array reference. */
  value: T[];
  /** The index the removed tag occupied before removal. */
  index: number;
}
