import openTomato from '@open-tomato/eslint-plugin';

import { JSX_FILES } from './files.mjs';

/**
 * The CVA flavor: `@open-tomato/cva-only-classname` on TSX and JSX files,
 * for component libraries whose classes live in `cva` calls. A
 * `className` may hold only a variants call, a `cn()` over variants and
 * the passthrough, or the passthrough alone.
 *
 * Templates, pages, stories and tests are left out: a page lays out its
 * cards, a story's decorator may hold a layout class, and a test hands a
 * class in to prove the passthrough.
 *
 * @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: JSX_FILES,
    ignores: ['**/templates/**', '**/pages/**', '**/*.stories.tsx', '**/*.test.tsx'],
    plugins: { '@open-tomato': openTomato },
    rules: { '@open-tomato/cva-only-classname': 'error' },
  },
];
