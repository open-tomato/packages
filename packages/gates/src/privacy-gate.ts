#!/usr/bin/env bun
/**
 * The privacy gate: refuses personal and private data in what a public
 * repository tracks. The rules live in `./privacy-rules.ts`, the
 * project's banned terms and reviewed exceptions in its
 * `.privacy-gate.json` (`./privacy-config.ts`); this file picks what to
 * read and reports.
 *
 *   ot-privacy-gate              tracked and untracked-not-ignored files
 *   ot-privacy-gate --staged     the index blobs (the pre-commit hook)
 *   ot-privacy-gate --history    every blob and commit identity in every ref
 *   ot-privacy-gate --root <dir> a repository other than the current one
 *
 * `--staged` judges the index, not the worktree, so a value staged and
 * then cleaned up locally still blocks; it reads the config from the
 * index too, so an unstaged allowance cannot pass a commit. `--history`
 * is the check before a first push: a value removed by a later commit is
 * still published by the earlier one, and a blob is judged under every
 * path it was committed at.
 *
 * A finding that is meant (the author's address in `package.json`, say)
 * goes in the config's `allow` list with its path glob, rule and the
 * sha256 of its evidence, so every exception is written down and reviewed
 * in a diff without the config spelling the value.
 *
 * Exit codes: 0 clean, 1 findings, 2 the gate could not run. A gate that
 * cannot run must never read as a gate that passed.
 */
import { join } from 'node:path';

import { type Allowance, CONFIG_FILE, NO_CONFIG, parsePrivacyConfig, type PrivacyConfig, readPrivacyConfig } from './privacy-config';
import { type Finding, scan, sha256 } from './privacy-rules';

/** A file to judge: where it is named from, and its text. */
export interface Source {
  readonly name: string;
  readonly path: string;
  readonly text: string;
}

/** The modes the gate reads sources in. */
export type Mode = 'tree' | 'staged' | 'history';

/** What the command line asks for. */
export interface GateArgs {
  readonly mode: Mode;
  /** The folder to start from; the current one when absent. */
  readonly root: string | undefined;
}

/** A NUL in the first bytes marks a binary file, which is skipped. */
const BINARY_PROBE = 8000;

/** The flags that pick a mode other than the tree. */
const MODE_FLAGS: Readonly<Record<string, Mode>> = { '--staged': 'staged', '--history': 'history' };

/** Run git and answer its stdout, failing loudly on a nonzero exit. */
function git(args: string[], cwd: string): Buffer {
  const result = Bun.spawnSync(['git', ...args], { cwd, maxBuffer: 512 * 1024 * 1024 });
  if (result.exitCode !== 0) throw new Error(`git ${args.join(' ')} failed: ${result.stderr.toString()}`);
  return result.stdout;
}

/** The whole text of a blob, or null for a binary one. */
function textOf(bytes: Uint8Array): string | null {
  if (bytes.subarray(0, BINARY_PROBE).includes(0)) return null;
  return new TextDecoder().decode(bytes);
}

/** Split NUL-separated git output into its entries. */
function entries(output: Buffer): string[] {
  return output.toString().split('\0')
    .filter((entry) => entry !== '');
}

/** The tracked files and the untracked ones git would track. */
async function treeSources(root: string): Promise<Source[]> {
  const sources: Source[] = [];
  for (const path of entries(git(['ls-files', '-z', '--cached', '--others', '--exclude-standard'], root))) {
    const file = Bun.file(join(root, path));
    if (!(await file.exists())) continue;
    const text = textOf(await file.bytes());
    if (text !== null) sources.push({ name: path, path, text });
  }
  return sources;
}

/** The index blobs of the files a commit would add or change. */
function stagedSources(root: string): Source[] {
  const sources: Source[] = [];
  for (const path of entries(git(['diff', '--cached', '--name-only', '-z', '--diff-filter=ACMR'], root))) {
    const text = textOf(git(['show', `:${path}`], root));
    if (text !== null) sources.push({ name: `${path} (staged)`, path, text });
  }
  return sources;
}

/** The text of the blob `sha`, read once and kept in `cache`. */
function blobText(sha: string, root: string, cache: Map<string, string | null>): string | null {
  const known = cache.get(sha);
  if (known !== undefined) return known;
  const text = textOf(git(['cat-file', 'blob', sha], root));
  cache.set(sha, text);
  return text;
}

/**
 * Every blob in the tree of every commit reachable from any ref, once per
 * path it was committed at, plus commit identities and messages. The
 * rules and the allow list both depend on the path, so a blob copied to a
 * second path is judged again there.
 */
