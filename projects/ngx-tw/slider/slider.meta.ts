import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Draggable track for choosing a numeric value, or a contiguous range of two values, from a continuous or stepped scale.',
  whenToUse: [
    'Picking an approximate value where the relative position matters more than the exact number — volume, brightness, opacity, zoom',
    'A two-thumb range filter such as a price or date span, via [range]',
    'A scale that needs tick marks, either derived from step or supplied as custom SliderMark[] entries with labels',
    'A value that reads better with a formatted bubble and min/max end labels, driven by one valueFormatter that also feeds aria-valuetext',
    'A continuous scale with no snapping, by setting step to null',
    'Vertical orientation or RTL layouts, where arrow keys follow the ambient CDK Directionality',
  ],
  whenNotToUse: [
    {
      instead: 'number-input',
      because: 'the user needs to type an exact value, or the scale is too wide to target by dragging',
    },
    {
      instead: 'progress-bar',
      because: 'the bar reports progress rather than accepting a value from the user',
    },
    {
      instead: 'select',
      because: 'the choices are a short enumerated list rather than points on a numeric scale',
    },
  ],
  related: ['number-input', 'progress-bar', 'form-field', 'core'],
  aliases: [
    'range',
    'range slider',
    'range input',
    'track',
    'thumb',
    'volume control',
    'dual slider',
    'price range',
    'scrubber',
  ],
} satisfies ComponentMeta;
