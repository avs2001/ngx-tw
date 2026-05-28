---
"ngx-tw": patch
---

Documentation parity sweep. Closes the audit's "JSDoc → demo API description drift" theme.

**Library JSDoc completeness:** every public `input()` that lacked a `Defaults to …` suffix now has one — covered `skeleton.announce` and three `icon` inputs (`name`, `img`, `ariaLabel`).

**Demo API description mirror:** seven components' API tables (`button`, `progress-bar`, `stat`, `popover`, `toast`, `tooltip`, `select`) now match library JSDoc one-liners. Consumers reading Compodoc and the demo see the same wording for each input/output/model row.

No behavior or selector changes. No public-API surface changes.
