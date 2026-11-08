# @open-tomato/eslint-config

The shared flat ESLint config of the open-tomato projects. It has one base
and six flavors, and each flavor is laid over the base in the project's own
`eslint.config.mjs`.

```bash
bun add -d @open-tomato/eslint-config eslint typescript
```

## The base

```js
// eslint.config.mjs
import baseConfig from '@open-tomato/eslint-config';

export default [
  { ignores: ['generated/**'] },
  ...baseConfig,
];
```

The base lints JavaScript and TypeScript (`.js .mjs .cjs .jsx .ts .mts .cts
.tsx`), Markdown and JSON. Its rules hold the house style:

- single quotes, semicolons, two-space indent and trailing commas on
  multiline literals;
- imports grouped type, builtin, external, internal, parent, sibling and
  index, alphabetised, with a blank line between groups;
- `eslint:recommended` and `typescript-eslint`'s recommended set;
- `@open-tomato/no-unsafe-unicode` on every linted language, from
  [`@open-tomato/eslint-plugin`](../eslint-plugin/README.md).

`no-undef` is off for TypeScript files, because TypeScript checks undefined
names itself. The base ignores `dist`, `build`, `coverage`, `node_modules`,
`.tsbuild`, `.turbo`, and the agent folders `.claude`, `.rafa` and `.tmp`.

The import resolver reads `./tsconfig.json` and the `tsconfig.json` of each
folder under `packages/`, `apps/` and `services/`. A project with another
layout sets its own list in a block after the base:

```js
{
  settings: {
    'import/resolver': {
      typescript: { noWarnOnMultipleProjects: true, project: ['./tsconfig.json', './addons/*/*/tsconfig.json'] },
    },
  },
},
```

## The flavors

| Entry | What it adds | Lay it over |
| --- | --- | --- |
| `/react` | `eslint-plugin-react` and jsx-a11y on `.tsx` and `.jsx`; the hooks rules on every code file, since custom hooks live in `.ts` files | base |
| `/vite` | `react-refresh/only-export-components` with the Vite preset | base, react |
| `/cva` | `@open-tomato/cva-only-classname`, outside templates, pages, stories and tests | base, react |
| `/atomic` | the atomic-layer rules at `warn`: `layer-imports`, `no-restyle-from-above`, `shared-variants`, outside stories and tests | base, react |
| `/type-aware` | promise and exhaustiveness rules through the project service | base |
| `/markdown-fences` | lints the `js` and `ts` fences of Markdown files | base |

A React component library on Vite with CVA classes:

```js
import baseConfig from '@open-tomato/eslint-config';
import cvaConfig from '@open-tomato/eslint-config/cva';
import reactConfig from '@open-tomato/eslint-config/react';
import viteConfig from '@open-tomato/eslint-config/vite';

export default [...baseConfig, ...reactConfig, ...viteConfig, ...cvaConfig];
```

The atomic flavor reads a component's level from its path,
`src/<level>/<Name>/`, and warns where a component imports from its own
level or a higher one, restyles another component through `className`, or
borrows another component's `.variants` file. Its default export uses the
default levels, lowest first: `particles`, `atoms`, `molecules`,
`organisms`, `templates`, `layouts`, `pages`. That list holds every level
the open-tomato libraries use, and a level with no folder costs nothing, so
a library with fewer levels keeps it. A library whose levels differ builds
the flavor with its own list, which all three rules share:

```js
import { atomic } from '@open-tomato/eslint-config/atomic';

export default [...baseConfig, ...reactConfig, ...atomic({ levels: ['atoms', 'molecules', 'organisms', 'templates'] })];
```

The rules warn rather than fail, so they show where a low-level component
is redefined across layers without blocking a build. A core library that
gates on them sets them to `error` in a block after the flavor:

```js
{
  rules: {
    '@open-tomato/layer-imports': ['error', { levels }],
    '@open-tomato/no-restyle-from-above': ['error', { levels }],
    '@open-tomato/shared-variants': ['error', { levels }],
  },
},
```

The rules themselves are described in the
[plugin's README](../eslint-plugin/README.md#the-atomic-layer-rules).

The type-aware flavor is a function, because the project service needs the
folder of the project's `tsconfig.json`:

```js
import baseConfig from '@open-tomato/eslint-config';
import { typeAware } from '@open-tomato/eslint-config/type-aware';

export default [...baseConfig, ...typeAware({ tsconfigRootDir: import.meta.dirname })];
```

## Building blocks

`/files` exports the globs the configs use (`TS_FILES`, `JS_FILES`,
`CODE_FILES`, `JSX_FILES`, `LINTED_FILES`), so a project block can name the
same sets. `/shared-rules` exports the style rules alone, for a project that
needs them in a block of its own.

## Versions

ESLint is a peer dependency, so the project picks its version within
`^9.39`. ESLint 10 is not supported yet, because `eslint-plugin-import` does
not load under it without a compatibility wrapper.
