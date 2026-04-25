/** Payload emitted on resizeStart and resizeEnd. */
export interface SplitResizeEvent {
  /** Ordered array of current pane sizes in the container's declared unit. */
  sizes: number[];
  /** The unit used by the container. */
  unit: 'percent' | 'pixel';
  /** Index of the pane immediately before the gutter being dragged. */
  originPaneIndex: number;
  /** What triggered the resize. */
  cause: 'pointer' | 'touch' | 'keyboard' | 'programmatic';
}

/** Payload emitted on collapseChange. */
export interface SplitCollapseEvent {
  /** Index of the pane whose collapsed state changed. */
  paneIndex: number;
  /** True when the pane just collapsed, false when it just expanded. */
  collapsed: boolean;
  /** What triggered the collapse or expand. */
  cause: 'snap' | 'keyboard' | 'programmatic';
}

/** Axis along which panes are laid out. */
export type SplitDirection = 'horizontal' | 'vertical';

/** Unit in which pane sizes are expressed and reported. */
export type SplitUnit = 'percent' | 'pixel';
