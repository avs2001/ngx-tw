/**
 * Shape of the hand-authored guidance layer consumed by the MCP index.
 *
 * This file is **build-time only**. It lives at the library root rather than
 * inside an entry-point directory so ng-packagr never treats it as public
 * surface, and no `*.meta.ts` is re-exported from its entry point's
 * `index.ts` — the guidance ships in `index.json`, not in the npm tarball.
 *
 * Guidance is the one layer that cannot be derived from source or from the
 * demo. It is what lets a model disambiguate menu vs select vs combobox vs
 * command-palette, or dialog vs sheet vs popover — the decision the API tables
 * and usage snippets can never answer on their own.
 */

/** A component that fits a case better than this one, and the reason why. */
export interface MetaAlternative {
  /** Entry-point name to reach for instead — must resolve to a real entry point. */
  instead: string;
  /** The condition that makes the alternative the better fit. */
  because: string;
}

export interface ComponentMeta {
  /**
   * One sentence naming what the component *is* and what it is for. Written
   * to be read in a search-result list, so it must stand alone without the
   * component's name for context.
   */
  summary: string;

  /** Concrete situations this component is the right answer for. */
  whenToUse: string[];

  /**
   * Cases that look like this component but are served better elsewhere.
   * Every `instead` is link-checked against the entry-point list at build
   * time, so a renamed component fails the build instead of misleading.
   */
  whenNotToUse?: MetaAlternative[];

  /** Entry points commonly used alongside this one. Link-checked. */
  related?: string[];

  /**
   * Alternative vocabulary a consumer might search for. This is what makes
   * lexical search work — "dropdown" has to reach menu, select, and combobox,
   * none of which contain the word.
   */
  aliases?: string[];
}
