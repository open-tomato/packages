/**
 * Tests for `@open-tomato/eslint-config`: the base and its flavors, read
 * the way a project reads them.
 *
 * The lint cases run one `ESLint` instance per config over files planted
 * in a scratch directory, so each reading is what the package's config
 * says of a file, with no project leaf in between. A rule-breaking file
 * reads red with the rule named; a clean file beside it reads green, the
 * control that the red cases come from those rules and not from a config
 * that refuses everything.
 *
 * Each instance is warmed once in `beforeAll`: a cold ESLint start
 * (loading the plugins and the config) is slow under parallel tasks, so
 * it is paid there, under its own timeout, and no case carries it.
 *
 * The manifest cases hold the `dependencies` to every package the entries
 * import by name: bun links each workspace member in isolation, so the
 * config resolves its plugins from this package's own `node_modules`, and
 * a plugin left out of the manifest fails to load wherever it is used.
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';
import { ESLint } from 'eslint';

import { typeAware } from '../type-aware.mjs';

/** The package's directory. */
const PACKAGE_DIR = join(import.meta.dir, '..');

/** The entry files whose imports the manifest must declare. */
const ENTRIES = ['base.mjs', 'react.mjs', 'vite.mjs', 'cva.mjs', 'type-aware.mjs', 'markdown-fences.mjs'];

/** A file every rule of the base passes. */
const CLEAN = 'export const greeting = \'hello\';\n';

/** Breaks `@stylistic/quotes`, a shared rule, and nothing else. */
const DOUBLE_QUOTED = 'export const greeting = "hello";\n';

/** Breaks `@open-tomato/no-unsafe-unicode` with a zero-width space written literally. */
const ZERO_WIDTH = `export const greeting = 'hel${String.fromCodePoint(0x200b)}lo';\n`;

/** A type reference `no-undef` would misread as an undefined variable. */
const TYPE_REFERENCE = 'export function size(list: ReadonlyArray<string>): number {\n  return list.length;\n}\n';

/** A component holding an ad-hoc class, which the cva flavor refuses. */
const AD_HOC_CLASS = 'export function Card() {\n  return <div className="p-4" />;\n}\n';

/** One message of a lint result, reduced to what the cases read. */
interface Finding {
  readonly ruleId: string | null;
  readonly severity: number;
}

/** The `beforeAll` timeout: the cold ESLint start and the warm-up lint. */
const WARM_UP_TIMEOUT_MS = 30_000;

/** The timeout of each lint case over a warm instance. */
const LINT_CASE_TIMEOUT_MS = 15_000;

let scratch: string;
let base: ESLint;
let cva: ESLint;
let vite: ESLint;

/** The package a bare specifier names: `eslint` of `eslint/config`, `@eslint/js` of itself. */
function packageName(specifier: string): string {
  const segments = specifier.split('/');
  const length = specifier.startsWith('@')
    ? 2
    : 1;
  return segments.slice(0, length).join('/');
}

/** Plants `source` as `name` in the scratch directory and lints it with `eslint`. */
async function lintPlanted(eslint: ESLint, name: string, source: string): Promise<{ errorCount: number; findings: Finding[] }> {
  const path = join(scratch, name);
  writeFileSync(path, source, 'utf8');
  const [result] = await eslint.lintFiles([path]);
  if (result === undefined) throw new Error(`ESLint answered no result for ${name}`);
  return {
    errorCount: result.errorCount,
    findings: result.messages.map(({ ruleId, severity }) => ({ ruleId, severity })),
  };
}

/** A config file in the scratch directory that spreads the named entries. */
function plantConfig(name: string, entries: readonly string[]): string {
  const imports = entries.map((entry, index) => `import c${index} from '${join(PACKAGE_DIR, entry)}';`);
  const spread = entries.map((_, index) => `...c${index}`).join(', ');
  const path = join(scratch, name);
  writeFileSync(path, `${imports.join('\n')}\nexport default [${spread}];\n`, 'utf8');
  return path;
}

