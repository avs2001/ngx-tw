import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Preformatted code display with a header bar carrying a language label and a copy-to-clipboard button that gives both visual and screen-reader feedback.',
  whenToUse: [
    'Showing a usage snippet or install command in documentation, with one-click copy',
    'Rendering an API key, a webhook URL, or a config block the user is meant to copy verbatim',
    'A log or stack trace that should scroll horizontally, or wrap, inside a keyboard-reachable region',
    'A filename or extra actions belong in the header bar, projected via [twCodeBlockHeader]',
    'The copy button label and copied announcement must be localized, via the labels input',
  ],
  related: ['card', 'button', 'tooltip', 'alert'],
  aliases: [
    'code',
    'snippet',
    'pre',
    'preformatted',
    'syntax',
    'copy to clipboard',
    'terminal',
    'command',
    'source code',
  ],
} satisfies ComponentMeta;
