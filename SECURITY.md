# Security policy

## Reporting a vulnerability

If you find a vulnerability in any `@open-tomato/*` package published from
this repository, **do not open a public issue**. Report it privately through
GitHub's private vulnerability reporting:

1. Open the [Security Advisories](https://github.com/open-tomato/packages/security/advisories/new) page.
2. Choose "Report a vulnerability".
3. Describe the issue and how to reproduce it.

Reports are handled in private until a fix is published.

## Supported versions

Each package's latest minor release line receives security fixes. When a
new minor is published, the previous line stops receiving updates.

## What this repository does to stay safe

- **No stored publish token.** Packages publish through npm trusted
  publishing, from the release workflow only, with provenance attached.
- **Pinned actions.** Every GitHub Action is pinned to a commit, and the
  checkout keeps no credentials.
- **Privacy gate.** Every pull request runs `ot-privacy-gate --history`
  over all of git history, so a private host, home path, address,
  credential or personal email cannot reach the public repository, even in
  a commit a later one reverts. The banned terms are stored as hashes in
  [.privacy-gate.json](.privacy-gate.json).
- **Control-byte gate.** Every pull request runs `ot-control-byte-gate`,
  which refuses raw control bytes and Trojan Source characters in any
  tracked file.
