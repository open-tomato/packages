# open-tomato packages

The shared configs, rules and gates every open-tomato project builds on.
Each package publishes on its own, under its own version, to the public npm
registry.

| Package | What it holds |
| --- | --- |
| [`@open-tomato/eslint-config`](packages/eslint-config/README.md) | the flat ESLint base, with react, vite, cva, type-aware and markdown-fences flavors |
| [`@open-tomato/eslint-plugin`](packages/eslint-plugin/README.md) | the custom rules: `no-unsafe-unicode` and `cva-only-classname` |
| [`@open-tomato/typescript-config`](packages/typescript-config/README.md) | the strict tsconfig base, with bun, node, react and nextjs flavors and emit mixins |
| [`@open-tomato/gates`](packages/gates/README.md) | `ot-control-byte-gate` and `ot-privacy-gate`, for CI and pre-commit hooks |

A project that adopts them starts from [docs/adopting.md](docs/adopting.md).

## What goes where

A rule or option belongs in one of three places:

1. **The base**, when every project holds to it: the style rules, the
   strict compiler flags, the unicode rule.
2. **A flavor or mixin**, when a kind of project shares it: React, Vite,
   CVA classes, Node emit, a `tsc --build` member.
3. **The project's own config**, when it names that project's folders,
   packages or architecture: an import boundary, an ignore for generated
   files, a path alias.

A custom rule or gate written for one project moves here once a second
project wants it.

## Working in this repository

```bash
bun install
bun run hooks   # turns on the pre-commit gates for this clone
bun run gates   # lint, types, tests, pack check, control bytes, privacy
```

`turbo` runs `lint`, `check-types` and `test` in each package. The config
packages lint and type-check each other by relative path, so none depends
on another as a dev dependency and the workspace graph has no cycle.

## Releasing

A change that should release a package carries a fragment in `.changes/`:

```markdown
---
plan: short-name-of-the-change
title: One line a reader of the changelog understands
level: patch
package: @open-tomato/eslint-config
---

- area: what changed, for someone who uses the package.
```

The level is `patch`, `minor`, `major` or `none`. A change to two packages
writes two fragments.

`rafa release settle` folds the waiting fragments into one version per
package that moved, writes each package's `CHANGELOG.md`, and tags
`<name>@<version>`. A pushed tag runs
[the publish workflow](.github/workflows/release-publish.yml), which runs
every gate and then publishes each tagged package from its folder through
[scripts/publish-package.ts](scripts/publish-package.ts). That script packs
the package with each `workspace:` range filled in from the siblings'
manifests, refuses a tarball the pack check rejects, and runs `npm publish`
with npm trusted publishing, so no token is stored anywhere.

Before the first publish:

1. Create the repository `open-tomato/packages` on GitHub and push.
2. On npmjs.com, add a trusted publisher to each of the four packages,
   naming this repository and `release-publish.yml`.
3. Turn publishing on: `gh variable set RAFA_RELEASE_PUBLISH --body ci`.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
