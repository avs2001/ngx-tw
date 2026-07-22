import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Attribute directive that pins any element to a fixed width-to-height ratio using the native CSS aspect-ratio property, accepting a number or a "16/9"-style string.',
  whenToUse: [
    'Card cover images that must all render at the same shape regardless of the source file',
    'A responsive video or iframe embed that has to hold 16/9 as the column width changes',
    'Thumbnail and image grids where mismatched intrinsic sizes would make rows ragged',
    'Every slide in a gallery needs a uniform footprint so paging does not jump the layout',
    'A placeholder that must reserve the media box before the asset loads',
    'Replacing hand-rolled aspect-[16/9] utility classes with one bindable input',
  ],
  related: ['card', 'avatar', 'skeleton', 'carousel', 'icon'],
  aliases: [
    'ratio',
    'aspect',
    'aspect ratio box',
    '16:9',
    '4:3',
    'square',
    'intrinsic ratio',
    'responsive embed',
    'video wrapper',
    'image ratio',
  ],
} satisfies ComponentMeta;
