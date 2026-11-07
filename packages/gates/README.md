# @open-tomato/gates

Repository gates for the open-tomato projects. Each gate reads what git
tracks, reports by file and line, and exits with one of three codes:

| Exit | Meaning |
| --- | --- |
| `0` | clean |
| `1` | findings |
| `2` | the gate could not run |

A gate that cannot run never reports a pass. Both gates are TypeScript run
by bun, so they need bun 1.3 or newer.

```bash
bun add -d @open-tomato/gates
```

## `ot-control-byte-gate`

Refuses raw control bytes and invisible characters in tracked text files.
A raw NUL makes git treat a file as binary, so its diffs stop rendering, and
makes grep miss text that is there. The gate also refuses the Trojan Source
BiDi overrides and the zero-width characters, the same set as
`@open-tomato/no-unsafe-unicode` in
[`@open-tomato/eslint-plugin`](../eslint-plugin/README.md). The gate covers
files ESLint never reads, such as YAML, shell scripts and lock files.

```bash
bunx ot-control-byte-gate                      # every tracked file
bunx ot-control-byte-gate --staged             # the index, for a pre-commit hook
bunx ot-control-byte-gate --include-untracked  # also files not yet added
```

## `ot-privacy-gate`

Refuses personal and private data in what a public repository tracks:

- **Banned terms** from the project's own list, stored as sha256 hashes so
  no file spells them: machine names, private domains, private
  repositories, home paths.
- **Shapes** that need no list: a home directory with its account name, a
  private or public IPv4 address, a LAN host name, a credential prefix, an
  email outside the reserved example domains.
- **Sample data** in stories, fixtures, mocks and tests: a URL, a phone
  number or a profile link must use a reserved example host or the
  fictional 555-01xx range.

```bash
bunx ot-privacy-gate              # tracked files and untracked ones git would track
bunx ot-privacy-gate --staged     # the index, for a pre-commit hook
bunx ot-privacy-gate --history    # every blob and commit identity, before a first push
bunx ot-privacy-gate --root ../other-repo  # a repository other than the current one
```

Each mode reads what it judges from where a reviewer would see it:

- `--staged` reads the files and `.privacy-gate.json` from the index, so
  an allowance edited locally but never staged cannot pass a commit.
- `--history` judges a blob under every path it was committed at,
  because the sample rules and the allow list both depend on the path.
- An unknown flag, `--root` with no folder, or two modes at once stop the
  gate with exit 2, so a typo never runs a different scan.

### The project's list

The package ships no banned terms. Each project keeps its own in
`.privacy-gate.json` at the repository root:

```json
{
  "banned": [
    { "sha256": "<sha256 of the lowercase term>", "label": "a private machine name" }
  ],
  "allow": [
    { "path": "package.json", "rule": "email", "sha256": "<sha256 of the evidence>", "why": "The author field." }
  ]
}
```

A label names the term without spelling it. Print a term's hash with:

```bash
bun -e 'console.log(new Bun.CryptoHasher("sha256").update(process.argv[1].toLowerCase()).digest("hex"))' '<term>'
```

An `allow` entry is a reviewed exception: the path glob, the rule, the
sha256 of the exact text the gate reported, and why it is meant. Without a
config file, the gate runs the shape rules alone and says so in its report.
A malformed config stops the gate with exit 2, and so does a key other than
`banned`, `allow` and `$comment`, or an `allow` rule the gate does not have:
a typo there would otherwise empty a list without a word.

## A pre-commit hook

```bash
#!/usr/bin/env bash
set -euo pipefail
bunx ot-control-byte-gate --staged
bunx ot-privacy-gate --staged
```

Save it as `.githooks/pre-commit`, make it executable, and turn it on once
per clone with `git config core.hooksPath .githooks`.

## Exports

The gates are importable too, for a project that wraps them:

| Path | What it holds |
| --- | --- |
| `./control-bytes` | `scanText`, `scanBuffer`, `scanFiles`, `listFiles` |
| `./privacy` | `judge`, `readSources`, `readConfig`, `parseArgs`, `run` |
| `./privacy/rules` | `scan`, `bannedIn`, `isSamplePath`, `sha256`, `RULE_NAMES` |
| `./privacy/config` | `readPrivacyConfig`, `parsePrivacyConfig`, `CONFIG_FILE`, `NO_CONFIG` |
