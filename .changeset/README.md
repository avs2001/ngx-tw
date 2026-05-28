# Changesets

This directory tracks **changesets** — small markdown files that describe what
should be released, at what bump level (`patch` / `minor` / `major`), and the
human-readable note that will end up in the `CHANGELOG.md`.

## Workflow

1. **You make a code change** on a feature branch.
2. **Add a changeset** before opening (or while iterating on) the PR:

   ```bash
   npm run changeset
   ```

   The CLI asks which package(s) changed, which bump type each gets, and a
   short summary. It writes a file like `.changeset/funny-name.md`.

3. **Commit the changeset file** along with your code change. Open the PR.
4. **Merging the PR to `develop`** triggers the release workflow:
   - If un-released changesets exist, the workflow opens (or updates) a
     **"Version Packages"** PR that consumes the `.changeset/*.md` files,
     bumps `projects/ngx-tw/package.json`, and updates `CHANGELOG.md`.
   - **Merging the Version Packages PR** publishes the new version to npm
     (with provenance attestation) and creates a matching GitHub release + tag.

## Adding a changeset manually

If the interactive CLI is awkward, you can drop a file directly:

```markdown
---
'ngx-tw': minor
---

Add `tw-stat` component for compact metric displays.
```

The frontmatter lists the package and the bump level; the body becomes the
changelog entry.

## Skipping a release

Changes that should not produce a published version (docs, CI, internal
refactors, demo-only edits) need **no** changeset. The Version Packages PR
only opens when at least one changeset exists.

See [changesets docs](https://github.com/changesets/changesets) for full details.
