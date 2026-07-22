import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Attribute directive for multi-line free text, adding autosize, a resize axis, row bounds, and a character-count signal on top of the shared text-field surface.',
  whenToUse: [
    'Free-form prose fields — a bio, a comment, a description, a support message',
    'A field that should grow with its content, using CDK autosize capped by minRows / maxRows',
    'Letting the user drag the field taller, or locking the resize handle off entirely',
    'A live character counter, wiring the valueLength() signal into a projected hint next to maxLength',
    'Multi-line entry where Enter must insert a newline instead of submitting the surrounding form',
  ],
  whenNotToUse: [
    {
      instead: 'input',
      because: 'the value is a single line and none of the autosize, resize, or counter surface is needed',
    },
    {
      instead: 'code-block',
      because: 'the multi-line text is read-only content to display rather than a value to edit',
    },
  ],
  related: ['input', 'form-field', 'core'],
  aliases: [
    'multiline',
    'multi-line input',
    'text area',
    'comment box',
    'message box',
    'notes field',
    'autosize',
    'autogrow',
    'long text',
  ],
} satisfies ComponentMeta;
