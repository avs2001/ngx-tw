#!/usr/bin/env node
// stdio MCP server for @cdevhub/ngx-tw.
//
// The server is deliberately thin. Everything it serves was baked into
// `index.json` at library build time, inside the monorepo where component
// source and demo app both exist — a consumer's node_modules has neither. So
// there is no parsing here, only reading.
//
// Tool surface is few-but-rich: `get_component` returns everything about one
// entry point in a single response, because the caller pays a round trip per
// call and a component's API, examples, and guidance are almost always wanted
// together.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';

import { searchComponents } from './search.js';

const here = dirname(fileURLToPath(import.meta.url));
const index = JSON.parse(readFileSync(join(here, '..', 'index.json'), 'utf8'));

/**
 * Every response carries the library version it describes. If a consumer's
 * `.mcp.json` pins an old MCP package, the caller can see the mismatch against
 * their installed `@cdevhub/ngx-tw` rather than silently trusting the answer.
 */
function reply(payload) {
  return {
    content: [{
      type: 'text',
      text: JSON.stringify({ libraryVersion: index.libraryVersion, ...payload }, null, 2),
    }],
  };
}

const notFound = (name) => reply({
  error: `No entry point named "${name}".`,
  hint: 'Call list_components for the full list, or search_components to find one by description.',
});

const server = new McpServer(
  { name: 'ngx-tw', version: index.libraryVersion },
  {
    instructions:
      `Authoritative API reference for @cdevhub/ngx-tw ${index.libraryVersion}, an Angular ` +
      `component library for Tailwind CSS v4. Use it instead of guessing selectors, inputs, ` +
      `or import paths — the data is extracted from library source at build time.\n\n` +
      `Typical flow: search_components to find the right component, then get_component for its ` +
      `full API and usage examples. Call get_conventions before writing styling code and ` +
      `get_started when setting a project up for the first time.\n\n` +
      `Note: <tw-icon> has no built-in icon set. Valid icon names are only those the consuming ` +
      `application registered via provideTwIcons() / provideTwLucideIcons() — never assume one exists.`,
  },
);

// ─── search_components ────────────────────────────────────────────────────
server.registerTool('search_components', {
  title: 'Search components',
  description:
    'Find ngx-tw entry points by free-text description of what you are trying to build. ' +
    'Matches names, aliases, summaries, and stated use cases, so vocabulary from other design ' +
    'systems works ("dropdown", "snackbar", "datagrid", "wizard"). Start here when you know the ' +
    'problem but not the component name, then call get_component for the winner.',
  inputSchema: {
    query: z.string().describe('What you are trying to build, e.g. "dropdown of actions" or "date range"'),
    limit: z.number().int().min(1).max(25).optional().describe('Maximum results (default 10)'),
  },
}, async ({ query, limit }) => {
  const results = searchComponents(index, query, limit ?? 10);
  return reply({
    query,
    results,
    ...(results.length ? {} : { hint: 'No match — call list_components to see everything available.' }),
  });
});

// ─── get_component ────────────────────────────────────────────────────────
server.registerTool('get_component', {
  title: 'Get component',
  description:
    'Everything about one entry point in a single response: every exported symbol (components, ' +
    'directives, types) with its selector and usage form, all inputs/outputs/models with types ' +
    'and defaults, content-projection slots, real usage examples from the documentation site, ' +
    'and guidance on when to use it and what to use instead. Call this before writing markup ' +
    'for a component — an entry point often exports several directives that work together.',
  inputSchema: {
    name: z.string().describe('Entry-point name, e.g. "badge", "date-range-picker"'),
  },
}, async ({ name }) => {
  const entry = index.entryPoints.find((e) => e.name === name.trim().toLowerCase());
  if (!entry) return notFound(name);

  return reply({
    name: entry.name,
    importPath: entry.importPath,
    summary: entry.summary ?? null,
    whenToUse: entry.whenToUse ?? [],
    whenNotToUse: entry.whenNotToUse ?? [],
    related: entry.related ?? [],
    symbols: entry.symbols,
    examples: entry.snippets,
  });
});

// ─── list_components ──────────────────────────────────────────────────────
server.registerTool('list_components', {
  title: 'List components',
  description:
    'Every entry point in the library with its import path and one-line summary. Use it to see ' +
    'the whole surface at once when search comes back empty or you are unsure what exists.',
  inputSchema: {},
}, async () => reply({
  count: index.entryPoints.length,
  components: index.entryPoints.map((e) => ({
    name: e.name,
    importPath: e.importPath,
    summary: e.summary ?? null,
  })),
}));

// ─── get_conventions ──────────────────────────────────────────────────────
server.registerTool('get_conventions', {
  title: 'Get conventions',
  description:
    'The library\'s styling and code conventions: semantic color tokens, the size/spacing scale, ' +
    'radius and shadow scales, focus-ring pattern, icon sizing, transition rules, and Angular ' +
    'idioms. Read this before writing styling code — components use semantic tokens ' +
    '(bg-primary-500) and never raw palette colors (bg-blue-500), and a mismatch breaks theming.',
  inputSchema: {
    topic: z.string().optional().describe('Optional filter, e.g. "focus", "spacing", "color", "animation"'),
  },
}, async ({ topic }) => reply({
  topic: topic ?? null,
  conventions: section(index.content.conventions, topic),
}));

// ─── get_started ──────────────────────────────────────────────────────────
server.registerTool('get_started', {
  title: 'Get started',
  description:
    'Installation and project setup: peer dependencies, the Tailwind v4 theme CSS import, the ' +
    'CDK overlay stylesheet, provider registration (theme, date adapter, icons, dialog, sheet, ' +
    'toast), and the icon registration model. Read this when wiring ngx-tw into a project for ' +
    'the first time or when a component renders unstyled.',
  inputSchema: {
    topic: z.string().optional().describe('Optional filter, e.g. "icons", "theming", "install", "forms"'),
  },
}, async ({ topic }) => reply({
  topic: topic ?? null,
  gettingStarted: section(index.content.gettingStarted, topic),
}));

// ─── list_theme_tokens ────────────────────────────────────────────────────
server.registerTool('list_theme_tokens', {
  title: 'List theme tokens',
  description:
    'The design tokens the theme actually defines, with their values and the Tailwind utilities ' +
    'they generate. Use it to confirm a utility class exists before emitting it — the library ' +
    'defines bg-primary-500 and text-2xs but not bg-brand-500, and Tailwind fails silently on a ' +
    'class that resolves to nothing.',
  inputSchema: {
    kind: z.enum(['color', 'typography', 'font', 'duration', 'shadow', 'width'])
      .optional().describe('Filter by token kind'),
    group: z.enum(['surface', 'foreground', 'border', 'semantic-color', 'other'])
      .optional().describe('Filter color tokens by role group'),
  },
}, async ({ kind, group }) => {
  const tokens = index.themeTokens
    .filter((t) => (!kind || t.kind === kind) && (!group || t.group === group));
  return reply({ count: tokens.length, tokens });
});

/**
 * Narrow a markdown document to the `##` sections matching a topic. Returns the
 * whole document when nothing matches, because a silently empty answer is worse
 * than an over-long one.
 */
function section(markdown, topic) {
  if (!topic) return markdown;

  const needle = topic.toLowerCase();
  const parts = markdown.split(/\n(?=## )/);
  const hits = parts.filter((part) => {
    const heading = part.slice(0, part.indexOf('\n')).toLowerCase();
    return heading.includes(needle) || part.toLowerCase().includes(needle);
  });

  return hits.length ? hits.join('\n') : markdown;
}

await server.connect(new StdioServerTransport());
