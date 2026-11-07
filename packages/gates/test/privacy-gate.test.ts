/**
 * Planted controls for the privacy rules. Each rule must fire on a
 * planted value and stay quiet on its clean neighbour, so an empty report
 * from the gate means "nothing found", never "a rule stopped matching".
 * Planted values are assembled from fragments, so this file itself passes
 * the gate.
 */
import { describe, expect, it } from 'bun:test';

import { parsePrivacyConfig } from '../src/privacy-config';
import { judge } from '../src/privacy-gate';
import { bannedIn, isSamplePath, scan, sha256 } from '../src/privacy-rules';

/** The rule names one scan of `text` at `path` reports. */
function rules(path: string, text: string): string[] {
  return scan(path, text).map((finding) => finding.rule);
}

const at = '@';

/** Planted sample values, joined at run time so the source never holds them whole. */
const scheme = ['https:', '//'].join('');
const plantedAvatar = `avatar: '${scheme}i.pravatar.cc/150'`;
const plantedPhone = `phone: '${['+1', '415', '867', '5309'].join(' ')}'`;
const plantedProfile = `link: '${['github', 'com'].join('.')}/someone'`;
const plantedFont = `url: '${scheme}fonts.googleapis.com'`;

describe('banned terms', () => {
  const planted = new Map([[sha256('example-banned'), 'the planted term']]);

  it('finds a planted term on a word boundary, in any case', () => {
    expect(bannedIn('host: Example-Banned.org', planted)).toEqual(['the planted term']);
    expect(bannedIn('path x/example-banned/y', planted)).toEqual(['the planted term']);
  });

  it('ignores the term inside a longer word', () => {
    expect(bannedIn('anexample-banned', planted)).toEqual([]);
  });

  it('finds nothing with the default, empty list', () => {
    expect(bannedIn('host: example-banned.org')).toEqual([]);
  });
});

describe('shapes on every file', () => {
  it('finds a home path with its account segment', () => {
    expect(rules('src/a.ts', `const p = '/Users/${'someone'}/x';`)).toContain('home-path');
    expect(rules('src/a.ts', `cd /home/${'someone'}`)).toContain('home-path');
  });

  it('ignores a home root with no account, and a URL path', () => {
    expect(rules('src/a.ts', 'see ~/.config and https://example.com/home/index')).not.toContain('home-path');
  });

  it('finds a private address and a public one', () => {
    expect(rules('src/a.ts', `host = '192.168.${'1'}.20'`)).toContain('ip-address');
    expect(rules('src/a.ts', `host = '8.8.${'4'}.4'`)).toContain('ip-address');
  });

  it('ignores loopback, documentation ranges, versions and SVG path data', () => {
    expect(rules('src/a.ts', 'serve(\'127.0.0.1\') and 192.0.2.10')).not.toContain('ip-address');
    expect(rules('src/a.ts', 'react@19.2.3')).not.toContain('ip-address');
    expect(rules('src/a.tsx', '<path d="M12 .5a12 12 0 00-3.2.8.8" />')).not.toContain('ip-address');
  });

  it('ignores a property chain that ends like a LAN suffix', () => {
    expect(rules('src/a.ts', 'imported.add(specifier.local.name);')).not.toContain('lan-host');
    expect(rules('src/a.ts', 'config.internal(x)')).not.toContain('lan-host');
  });

  it('finds a LAN host name', () => {
    expect(rules('src/a.ts', `host: build-box.${'local'}`)).toContain('lan-host');
  });

  it('finds a credential prefix with a key-like body', () => {
    expect(rules('src/a.ts', `token = 'gh${'p'}_${'a'.repeat(30)}'`)).toContain('credential');
  });

  it('finds an email on a real domain, and allows the reserved ones', () => {
    expect(rules('src/a.ts', `mail: 'jo${at}gmail.com'`)).toContain('email');
    expect(rules('src/a.ts', `mail: 'jo${at}example.dev'`)).toContain('email');
    expect(rules('src/a.ts', `mail: 'jo${at}example.com' or 'x${at}team.test'`)).not.toContain('email');
  });

  it('ignores a scoped package version that looks like an address', () => {
    expect(rules('bun.lock', `"${at}babel/core${at}7.29.7"`)).not.toContain('email');
  });
});

