# @open-tomato/typescript-config

The shared `tsconfig` files of the open-tomato projects: a strict base,
four flavors for the kinds of project we build, and four mixins for how a
project emits.

```bash
bun add -d @open-tomato/typescript-config typescript
```

## The base

Every flavor extends `base.json`. These are the core criteria every project
is held to:

| Option | Value | Why |
| --- | --- | --- |
| `strict`, `noUncheckedIndexedAccess` | `true` | An index read can be `undefined`, and the type says so. |
| `isolatedDeclarations`, `declaration` | `true` | Every export carries its own type, so declarations build per file. |
| `erasableSyntaxOnly` | `true` | No enums, namespaces or parameter properties, so type stripping runs the code. |
| `isolatedModules`, `moduleDetection: force` | `true`, `force` | Each file compiles alone, as bundlers and bun do. |
| `noFallthroughCasesInSwitch`, `noImplicitOverride`, `noImplicitReturns` | `true` | Common slips caught by the compiler. |
| `target`, `lib`, `module`, `moduleResolution` | `ES2022`, `ES2022`, `ESNext`, `bundler` | Modern ESM, resolved as a bundler does. |
| `noEmit` | `true` | Type checking only; an emit mixin turns output on. |

`noUnusedLocals` and `noUnusedParameters` are left out, because
`@typescript-eslint/no-unused-vars` in the ESLint config already reports
them.

## Flavors

Pick one, and extend it:

```json
{
  "extends": "@open-tomato/typescript-config/bun",
  "include": ["src", "scripts"]
}
```

| Flavor | For | Adds to the base |
| --- | --- | --- |
| `base` | anything | nothing |
| `bun` | bun scripts, CLIs and servers | `module: Preserve`, `types: ["bun"]` |
| `node` | packages that run under Node, emitted by `tsc` | `module` and `moduleResolution: NodeNext`, `lib: ES2023`, `types: ["node"]` |
| `react` | React apps and component libraries | DOM libs, `jsx: react-jsx`, `verbatimModuleSyntax`, `useDefineForClassFields` |
| `nextjs` | Next.js apps | the react flavor, plus `allowJs`, `incremental` and the `next` plugin, without `isolatedDeclarations` |

The `bun` flavor needs `@types/bun` installed, and the `node` flavor needs
`@types/node`.

Each file is exported with and without its `.json` suffix, so
`@open-tomato/typescript-config/bun` and
`@open-tomato/typescript-config/bun.json` name the same file. Editors that
resolve `extends` themselves sometimes need the suffix.

## Mixins

A mixin changes how a project emits, and goes after a flavor in an
`extends` list:

```json
{
  "extends": ["@open-tomato/typescript-config/react", "@open-tomato/typescript-config/declarations"],
  "compilerOptions": { "rootDir": "src", "outDir": "dist" },
  "include": ["src"]
}
```

| Mixin | For |
| --- | --- |
| `build` | `tsc` emits the JavaScript and the declarations |
| `declarations` | a bundler emits the JavaScript, `tsc` the declarations |
| `composite` | a member of a `tsc --build` solution |
| `tooling` | code that never ships, such as stories, visual suites and scripts: no declarations, no `isolatedDeclarations` |

`rootDir`, `outDir`, `declarationDir` and `tsBuildInfoFile` stay in the
project's own file. A path in an extended file is read relative to that
file, so it would point inside `node_modules`.

## Turning a core flag off

A project that cannot meet a core flag yet turns it off in its own file,
with a comment that says why, so the debt stays visible:

```json
{
  "extends": "@open-tomato/typescript-config/bun",
  "compilerOptions": {
    // Parameter properties in src/auth; tracked as a follow-up.
    "erasableSyntaxOnly": false
  }
}
```
