import type { ComponentMeta } from '../meta.types';

export const meta = {
  summary:
    'Drop zone and file picker that owns selection, validation, and per-file progress while leaving the actual HTTP transfer to the consumer.',
  whenToUse: [
    'Attaching one or more documents or images to a form, by browsing or by dragging from the desktop',
    'Enforcing accepted MIME types, a maximum file size, or a maximum file count before anything is sent',
    'Showing per-file progress and success or error status while a custom upload pipeline runs',
    'A file field that must participate in reactive, template-driven, or signal forms as a File array',
  ],
  related: ['form-field', 'progress-bar', 'button'],
  aliases: [
    'dropzone',
    'drag and drop',
    'file picker',
    'attachment',
    'uploader',
    'file input',
    'browse files',
    'image upload',
  ],
} satisfies ComponentMeta;
