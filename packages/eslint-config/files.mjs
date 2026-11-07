/**
 * The file globs the configs of this package share, exported so a
 * project's own blocks can name the same sets.
 */

/** TypeScript sources, module and CommonJS flavors and JSX included. */
export const TS_FILES = ['**/*.ts', '**/*.mts', '**/*.cts', '**/*.tsx'];

/** JavaScript sources, module and CommonJS flavors and JSX included. */
export const JS_FILES = ['**/*.js', '**/*.mjs', '**/*.cjs', '**/*.jsx'];

/** Every JavaScript and TypeScript source. */
export const CODE_FILES = [...JS_FILES, ...TS_FILES];

/** JSX and TSX files: what the React flavors lint. */
export const JSX_FILES = ['**/*.tsx', '**/*.jsx'];

/** Every file the base lints: code, Markdown and JSON. */
export const LINTED_FILES = [...CODE_FILES, '**/*.md', '**/*.json'];
