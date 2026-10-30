import { test, expect } from '@playwright/test';
import { compare, summarise } from '../src/lib/crates.ts';
import { parse } from '../src/lib/advisories.ts';

// The build-time readers, tested on fixtures (no network). The failure paths matter most:
// DESIGN says a yanked version is never offered and an unreadable API fails the build.
const v = (num: string, yanked = false) => ({ num, yanked, created_at: '2026-01-01', license: 'MIT OR Apache-2.0', rust_version: '1.95' });
const api = (versions: ReturnType<typeof v>[]) => ({
  crate: { name: 'auth-framework', description: 'd', max_stable_version: '0.4.45', repository: null },
  versions,
});

test('rc10 sorts above rc9, and a release above its own rc', () => {
  expect(compare('0.6.0-rc10', '0.6.0-rc9')).toBeGreaterThan(0);
  expect(compare('0.6.0', '0.6.0-rc99')).toBeGreaterThan(0);
  expect(compare('0.5.0-rc79', '0.6.0-rc1')).toBeLessThan(0);
});

test('the newest version is chosen, and a yanked one is never offered', () => {
  const info = summarise(api([v('0.6.0-rc173', true), v('0.6.0-rc172'), v('0.4.45')]), null);
  expect(info.current).toBe('0.6.0-rc172');
  // control: the same input without the yank offers the newer one
  expect(summarise(api([v('0.6.0-rc173'), v('0.6.0-rc172')]), null).current).toBe('0.6.0-rc173');
});

test('lines are grouped by major.minor with stable vs release candidate', () => {
  const { lines } = summarise(api([v('0.6.0-rc173'), v('0.5.0-rc79'), v('0.4.45'), v('0.4.44')]), null);
  expect(lines).toEqual([
    { line: '0.6', newest: '0.6.0-rc173', stable: false },
    { line: '0.5', newest: '0.5.0-rc79', stable: false },
    { line: '0.4', newest: '0.4.45', stable: true },
  ]);
});

test('a pin to a yanked or unknown version throws', () => {
  expect(() => summarise(api([v('0.6.0-rc1', true), v('0.4.45')]), '0.6.0-rc1')).toThrow();
  expect(() => summarise(api([]), null)).toThrow();
});

test('only published advisories are listed; a non-list throws', () => {
  const rows = [
    { state: 'published', ghsa_id: 'GHSA-aaaa', html_url: 'https://github.com/x', summary: 's', severity: 'high', published_at: '2026-10-01T00:00:00Z' },
    { state: 'draft', ghsa_id: 'GHSA-bbbb', html_url: 'https://github.com/y', summary: 't', severity: 'low' },
  ];
  expect(parse(rows).map((a) => a.id)).toEqual(['GHSA-aaaa']);
  expect(() => parse({ message: 'rate limited' })).toThrow();
});
