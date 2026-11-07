# Agent instructions

This repository publishes the shared configs, rules and gates of the
open-tomato projects. Each package under `packages/` publishes on its own
to the public npm registry, so everything tracked here is public.

## Privacy

Nothing tracked may name a private machine, host, domain or repository, a
home directory path, a private or LAN address, a credential, or a personal
email. Examples use the reserved names: `example.com`, `.test`,
`192.0.2.x`, and phone numbers in the 555-01xx range.

The privacy gate enforces this: `bun run gate:privacy` before a commit, and
the pre-commit hook on the staged content. Its banned terms are hashes in
`.privacy-gate.json`; never write a banned term in plain text, in a file, a
commit message or a label. To ban a new term, add its hash with a label
that does not spell it.

## Security

- No secret, token or registry credential is ever written to a file. The
  release workflow publishes through npm trusted publishing.
- A new GitHub Action is pinned to a full commit, with its version in a
  comment.
- A character that is invisible or a control byte is written as its
  escape, never literally. `ot-control-byte-gate` and
  `@open-tomato/no-unsafe-unicode` both refuse the literal.

## Gates

`bun run gates` runs lint, types, tests, the pack check, the control-byte
gate and the privacy gate. All of them pass before a change is done.

## Changes

A change that should release a package adds a fragment to `.changes/`, one
per package, as the README's "Releasing" section shows. Versions and
changelogs are never edited by hand.

## Scope

- A rule or option that every project holds to goes in a base.
- One that a kind of project shares goes in a flavor or mixin.
- One that names a single project's folders or packages stays in that
  project.
