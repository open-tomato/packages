import { reactRefresh } from 'eslint-plugin-react-refresh';

import { JSX_FILES } from './files.mjs';

/**
 * The Vite flavor: `eslint-plugin-react-refresh` with its Vite preset, so
 * a module that exports anything besides components is flagged before it
 * breaks Fast Refresh. Lay it over `./base.mjs` and `./react.mjs`.
 *
 * @type {import("eslint").Linter.Config[]} */
export default [
  // The presets are functions in eslint-plugin-react-refresh 0.5: spread
  // without the call, the block would carry no rule at all.
  { files: JSX_FILES, ...reactRefresh.configs.vite() },
];
