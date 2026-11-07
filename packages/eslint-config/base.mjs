import eslint from '@eslint/js';
import markdown from '@eslint/markdown';
import openTomato from '@open-tomato/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';
import * as tsParser from '@typescript-eslint/parser';
import { defineConfig } from 'eslint/config';
import importPlugin from 'eslint-plugin-import';
import jsonc from 'eslint-plugin-jsonc';
import globals from 'globals';
import * as jsoncParser from 'jsonc-eslint-parser';
import { configs as tsLintConfig } from 'typescript-eslint';

import { CODE_FILES, LINTED_FILES, TS_FILES } from './files.mjs';
import sharedRules from './shared-rules.mjs';

/**
 * The base every open-tomato ESLint config builds on: JavaScript and
 * TypeScript with the shared style and import rules, Markdown, JSON, and
 * `@open-tomato/no-unsafe-unicode` over all of them.
 *
 * A project spreads it into its own `eslint.config.mjs` and adds its
 * ignores and its own rules after it. The flavors (`react`, `vite`, `cva`,
 * `typeAware`, `markdownFences`) are laid over it the same way.
 *
 * @type {import("eslint").Linter.Config[]} */
export default defineConfig([
  {
    ignores: [
      '**/dist/**',
      '**/build/**',
      '**/coverage/**',
      '**/node_modules/**',
      '**/.tsbuild/**',
      '**/.turbo/**',
      '**/package-lock.json',
      '**/.docs/**',
      // Agent-harness prose and loop state: never a lint target.
      '.claude/**',
      '.rafa/**',
      '.tmp/**',
    ],
  },
  importPlugin.flatConfigs.recommended,
  importPlugin.flatConfigs.typescript,
  {
    files: CODE_FILES,
    extends: [
      eslint.configs.recommended,
      tsLintConfig.recommended,
    ],
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      globals: {
        ...globals.node,
        ...globals.browser,
        Bun: 'readonly',
      },
      parser: tsParser,
      ecmaVersion: 'latest',
      sourceType: 'module',
    },
    rules: {
      ...sharedRules,
    },
    settings: {
      'import/parsers': {
        '@typescript-eslint/parser': ['.ts', '.mts', '.cts', '.tsx', '.d.ts'],
      },
      'import/resolver': {
        typescript: {
          // Several globs make several projects; the resolver otherwise
          // prints `Multiple projects found` on every run. A glob that
          // matches nothing is skipped. A project with another layout sets
          // its own `project` list in a later block.
          noWarnOnMultipleProjects: true,
          project: [
            './tsconfig.json',
            './packages/*/tsconfig.json',
            './apps/*/tsconfig.json',
            './services/*/tsconfig.json',
          ],
        },
      },
    },
  },
  {
    // TypeScript checks undefined names itself, and `no-undef` reads type
    // references and ambient globals as undefined variables, as the
    // typescript-eslint docs warn.
    files: TS_FILES,
    rules: {
      'no-undef': 'off',
    },
  },
  {
    files: ['**/*.md'],
    plugins: {
      markdown,
    },
    extends: ['markdown/recommended'],
    rules: {
      'markdown/no-missing-label-refs': 'off',
    },
  },
  {
    files: ['**/*.json'],
    languageOptions: {
      parser: jsoncParser,
    },
    plugins: {
      jsonc,
      '@stylistic': stylistic,
    },
    rules: {
      'jsonc/indent': ['error', 2],
      '@stylistic/no-multiple-empty-lines': ['error', { 'max': 0, 'maxEOF': 0 }],
    },
  },
  {
    // One universal block ON PURPOSE, covering every linted language: a
    // rule registered inside a single language's block silently vanishes
    // when someone edits that block. Parsing comes from the per-language
    // blocks above; this block only adds the rule. The byte-level floor
    // under it is the control-byte gate of `@open-tomato/gates`.
    files: LINTED_FILES,
    plugins: {
      '@open-tomato': openTomato,
    },
    rules: {
      '@open-tomato/no-unsafe-unicode': 'error',
    },
  },
]);
