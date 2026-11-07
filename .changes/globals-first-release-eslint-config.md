---
plan: globals-first-release-eslint-config
title: First release of the shared ESLint config
level: minor
package: @open-tomato/eslint-config
---

- config: the base for JavaScript, TypeScript, Markdown and JSON, with the react, vite, cva, type-aware and markdown-fences flavors. ESLint is now a peer dependency, `no-undef` is off for TypeScript files, and the import resolver no longer names one repository's folders.
