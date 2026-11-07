# Adopting the shared packages in a project

These steps move a project from its own copies of the ESLint and TypeScript
configs to the published `@open-tomato/*` packages. Each step ends with a
command that tells you whether it worked.

## 1. Install the packages

```bash
bun add -d @open-tomato/eslint-config @open-tomato/typescript-config eslint typescript
```

Add `@open-tomato/gates` too if the project runs the gates. Inside a bun
workspace, add them at the root, and each member reaches them from there.
Use a registry range such as `^0.1.0`, never `file:` or `link:`.

## 2. Replace the ESLint config

Delete the project's own copies, usually `eslint.base.mjs`,
`sharedRules.mjs` and an `unsafeUnicode.mjs` or `tools/eslint-rules/`
folder. Then rewrite `eslint.config.mjs` as the base, the flavors the
project needs, and only what is the project's own:

```js
import baseConfig from '@open-tomato/eslint-config';
import reactConfig from '@open-tomato/eslint-config/react';

export default [
  { ignores: ['drizzle/**/meta/**'] },
  ...baseConfig,
  ...reactConfig,
  {
    // The project's own boundary: a rule that names its folders.
    files: ['src/core/**/*.ts'],
    rules: { 'no-restricted-imports': ['error', { patterns: ['../adapters/*'] }] },
  },
];
```

Pick the flavors from the project's stack:

| The project has | Add |
| --- | --- |
| React components | `/react` |
| Vite with React | `/react`, `/vite` |
| A component library with CVA classes | `/react`, `/cva` |
| Promises you want checked by type | `/type-aware`, called with `import.meta.dirname` |
| TypeScript in its Markdown fences | `/markdown-fences` |

Check:

```bash
bunx eslint . --fix
bunx eslint .
```

The first run fixes the style differences. Read what is left: each finding
is a real difference between the project and the shared rules.

## 3. Rename the rule prefixes

The two custom rules moved to `@open-tomato/eslint-plugin`, under one
prefix. Search the project for the old names in configs and disable
comments:

| Old name | New name |
| --- | --- |
| `ar/no-unsafe-unicode`, `house/no-unsafe-unicode` | `@open-tomato/no-unsafe-unicode` |
| `ot/cva-only-classname`, `d2c/cva-only-classname` | `@open-tomato/cva-only-classname` |

```bash
grep -rnE "(ar|ot|house|d2c)/(no-unsafe-unicode|cva-only-classname)" --include='*.*js' --include='*.ts' --include='*.tsx' . | grep -v node_modules
```

The search should print nothing once the rename is done.

## 4. Replace the TypeScript config

Point the root `tsconfig.json` at one flavor, and keep only the project's
own options:

```json
{
  "extends": "@open-tomato/typescript-config/bun",
  "compilerOptions": {
    "paths": { "#db": ["./src/data/sqlite/index.ts"] }
  },
  "include": ["src", "scripts", "tests"]
}
```

A file that emits extends the flavor and a mixin, and keeps `rootDir` and
`outDir` itself:

```json
{
  "extends": ["@open-tomato/typescript-config/node", "@open-tomato/typescript-config/build"],
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"],
  "exclude": ["src/**/*.test.ts"]
}
```

Stories, visual suites and scripts that never ship extend the `tooling`
mixin, which turns `isolatedDeclarations` off for them.

Check:

```bash
bunx tsc --noEmit
```

The base turns on `isolatedDeclarations` and `erasableSyntaxOnly`, and
most projects did not have them. Expect two kinds of error:

- **TS9007, TS9010 and the other TS90xx codes**: an export has no explicit
  type. Add the return type or the annotation.
- **TS1294**: a parameter property, enum or namespace. Write the field and
  assign it in the constructor; use a union of strings for an enum.

When a project cannot pay that down now, turn the flag off in its own
`tsconfig.json`, with a comment that says why, and track it as a
follow-up.

## 5. Add the gates

Add a `.privacy-gate.json` at the root with the project's banned terms as
hashes (see [the gates README](../packages/gates/README.md)), then add the
scripts and the hook:

```json
{
  "scripts": {
    "gate:control-bytes": "ot-control-byte-gate",
    "gate:privacy": "ot-privacy-gate"
  }
}
```

```bash
bun run gate:control-bytes
bun run gate:privacy
```

Delete the project's own copy of the gates afterwards, usually
`scripts/control-byte-gate/`, `tools/privacy-gate/` or a
`scripts/privacy-check.ts`.

## 6. Remove what the packages now bring

The config package depends on every ESLint plugin it uses. Remove the
project's own entries for `@eslint/js`, `@eslint/markdown`,
`@stylistic/eslint-plugin`, `@typescript-eslint/parser`,
`typescript-eslint`, `eslint-plugin-import`,
`eslint-import-resolver-typescript`, `eslint-plugin-jsonc`,
`jsonc-eslint-parser`, `globals`, and the React plugins, unless the
project imports one of them in its own config.

```bash
bun install
bunx eslint .
bunx tsc --noEmit
```

Both should pass as they did after steps 2 and 4.
