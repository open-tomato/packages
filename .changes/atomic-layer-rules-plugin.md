---
plan: atomic-layer-rules
title: Add the atomic-layer rules layer-imports, no-restyle-from-above and shared-variants
level: minor
package: @open-tomato/eslint-plugin
---

- rules: `layer-imports` warns when a component imports from its own level or a higher one, except `Basic<Folder>` from that folder's barrel.
- rules: `no-restyle-from-above` warns when a component element imported from another component gets any `className` but the passthrough.
- rules: `shared-variants` warns when a component imports another component's `.variants` file from outside the lowest level.
- exports: `DEFAULT_LEVELS`, the levels the three rules use without a `levels` option, lowest first.