describe('sample data', () => {
  it('knows which paths hold samples', () => {
    expect(isSamplePath('src/atoms/Button/Button.stories.tsx')).toBe(true);
    expect(isSamplePath('src/stories/shell-fixtures.tsx')).toBe(true);
    expect(isSamplePath('src/lib/fixtures.ts')).toBe(true);
    expect(isSamplePath('src/atoms/Button/Button.tsx')).toBe(false);
  });

  it('finds a real host, a phone number and a profile link in a sample', () => {
    const path = 'src/stories/people.tsx';

    expect(rules(path, plantedAvatar)).toContain('sample-url');
    expect(rules(path, plantedPhone)).toContain('sample-phone');
    expect(rules(path, plantedProfile)).toContain('profile-link');
  });

  it('allows reserved hosts and the fictional phone range in a sample', () => {
    const path = 'src/stories/people.tsx';

    expect(rules(path, 'href: \'https://example.com/docs\'')).toEqual([]);
    expect(rules(path, 'phone: \'+1 202 555 0142\'')).toEqual([]);
  });

  it('leaves the sample rules off outside sample paths', () => {
    expect(rules('src/lib/fonts.ts', plantedFont)).toEqual([]);
  });
});

describe('the project config', () => {
  const hash = sha256('example-banned');
  const evidence = `jo${at}gmail.com`;

  it('reads banned terms and reviewed exceptions', () => {
    const config = parsePrivacyConfig(JSON.stringify({
      banned: [{ sha256: hash, label: 'the planted term' }],
      allow: [{ path: 'package.json', rule: 'email', sha256: sha256(evidence), why: 'the author field' }],
    }));

    expect(config.banned.get(hash)).toBe('the planted term');
    expect(config.allow).toHaveLength(1);
  });

  it('refuses a banned entry that is not a hash', () => {
    expect(() => parsePrivacyConfig(JSON.stringify({ banned: [{ sha256: 'example-banned', label: 'x' }] }))).toThrow('sha256');
  });

  it('refuses an allow entry with no reason', () => {
    expect(() => parsePrivacyConfig(JSON.stringify({ allow: [{ path: 'a', rule: 'email', sha256: hash }] }))).toThrow('why');
  });

  it('refuses a config that is not an object', () => {
    expect(() => parsePrivacyConfig('[]')).toThrow('object');
  });

  it('refuses an unknown top-level key, which would leave a list empty', () => {
    expect(() => parsePrivacyConfig(JSON.stringify({ ban: [] }))).toThrow('unknown key ban');
  });

  it('refuses an allow entry whose rule does not exist', () => {
    expect(() => parsePrivacyConfig(JSON.stringify({ allow: [{ path: 'a', rule: 'emial', sha256: hash, why: 'x' }] }))).toThrow('rule must be one of');
  });

  it('reports a banned term by its label and passes an allowed value', () => {
    const config = parsePrivacyConfig(JSON.stringify({
      banned: [{ sha256: hash, label: 'the planted term' }],
      allow: [{ path: 'package.json', rule: 'email', sha256: sha256(evidence), why: 'the author field' }],
    }));
    const report = judge([
      { name: 'src/a.ts', path: 'src/a.ts', text: 'host: example-banned.org' },
      { name: 'package.json', path: 'package.json', text: `"author": "${evidence}"` },
    ], config);

    expect(report).toEqual(['src/a.ts:1  banned-term  the planted term']);
  });

  it('still reports the allowed value at another path', () => {
    const config = parsePrivacyConfig(JSON.stringify({
      allow: [{ path: 'package.json', rule: 'email', sha256: sha256(evidence), why: 'the author field' }],
    }));
    const report = judge([{ name: 'src/a.ts', path: 'src/a.ts', text: `mail: '${evidence}'` }], config);

    expect(report).toHaveLength(1);
  });
});
