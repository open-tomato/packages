# Changelog

## 0.2.0 — 2026-11-08, Add the atomic flavor, the atomic-layer rules at warn
<!-- rafa:fragments atomic-layer-rules-config -->

- flavors: `/atomic` turns on `layer-imports`, `no-restyle-from-above` and `shared-variants` at `warn`, outside stories and tests. `atomic({ levels })` builds it with a library's own level list, which all three rules share.

## 0.1.1 — 2026-11-07, The React flavor's README names the files the hooks rules run on
<!-- rafa:fragments readme-pass-eslint-config -->

- react: the README now says the hooks rules run on every code file, not only on .tsx and .jsx, matching what the flavor does.

## 0.1.0 — 2026-11-07, First release of the shared ESLint config
<!-- rafa:fragments globals-first-release-eslint-config -->

- config: the base for JavaScript, TypeScript, Markdown and JSON, with the react, vite, cva, type-aware and markdown-fences flavors. ESLint is now a peer dependency, `no-undef` is off for TypeScript files, and the import resolver no longer names one repository's folders.