describe('the base and the cva flavor', () => {
  beforeAll(async () => {
    scratch = mkdtempSync(join(tmpdir(), 'ot-eslint-config-'));
    base = new ESLint({ cwd: scratch, overrideConfigFile: join(PACKAGE_DIR, 'base.mjs') });
    cva = new ESLint({ cwd: scratch, overrideConfigFile: plantConfig('cva.config.mjs', ['base.mjs', 'react.mjs', 'cva.mjs']) });
    const warmUp = await lintPlanted(base, 'warm-up.ts', CLEAN);
    expect(warmUp.findings).toEqual([]);
    vite = new ESLint({ cwd: scratch, overrideConfigFile: plantConfig('vite.config.mjs', ['base.mjs', 'react.mjs', 'vite.mjs']) });
    const warmUpCva = await lintPlanted(cva, 'warm-up.tsx', CLEAN);
    expect(warmUpCva.findings).toEqual([]);
    const warmUpVite = await lintPlanted(vite, 'warm-up-vite.tsx', CLEAN);
    expect(warmUpVite.findings).toEqual([]);
  }, WARM_UP_TIMEOUT_MS);

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('reads a clean file green', async () => {
    const outcome = await lintPlanted(base, 'clean.ts', CLEAN);

    expect(outcome.findings).toEqual([]);
  }, LINT_CASE_TIMEOUT_MS);

  it('reads a double-quoted string red under @stylistic/quotes', async () => {
    const outcome = await lintPlanted(base, 'quoted.ts', DOUBLE_QUOTED);

    expect(outcome.findings).toContainEqual({ ruleId: '@stylistic/quotes', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('lints .mts and .cts files as TypeScript', async () => {
    const mts = await lintPlanted(base, 'quoted.mts', DOUBLE_QUOTED);
    const cts = await lintPlanted(base, 'quoted.cts', DOUBLE_QUOTED);

    expect(mts.findings).toContainEqual({ ruleId: '@stylistic/quotes', severity: 2 });
    expect(cts.findings).toContainEqual({ ruleId: '@stylistic/quotes', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('reads a literal zero-width space red under @open-tomato/no-unsafe-unicode', async () => {
    const outcome = await lintPlanted(base, 'invisible.ts', ZERO_WIDTH);

    expect(outcome.findings).toContainEqual({ ruleId: '@open-tomato/no-unsafe-unicode', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('reads a zero-width space in Markdown red too', async () => {
    const outcome = await lintPlanted(base, 'notes.md', `# Notes\n\nhel${String.fromCodePoint(0x200b)}lo\n`);

    expect(outcome.findings).toContainEqual({ ruleId: '@open-tomato/no-unsafe-unicode', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('leaves no-undef off for TypeScript type references', async () => {
    const outcome = await lintPlanted(base, 'types.ts', TYPE_REFERENCE);

    expect(outcome.findings).toEqual([]);
  }, LINT_CASE_TIMEOUT_MS);

  it('reads an ad-hoc className red under the cva flavor', async () => {
    const outcome = await lintPlanted(cva, 'card.tsx', AD_HOC_CLASS);

    expect(outcome.findings).toContainEqual({ ruleId: '@open-tomato/cva-only-classname', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('reads a component module that also exports a helper red under the vite flavor', async () => {
    const source = 'export const format = (value: number): string => `${value}`;\n\nexport function Price() {\n  return <span>{format(1)}</span>;\n}\n';
    const outcome = await lintPlanted(vite, 'price.tsx', source);

    expect(outcome.findings).toContainEqual({ ruleId: 'react-refresh/only-export-components', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('checks the rules of hooks in a plain .ts hook file under the react flavor', async () => {
    const source = 'import { useState } from \'react\';\n\nexport function useCount(start: boolean): number {\n  if (start) {\n    const [count] = useState(0);\n    return count;\n  }\n  return 0;\n}\n';
    const outcome = await lintPlanted(cva, 'use-count.ts', source);

    expect(outcome.findings).toContainEqual({ ruleId: 'react-hooks/rules-of-hooks', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);

  it('leaves the same className alone under the base', async () => {
    const outcome = await lintPlanted(base, 'card-plain.tsx', AD_HOC_CLASS);

    expect(outcome.findings).not.toContainEqual({ ruleId: '@open-tomato/cva-only-classname', severity: 2 });
  }, LINT_CASE_TIMEOUT_MS);
});

describe('typeAware', () => {
  it('refuses to build without the tsconfig folder', () => {
    expect(() => typeAware({ tsconfigRootDir: '' })).toThrow(TypeError);
  });

  it('points the project service at the folder it is given', () => {
    const [block] = typeAware({ tsconfigRootDir: '/project' });

    expect(block?.languageOptions?.parserOptions).toEqual({ projectService: true, tsconfigRootDir: '/project' });
  });
});

describe('package.json', () => {
  it('publishes under the @open-tomato scope', async () => {
    const manifest = (await Bun.file(join(PACKAGE_DIR, 'package.json')).json()) as Record<string, unknown>;

    expect(manifest['name']).toBe('@open-tomato/eslint-config');
    expect(manifest['private']).toBeUndefined();
  });

  it('exports and ships every entry', async () => {
    const manifest = (await Bun.file(join(PACKAGE_DIR, 'package.json')).json()) as Record<string, unknown>;
    const exportsMap = manifest['exports'] as Record<string, { default: string }>;
    const files = manifest['files'] as string[];

    for (const entry of ENTRIES) {
      expect(Object.values(exportsMap).map((target) => target.default)).toContain(`./${entry}`);
      expect(files).toContain(entry);
    }
  });

  it('declares every package the entries import in its dependencies', async () => {
    const manifest = (await Bun.file(join(PACKAGE_DIR, 'package.json')).json()) as Record<string, unknown>;
    const dependencies = Object.keys(manifest['dependencies'] as Record<string, string>);
    const peers = Object.keys(manifest['peerDependencies'] as Record<string, string>);
    const sources = await Promise.all(ENTRIES.map((entry) => Bun.file(join(PACKAGE_DIR, entry)).text()));
    const packages = sources
      .flatMap((source) => [...source.matchAll(/^import .* from '([^']+)';$/gm)].map((match) => match[1] ?? ''))
      .filter((specifier) => !specifier.startsWith('.'))
      .map(packageName);

    expect(packages.length).toBeGreaterThan(0);
    expect([...dependencies, ...peers]).toEqual(expect.arrayContaining(packages));
  });

  it('declares the import resolver base.mjs names by its short name', async () => {
    const manifest = (await Bun.file(join(PACKAGE_DIR, 'package.json')).json()) as Record<string, unknown>;
    const source = await Bun.file(join(PACKAGE_DIR, 'base.mjs')).text();

    expect(source).toContain('\'import/resolver\': {\n        typescript: {');
    expect(manifest['dependencies']).toHaveProperty('eslint-import-resolver-typescript');
  });

  it('keeps eslint a peer, so the project picks its version', async () => {
    const manifest = (await Bun.file(join(PACKAGE_DIR, 'package.json')).json()) as Record<string, unknown>;

    expect(manifest['peerDependencies']).toHaveProperty('eslint');
    expect(manifest['dependencies']).not.toHaveProperty('eslint');
  });
});
