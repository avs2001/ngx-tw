// Spec-only ambient declarations for the three Node built-ins the theme
// token-parity guard needs.
//
// They are hand-written rather than pulled from `@types/node` because
// `@types/node` is not a devDependency of this repo, and adding one purely so a
// single spec can call `readFileSync` is not worth the install. The demo
// project solved the identical problem the identical way — see
// `projects/demo/src/types/raw-import.d.ts`, which backs the load-bearing route
// drift guard in `projects/demo/src/app/app.routes.spec.ts`.
//
// Why a triple-slash reference and not an `include` entry:
// `projects/ngx-tw/tsconfig.spec.json` picks up only spec files from this
// directory, so a `.d.ts` sitting here reaches the program only if something in
// the program points at it. The reference at the top of
// `theme-token-parity.spec.ts` is that pointer. Keeping the declarations here
// rather than under `projects/ngx-tw/src/` keeps the whole guard inside the
// `theme` entry point.
//
// Line comments, not a block comment, on purpose: the paragraph above wants to
// name glob patterns, and a glob containing a star-slash closes a block comment
// mid-sentence with an error that points at the following line.
//
// Nothing under `projects/ngx-tw` imports these modules outside that spec; the
// declarations are ambient only so it type-checks.

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
