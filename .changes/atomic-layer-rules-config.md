---
plan: atomic-layer-rules
title: Add the atomic flavor, the atomic-layer rules at warn
level: minor
package: @open-tomato/eslint-config
---

- flavors: `/atomic` turns on `layer-imports`, `no-restyle-from-above` and `shared-variants` at `warn`, outside stories and tests. `atomic({ levels })` builds it with a library's own level list, which all three rules share.
