import { TS_FILES } from './files.mjs';

/** The test files a type-aware block relaxes `await-thenable` for. */
const TEST_FILES = ['**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts', '**/*.spec.tsx'];

/**
 * The type-aware flavor: the promise and exhaustiveness rules that need
 * type information, through typescript-eslint's project service. It is a
 * function because the project service needs the folder that holds the
 * project's `tsconfig.json`:
 *
 *   import { typeAware } from '@open-tomato/eslint-config/type-aware';
 *   export default [...baseConfig, ...typeAware({ tsconfigRootDir: import.meta.dirname })];
 *
 * `files` narrows it to part of the tree. Type-aware linting is slower,
 * which is why the base leaves it out.
 *
 * In tests, `await-thenable` is off: `expect(...).rejects` in bun's test
 * runner is awaited and is not typed as a thenable.
 *
 * @param {{ tsconfigRootDir: string, files?: string[] }} options
 * @returns {import("eslint").Linter.Config[]}
 */
export function typeAware({ tsconfigRootDir, files = TS_FILES }) {
  if (typeof tsconfigRootDir !== 'string' || tsconfigRootDir === '') {
    throw new TypeError('typeAware needs tsconfigRootDir, the folder of the project\'s tsconfig.json: pass import.meta.dirname.');
  }
  return [
    {
      files,
      ignores: ['**/*.md/**'],
      languageOptions: {
        parserOptions: {
          projectService: true,
          tsconfigRootDir,
        },
      },
      rules: {
        '@typescript-eslint/no-floating-promises': 'error',
        '@typescript-eslint/no-misused-promises': 'error',
        '@typescript-eslint/await-thenable': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
      },
    },
    {
      files: TEST_FILES,
      rules: {
        '@typescript-eslint/await-thenable': 'off',
      },
    },
  ];
}

export default typeAware;
