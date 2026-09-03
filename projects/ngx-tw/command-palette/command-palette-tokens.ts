import { InjectionToken } from '@angular/core';

/** A single command palette entry. */
export interface CommandPaletteItem {
  /** Stable identifier used as the DOM id and for selection payloads. */
  id: string;
  /** Visible label used for rendering and default filtering. */
  label: string;
  /** Additional search keywords that match the query but are not rendered. */
  keywords?: readonly string[];
  /** Group header name. Items sharing a group render under one section. */
  group?: string;
  /** Disabled items render but cannot be activated. */
  disabled?: boolean;
  /** Shortcut hint to render on the right edge. */
  shortcut?: string | readonly string[];
  /** Secondary description text rendered under the label. */
  description?: string;
  /** Optional icon name (consumers decide how to render). */
  icon?: string;
  /** Activation callback invoked before `itemSelected` is emitted. */
  run?: () => void;
}

/** Filter signature. Receives the merged item list plus the current query; returns the filtered/reordered list. */
export type CommandPaletteFilterFn = (
  items: readonly CommandPaletteItem[],
  query: string,
) => readonly CommandPaletteItem[];

/** Control handle exposed inside the palette overlay (for future component-based content). */
export interface CommandPaletteRef {
  /** Closes the palette. */
  close(): void;
  /** Updates the search query programmatically. */
  setQuery(query: string): void;
}

/** Injection token providing a `CommandPaletteRef` to palette overlay content. */
export const TW_COMMAND_PALETTE_REF = new InjectionToken<CommandPaletteRef>(
  'TW_COMMAND_PALETTE_REF',
);

/**
 * @deprecated Renamed to {@link TW_COMMAND_PALETTE_REF} for consistency with
 * every other ngx-tw injection token. This is the *same token instance*, not a
 * copy — providing under either name and injecting under the other resolves —
 * so the rename is safe to adopt incrementally. Removed in the next major.
 */
export const COMMAND_PALETTE_REF = TW_COMMAND_PALETTE_REF;
