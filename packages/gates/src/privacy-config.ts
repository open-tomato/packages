/**
 * The project's privacy-gate config: `.privacy-gate.json` at the
 * repository root. It holds what only the project knows:
 *
 *   {
 *     "banned": [{ "sha256": "<hash of the lowercase term>", "label": "a private machine name" }],
 *     "allow":  [{ "path": "package.json", "rule": "email", "sha256": "<hash of the evidence>", "why": "..." }]
 *   }
 *
 * Both lists store hashes, never values, so the config can sit in a
 * public repository. A project with no file gets the shape rules alone,
 * and the gate says so in its report.
 *
 * A malformed file throws: a gate that silently dropped a broken list
 * would pass the very terms the list exists to stop.
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import { type BannedTerms, RULE_NAMES, type RuleName } from './privacy-rules';

/** The config file name, at the repository root. */
export const CONFIG_FILE = '.privacy-gate.json';

/** The top-level keys a config may hold; any other is a typo that would empty a list. */
const KNOWN_KEYS: ReadonlySet<string> = new Set(['$comment', 'banned', 'allow']);

/** A sha256 in lowercase hex. */
const SHA256 = /^[0-9a-f]{64}$/;

/** One reviewed exception: a path glob, a rule, and the sha256 of the exact evidence. */
export interface Allowance {
  readonly path: string;
  readonly rule: RuleName;
  readonly sha256: string;
  readonly why: string;
}

/** The parsed config. */
export interface PrivacyConfig {
  /** Whether the project has a config file at all. */
  readonly found: boolean;
  readonly banned: BannedTerms;
  readonly allow: readonly Allowance[];
}

/** Whether `value` is a non-empty string. */
function isText(value: unknown): value is string {
  return typeof value === 'string' && value.trim() !== '';
}

/** Whether `value` names one of the gate's rules. */
function isRuleName(value: unknown): value is RuleName {
  return (RULE_NAMES as readonly unknown[]).includes(value);
}

/** One banned entry, checked, as a map pair. */
function parseBanned(entry: unknown, index: number): [string, string] {
  const { sha256, label } = (entry ?? {}) as Record<string, unknown>;
  if (!isText(sha256) || !SHA256.test(sha256)) throw new Error(`${CONFIG_FILE}: banned[${index}].sha256 must be a lowercase sha256`);
  if (!isText(label)) throw new Error(`${CONFIG_FILE}: banned[${index}].label must name the term without spelling it`);
  return [sha256, label];
}

/** One allow entry, checked. */
function parseAllowance(entry: unknown, index: number): Allowance {
  const { path, rule, sha256, why } = (entry ?? {}) as Record<string, unknown>;
  if (!isText(path)) throw new Error(`${CONFIG_FILE}: allow[${index}].path must be a glob`);
  if (!isRuleName(rule)) throw new Error(`${CONFIG_FILE}: allow[${index}].rule must be one of ${RULE_NAMES.join(', ')}`);
  if (!isText(sha256) || !SHA256.test(sha256)) throw new Error(`${CONFIG_FILE}: allow[${index}].sha256 must be a lowercase sha256`);
  if (!isText(why)) throw new Error(`${CONFIG_FILE}: allow[${index}].why must say why the value is meant`);
  return { path, rule, sha256, why };
}

/** A list field of the config, or an empty list when it is absent. */
function listField(config: Record<string, unknown>, field: string): unknown[] {
  const value = config[field];
  if (value === undefined) return [];
  if (!Array.isArray(value)) throw new Error(`${CONFIG_FILE}: ${field} must be a list`);
  return value;
}

/** Parses the text of a config file. */
export function parsePrivacyConfig(text: string): PrivacyConfig {
  const parsed = JSON.parse(text) as unknown;
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error(`${CONFIG_FILE}: must hold a JSON object`);
  const config = parsed as Record<string, unknown>;
  const unknown = Object.keys(config).filter((key) => !KNOWN_KEYS.has(key));
  if (unknown.length > 0) throw new Error(`${CONFIG_FILE}: unknown key ${unknown.join(', ')}; it holds only banned, allow and $comment`);
  return {
    found: true,
    banned: new Map(listField(config, 'banned').map(parseBanned)),
    allow: listField(config, 'allow').map(parseAllowance),
  };
}

/** The config of a project with no config file. */
export const NO_CONFIG: PrivacyConfig = { found: false, banned: new Map(), allow: [] };

/** Reads `.privacy-gate.json` from `root`, or an empty config when there is none. */
export function readPrivacyConfig(root: string): PrivacyConfig {
  const path = join(root, CONFIG_FILE);
  if (!existsSync(path)) return NO_CONFIG;
  return parsePrivacyConfig(readFileSync(path, 'utf8'));
}
