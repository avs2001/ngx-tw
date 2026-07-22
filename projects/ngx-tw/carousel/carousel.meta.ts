import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Slide and swipe gallery built on native CSS scroll-snap, with looping, autoplay, drag, keyboard paging, indicators, and an APG-compliant pause control.',
  whenToUse: [
    'A hero banner rotating through promotional images or announcements',
    'A product image gallery the user swipes through on touch and drags with the mouse',
    'A row of cards or testimonials showing several per view and paging sideways',
    'Content that advances on its own but must satisfy WCAG 2.2.2 — the pause button renders automatically when autoplay is on',
    'A vertical slide track, or a horizontal one that must flip direction under dir="rtl"',
    'Prev/next controls styled entirely by the consumer, applied as attribute directives to their own button primitive',
  ],
  whenNotToUse: [
    {
      instead: 'tabs',
      because: 'the user picks one panel out of many explicitly rather than paging through them in order',
    },
    {
      instead: 'paginator',
      because: 'the user is navigating discrete pages of data rather than a visual slide track',
    },
    {
      instead: 'stepper',
      because: 'the sequence is a wizard with completion state and form validation between steps',
    },
    {
      instead: 'slider',
      because: 'the control is a numeric range input rather than a gallery of slides',
    },
  ],
  related: ['tabs', 'stepper', 'paginator', 'dialog', 'aspect-ratio'],
  aliases: [
    'slider',
    'image slider',
    'gallery',
    'slideshow',
    'swiper',
    'slides',
    'lightbox',
    'banner rotator',
    'scroll snap',
    'filmstrip',
  ],
} satisfies ComponentMeta;
