export {
  CommandPaletteComponent,
  CommandPaletteItemDirective,
  CommandPaletteGroupDirective,
  CommandPaletteItemIconDirective,
  CommandPaletteItemDescriptionDirective,
  CommandPaletteEmptyDirective,
  CommandPaletteFooterDirective,
} from './command-palette';
// Handed out by `filteredItems()` / `grouped()` and taken by `selectItem()` /
// `setActiveItem()`, so a consumer holding a `viewChild(CommandPaletteComponent)`
// needs to be able to name them. Renamed on export because the bare
// `ResolvedItem` / `ResolvedGroup` are far too generic for a root-barrel symbol.
export type {
  ResolvedItem as CommandPaletteResolvedItem,
  ResolvedGroup as CommandPaletteResolvedGroup,
} from './command-palette';
export {
  TW_COMMAND_PALETTE_REF,
  /** @deprecated Use `TW_COMMAND_PALETTE_REF` — same token instance. */
  COMMAND_PALETTE_REF,
  type CommandPaletteItem,
  type CommandPaletteFilterFn,
  type CommandPaletteRef,
} from './command-palette-tokens';
