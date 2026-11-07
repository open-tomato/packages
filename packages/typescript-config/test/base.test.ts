/**
 * Tests for `@open-tomato/typescript-config`.
 *
 * The JSON cases read `base.json` as written, so a core flag dropped or
 * set to `false` fails its case. The compile cases run `tsc` over a small
 * planted project for each flavor and mixin, so a combination `tsc`
 * refuses (`isolatedDeclarations` without `declaration`, say) fails here
 * and not in a consumer. The planted projects sit inside this package, so
 * `@types/bun` and `@types/node` resolve from its own `node_modules`.
 */
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

import { afterAll, beforeAll, describe, expect, it } from 'bun:test';

/** The package's directory. */
const PACKAGE_DIR = join(import.meta.dir, '..');

/** Every config the package ships, by export name. */
const CONFIGS = ['base', 'bun', 'node', 'react', 'nextjs', 'build', 'declarations', 'composite', 'tooling'];

/** The core flags every project is held to, unless its leaf says otherwise. */
const CORE_FLAGS = ['strict', 'noUncheckedIndexedAccess', 'isolatedDeclarations', 'erasableSyntaxOnly', 'declaration', 'isolatedModules'];

/** A module that passes every flavor: an explicitly typed export. */
const MODULE = 'export const total = (values: readonly number[]): number => values.reduce((sum, value) => sum + value, 0);\n';

/** A component that passes the react flavors. */
const COMPONENT = 'export function Badge({ label }: { readonly label: string }): React.JSX.Element {\n  return <span>{label}</span>;\n}\n';

/** The timeout of one `tsc` run. */
const TSC_TIMEOUT_MS = 60_000;

let scratch: string;

/** Reads a JSON file of the package as an object. */
async function readJson(name: string): Promise<Record<string, unknown>> {
  return (await Bun.file(join(PACKAGE_DIR, name)).json()) as Record<string, unknown>;
}

/** Plants a project extending `extendsList` with `files`, runs `tsc` on it, and answers its exit code and output. */
function compile(name: string, extendsList: readonly string[], files: Readonly<Record<string, string>>, extra: Record<string, unknown> = {}): { exitCode: number; output: string } {
  const dir = join(scratch, name);
  mkdirSync(dir, { recursive: true });
  for (const [file, text] of Object.entries(files)) writeFileSync(join(dir, file), text, 'utf8');
  const tsconfig = {
    extends: extendsList.map((config) => join(PACKAGE_DIR, `${config}.json`)),
    compilerOptions: { outDir: './out', rootDir: '.', ...extra },
    include: Object.keys(files),
  };
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(tsconfig), 'utf8');
  const proc = Bun.spawnSync(['bunx', 'tsc', '-p', join(dir, 'tsconfig.json')], { cwd: PACKAGE_DIR, stdout: 'pipe', stderr: 'pipe' });
  return { exitCode: proc.exitCode, output: `${proc.stdout.toString()}${proc.stderr.toString()}` };
}

describe('base.json', () => {
  it('sets every core flag', async () => {
    const base = await readJson('base.json');
    const options = base['compilerOptions'] as Record<string, unknown>;

    for (const flag of CORE_FLAGS) expect(options[flag]).toBe(true);
    expect(options['noEmit']).toBe(true);
  });

  it('extends nothing, so no flag comes from a file outside the package', async () => {
    expect(await readJson('base.json')).not.toHaveProperty('extends');
  });
});

describe('tsc over each flavor', () => {
  beforeAll(() => {
    scratch = mkdtempSync(join(PACKAGE_DIR, '.scratch-'));
  });

  afterAll(() => {
    rmSync(scratch, { recursive: true, force: true });
  });

  it('accepts the base, bun and node flavors', () => {
    for (const flavor of ['base', 'bun', 'node']) {
      const outcome = compile(flavor, [flavor], { 'index.ts': MODULE });

      expect(outcome).toEqual({ exitCode: 0, output: '' });
    }
  }, TSC_TIMEOUT_MS);

  it('accepts a component under the react flavor', () => {
    const outcome = compile('react', ['react'], { 'badge.tsx': COMPONENT });

    expect(outcome).toEqual({ exitCode: 0, output: '' });
  }, TSC_TIMEOUT_MS);

  it('accepts the emit mixins laid over a flavor', () => {
    for (const mixin of ['build', 'declarations', 'composite']) {
      const outcome = compile(`bun-${mixin}`, ['bun', mixin], { 'index.ts': MODULE });

      expect(outcome).toEqual({ exitCode: 0, output: '' });
    }
  }, TSC_TIMEOUT_MS);

  it('refuses an untyped export under the base, and accepts it under the tooling mixin', () => {
    const untyped = { 'index.ts': 'export const total = (values: number[]) => values.length;\n' };

    expect(compile('untyped', ['base'], untyped).exitCode).not.toBe(0);
    expect(compile('untyped-tooling', ['base', 'tooling'], untyped)).toEqual({ exitCode: 0, output: '' });
  }, TSC_TIMEOUT_MS);

  it('refuses a parameter property, which erasableSyntaxOnly forbids', () => {
    const outcome = compile('erasable', ['base'], { 'index.ts': 'export class Clock {\n  constructor(private readonly now: number) {}\n}\n' });

    expect(outcome.exitCode).not.toBe(0);
    expect(outcome.output).toContain('TS1294');
  }, TSC_TIMEOUT_MS);
});

describe('package.json', () => {
  it('exports and ships every config, with and without the .json suffix', async () => {
    const manifest = await readJson('package.json');
    const exportsMap = manifest['exports'] as Record<string, string>;

    expect(manifest['name']).toBe('@open-tomato/typescript-config');
    expect(manifest['private']).toBeUndefined();
    for (const config of CONFIGS) {
      expect(exportsMap[`./${config}`]).toBe(`./${config}.json`);
      expect(exportsMap[`./${config}.json`]).toBe(`./${config}.json`);
    }
    expect(manifest['files']).toEqual(CONFIGS.map((config) => `${config}.json`));
  });
});
