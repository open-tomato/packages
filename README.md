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

A release takes four steps, run from an up-to-date `main`:

1. Settle the waiting fragments. `rafa release settle` folds them into one
   version per package that moved, writes each package's `CHANGELOG.md`,
   and pushes the release commit to `main` itself, so pull it afterwards:

   ```bash
   rafa release settle
   git pull --ff-only
   ```

2. Tag each package that moved, on the release commit. `rafa release tag`
   refuses in this repository, because the private root never releases,
   so the tags are written with git. The loop skips a version whose tag
   exists already:

   ```bash
   for dir in packages/*/; do
     tag="$(bun -e "const m = require('./${dir}package.json'); console.log(m.name + '@' + m.version)")"
     git rev-parse -q --verify "refs/tags/$tag" > /dev/null || git tag "$tag"
   done
   ```

3. Push the tags on the release commit:

   ```bash
   git push origin $(git tag --points-at HEAD)
   ```

   GitHub starts no workflow for a push that carries more than three tags.
   With four or more, start the publish by hand:

   ```bash
   gh workflow run release-publish.yml -f ref="$(git rev-parse HEAD)"
   ```

4. Watch the run:

   ```bash
   gh run watch "$(gh run list --workflow release-publish.yml --limit 1 --json databaseId --jq '.[0].databaseId')"
   ```

[The publish workflow](.github/workflows/release-publish.yml) runs every
gate, then publishes every release tag on the commit it checks out, each
package from its folder through
[scripts/publish-package.ts](scripts/publish-package.ts). That script packs
the package with each `workspace:` range filled in from the siblings'
manifests, refuses a tarball the pack check rejects, and runs `npm publish`
through npm trusted publishing, so no token is stored anywhere. A version
npm already holds is skipped, so a rerun publishes only what is missing.
Runs share one concurrency group, so a run started while another is
publishing waits for it instead of racing it.

npm can take up to about twenty minutes to list a new version. Until then
`npm view` answers 404, and a second publish of it answers 409 "previously
staged version", which the script counts as published.

### Before the first publish

1. Create the repository on GitHub and push.
2. Publish the first version of each package from a clone, signed in with
   `npm login`. A trusted publisher lives in a package's settings on
   npmjs.com, and those exist only once the package does. Check out the
   release commit, then run `rafa release publish`.
3. On npmjs.com, add a trusted publisher to each package, for GitHub
   Actions:

   | Field | Value |
   | --- | --- |
   | Organization or user | `open-tomato` |
   | Repository | `packages` |
   | Workflow filename | `release-publish.yml` |
   | Environment | empty |
   | Permissions | **publish** |

   A publisher saved with stage publish alone makes every run fail with
   403 "OIDC permission denied for this action". `npx npm@latest trust
   list <package>` shows what is saved.
4. Turn publishing on: `gh variable set RAFA_RELEASE_PUBLISH --body ci`.

## License

Apache-2.0. See [LICENSE](LICENSE) and [NOTICE](NOTICE).