function historySources(root: string): Source[] {
  const sources: Source[] = [];
  const seen = new Set<string>();
  const cache = new Map<string, string | null>();
  for (const commit of git(['rev-list', '--all'], root).toString()
    .split('\n')
    .filter((line) => line !== '')) {
    for (const entry of entries(git(['ls-tree', '-r', '-z', commit], root))) {
      const [meta = '', path = ''] = entry.split('\t');
      const [, type, sha] = meta.split(' ');
      if (type !== 'blob' || sha === undefined || path === '' || seen.has(`${sha} ${path}`)) continue;
      seen.add(`${sha} ${path}`);
      const text = blobText(sha, root, cache);
      if (text !== null) sources.push({ name: `${path} @ ${sha.slice(0, 8)}`, path, text });
    }
  }
  const log = git(['log', '--all', '--format=%h%x00%an <%ae>%x00%cn <%ce>%x00%B%x00%x01'], root).toString();
  for (const record of log.split('\x01')) {
    const [hash, author, committer, body] = record.replace(/^\n/, '').split('\0');
    if (hash === undefined || hash === '') continue;
    sources.push({ name: `commit ${hash}`, path: '.git/COMMIT', text: [author, committer, body].join('\n') });
  }
  return sources;
}

/** Whether a finding in `path` is one of the reviewed exceptions. */
function isAllowed(path: string, finding: Finding, allowed: readonly Allowance[]): boolean {
  return allowed.some((allowance) => allowance.rule === finding.rule
    && allowance.sha256 === sha256(finding.evidence)
    && new Bun.Glob(allowance.path).match(path));
}

/** Judges the sources under `config` and answers the report lines. */
export function judge(sources: readonly Source[], config: PrivacyConfig): string[] {
  const report: string[] = [];
  for (const source of sources) {
    for (const finding of scan(source.path, source.text, config.banned)) {
      if (isAllowed(source.path, finding, config.allow)) continue;
      report.push(`${source.name}:${finding.line}  ${finding.rule}  ${finding.evidence}`);
    }
  }
  return report;
}

/** The sources one mode reads from the repository at `root`. */
export async function readSources(root: string, mode: Mode): Promise<Source[]> {
  if (mode === 'staged') return stagedSources(root);
  if (mode === 'history') return historySources(root);
  return treeSources(root);
}

/** The config a mode judges by: the index copy for `--staged`, the worktree copy otherwise. */
export function readConfig(root: string, mode: Mode): PrivacyConfig {
  if (mode !== 'staged') return readPrivacyConfig(root);
  if (entries(git(['ls-files', '-z', '--cached', '--', CONFIG_FILE], root)).length === 0) return NO_CONFIG;
  return parsePrivacyConfig(git(['show', `:${CONFIG_FILE}`], root).toString());
}

/**
 * Parses the command line strictly: an unknown argument, `--root` with
 * no folder, or two mode flags throw, so a typo never runs a different
 * scan than the one asked for.
 */
export function parseArgs(argv: readonly string[]): GateArgs {
  let mode: Mode | undefined;
  let root: string | undefined;
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index] ?? '';
    if (arg === '--root') {
      const value = argv[index + 1];
      if (value === undefined || value.startsWith('--')) throw new Error('--root needs a folder after it');
      if (root !== undefined) throw new Error('--root is given twice');
      root = value;
      index += 1;
      continue;
    }
    const flagMode = MODE_FLAGS[arg];
    if (flagMode === undefined) throw new Error(`unknown argument ${arg}; the gate takes --staged, --history and --root <dir>`);
    if (mode !== undefined) throw new Error(`--${mode} and ${arg} cannot run together`);
    mode = flagMode;
  }
  return { mode: mode ?? 'tree', root };
}

/** The exit code for "the gate could not run". */
const EXIT_FAILED = 2;

/** Runs the gate over the repository the arguments name and answers its exit code. */
export async function run(argv: readonly string[]): Promise<number> {
  const { mode, root: start = process.cwd() } = parseArgs(argv);
  const root = git(['rev-parse', '--show-toplevel'], start).toString()
    .trim();
  const config = readConfig(root, mode);
  const sources = await readSources(root, mode);
  if (mode !== 'staged' && sources.length === 0) {
    console.error(`privacy-gate: FAIL, 0 ${mode} sources under ${root}. Refusing to report a pass.`);
    return EXIT_FAILED;
  }
  const listNote = config.found
    ? `${config.banned.size} banned terms`
    : `no ${CONFIG_FILE}, so no banned terms`;
  const report = judge(sources, config);
  if (report.length === 0) {
    console.log(`privacy-gate: ${sources.length} ${mode} sources, ${listNote}, no findings`);
    return 0;
  }
  console.error(`privacy-gate: ${report.length} findings in ${mode} sources (${listNote})\n${report.join('\n')}`);
  console.error(`\nRemove each value, replace it with a reserved example, or add a reviewed entry to the allow list of ${CONFIG_FILE}\n(its evidence as sha256: bun -e 'console.log(new Bun.CryptoHasher("sha256").update(process.argv[1]).digest("hex"))' '<evidence>').`);
  return 1;
}

if (import.meta.main) {
  try {
    process.exit(await run(process.argv.slice(2)));
  } catch (error) {
    const message = error instanceof Error
      ? error.message
      : String(error);
    console.error(`privacy-gate: FAIL, the gate could not run: ${message}`);
    process.exit(EXIT_FAILED);
  }
}
