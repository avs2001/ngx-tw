// Spec-only globals/modules. These declarations live with the demo project so
// they're picked up by `projects/demo/tsconfig.spec.json` without needing
// `@types/node` as a top-level devDependency.

declare module 'node:fs' {
  export function readFileSync(path: string, encoding: 'utf-8' | 'utf8'): string;
}

declare module 'node:path' {
  export function join(...segments: string[]): string;
  export function dirname(p: string): string;
}

declare module 'node:url' {
  export function fileURLToPath(url: string | URL): string;
}

declare const __dirname: string;
