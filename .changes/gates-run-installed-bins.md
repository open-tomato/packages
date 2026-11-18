---
plan: gates-run-installed-bins
title: The gates README runs each gate through the installed package
level: patch
package: @open-tomato/gates
---

- docs: every run line and the pre-commit hook use `bun run <bin>`, which runs only the installed gate and fetches nothing where the package is missing; the README says why a bare `bunx <bin>` is never the form.
