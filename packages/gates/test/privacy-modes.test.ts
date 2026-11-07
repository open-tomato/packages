/**
 * The privacy gate's read modes, run against planted git repositories:
 * each case is a way a mode could pass something it should block.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'bun:test';

import { CONFIG_FILE, NO_CONFIG, parsePrivacyConfig } from '../src/privacy-config';
import { judge, parseArgs, readConfig, readSources } from '../src/privacy-gate';
import { sha256 } from '../src/privacy-rules';

const at = '@';
const evidence = `jo${at}gmail.com`;

/** Bytes the gate once stopped reading at; the planted value sits past them. */
const PAST_OLD_LIMIT = 3_000_000;

let root = '';

function git(...args: string[]): void {
  const result = Bun.spawnSync([
    'git', '-c', 'user.name=Test', '-c', `user.email=test${at}example.com`,
    '-c', 'commit.gpgsign=false', '-c', 'core.hooksPath=/dev/null', ...args,
  ], { cwd: root });
  if (result.exitCode !== 0) throw new Error(result.stderr.toString());
}

function write(path: string, text: string): void {
  mkdirSync(dirname(join(root, path)), { recursive: true });
  writeFileSync(join(root, path), text, 'utf8');
}

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'ot-privacy-modes-'));
  git('init', '-q');
});

afterEach(() => {
  rmSync(root, { recursive: true, force: true });
});

describe('--history', () => {
  it('judges a blob again under each path it was committed at', async () => {
    const content = `{ "author": "${evidence}" }\n`;
    write('package.json', content);
    git('add', '-A');
    git('commit', '-q', '-m', 'first');
    write('src/copy.json', content);
    git('add', '-A');
    git('commit', '-q', '-m', 'second');
    const config = parsePrivacyConfig(JSON.stringify({
      allow: [{ path: 'package.json', rule: 'email', sha256: sha256(evidence), why: 'the author field' }],
    }));

    const report = judge(await readSources(root, 'history'), config).filter((line) => !line.startsWith('commit '));

    expect(report).toHaveLength(1);
    expect(report[0]).toStartWith('src/copy.json @ ');
  });
});

describe('the tree', () => {
  it('reads a file to its end, past the first megabytes', async () => {
    write('big.txt', `${'x'.repeat(PAST_OLD_LIMIT)}\nmail: ${evidence}\n`);

    const report = judge(await readSources(root, 'tree'), NO_CONFIG);

    expect(report.some((line) => line.startsWith('big.txt:2 '))).toBe(true);
  });
});

describe('--staged', () => {
  const banned = JSON.stringify({ banned: [{ sha256: sha256('example-banned'), label: 'the planted term' }] });

  it('judges by the staged config, not an unstaged edit of it', () => {
    write(CONFIG_FILE, banned);
    git('add', CONFIG_FILE);
    write(CONFIG_FILE, '{}');

    expect(readConfig(root, 'staged').banned.size).toBe(1);
    expect(readConfig(root, 'tree').banned.size).toBe(0);
  });

  it('reads no config when the index holds none', () => {
    write(CONFIG_FILE, banned);

    expect(readConfig(root, 'staged').found).toBe(false);
  });
});

describe('parseArgs', () => {
  it('reads the mode and the root', () => {
    expect(parseArgs(['--history', '--root', 'repo'])).toEqual({ mode: 'history', root: 'repo' });
    expect(parseArgs([])).toEqual({ mode: 'tree', root: undefined });
  });

  it('refuses an unknown flag', () => {
    expect(() => parseArgs(['--stagd'])).toThrow('unknown argument --stagd');
  });

  it('refuses --root with no folder after it', () => {
    expect(() => parseArgs(['--root'])).toThrow('--root needs a folder');
    expect(() => parseArgs(['--root', '--staged'])).toThrow('--root needs a folder');
  });

  it('refuses two modes at once', () => {
    expect(() => parseArgs(['--staged', '--history'])).toThrow('cannot run together');
  });
});
