# Changelog

## 0.2.0 — 2026-11-08, Add the atomic-layer rules layer-imports, no-restyle-from-above and shared-variants
<!-- rafa:fragments atomic-layer-rules-plugin -->

- rules: `layer-imports` warns when a component imports from its own level or a higher one, except `Basic<Folder>` from that folder's barrel.
- rules: `no-restyle-from-above` warns when a component element imported from another component gets any `className` but the passthrough.
- rules: `shared-variants` warns when a component imports another component's `.variants` file from outside the lowest level.
- exports: `DEFAULT_LEVELS`, the levels the three rules use without a `levels` option, lowest first.

## 0.1.1 — 2026-11-07, How to turn a rule off, and the old rule prefixes
<!-- rafa:fragments readme-pass-eslint-plugin -->

- docs: the README shows a disable comment under the @open-tomato/ prefix, says the old ar/, house/, ot/ and d2c/ names no longer exist, and gives the shape findUnsafeUnicode answers.

## 0.1.0 — 2026-11-07, First release of the custom ESLint rules
<!-- rafa:fragments globals-first-release-eslint-plugin -->

- rules: `@open-tomato/no-unsafe-unicode` and `@open-tomato/cva-only-classname`, moved from the rafa config package. The rule prefixes `ar/` and `ot/` become `@open-tomato/`.
