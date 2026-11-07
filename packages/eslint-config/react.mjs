import jsxA11y from 'eslint-plugin-jsx-a11y';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

import { CODE_FILES, JSX_FILES } from './files.mjs';

/**
 * The React flavor, laid over `./base.mjs`. It adds `eslint-plugin-react`
 * and the jsx-a11y rules on TSX and JSX files, and the hooks rules on
 * every code file, because custom hooks live in plain `.ts` files. The
 * new JSX transform needs no React in scope, and TypeScript carries the
 * prop types, so those two rules are off.
 *
 * Class conventions are a separate flavor, `./cva.mjs`, so a React
 * project with no Tailwind or CVA takes this one alone.
 *
 * @type {import("eslint").Linter.Config[]} */
export default [
  {
    files: JSX_FILES,
    languageOptions: {
      parserOptions: { ecmaFeatures: { jsx: true } },
      globals: {
        ...globals.browser,
        ...globals.serviceworker,
      },
    },
    plugins: { react },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...react.configs.flat.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
    },
  },
  { files: CODE_FILES, ...reactHooks.configs.flat.recommended },
  { files: JSX_FILES, ...jsxA11y.flatConfigs.recommended },
];
