# Changelog

## 0.1.1 — 2026-11-07, The privacy gate's README covers --root and what each mode reads
<!-- rafa:fragments readme-pass-gates -->

- privacy: the README documents --root, the config read from the index under --staged, the per-path history scan, and the flag and config typos that stop the gate with exit 2.

## 0.1.0 — 2026-11-07, First release of the repository gates
<!-- rafa:fragments globals-first-release-gates -->

- gates: `ot-control-byte-gate` and `ot-privacy-gate`. The privacy gate reads each project's banned terms and reviewed exceptions from `.privacy-gate.json`.
