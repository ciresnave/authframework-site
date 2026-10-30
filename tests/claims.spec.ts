import { test, expect } from '@playwright/test';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { CLAIMS } from '../src/claims.ts';

// docs/DESIGN.md: "every sentence that states a fact is tagged in the source with the row of
// the table above; CI fails on an untagged fact line", and the test "ships with a deliberately
// untagged control". This reads the BUILT output, so a sentence assembled in a component is
// caught as well as one typed into a page.
//
// A "fact element" is a <p>, <li>, <tr> or <caption> inside <main>. Each must carry
// data-claim="<id>" with an id listed in src/claims.ts.
const DIST = join(process.cwd(), 'dist');
const walk = (d: string): string[] =>
  readdirSync(d).flatMap((n) => {
    const p = join(d, n);
    return statSync(p).isDirectory() ? walk(p) : [p];
  });
const pages = walk(DIST).filter((p) => p.endsWith('.html'));
const rel = (p: string) => p.replace(DIST, '').replace(/\\/g, '/');

export function untagged(html: string): string[] {
  const main = /<main\b[\s\S]*?<\/main>/i.exec(html)?.[0] ?? '';
  const offenders: string[] = [];
  for (const m of main.matchAll(/<(p|li|tr|caption)\b([^>]*)>/gi)) {
    const id = /\sdata-claim="([^"]*)"/.exec(m[2])?.[1];
    if (!id) offenders.push(`<${m[1]}> has no data-claim`);
    else if (!(CLAIMS as readonly string[]).includes(id)) offenders.push(`<${m[1]}> data-claim="${id}" is not in src/claims.ts`);
  }
  return offenders;
}

// Words DESIGN.md "Words the site will not copy from the README" rules out.
const BANNED: RegExp[] = [
  /most complete/i,
  /unmatched/i,
  /zero[\s-]trust/i,
  /best choice/i,
  /production[\s-]grade/i,
  /\b\d+\+\s*protocols/i,
  /\b[\d,]+\+?\s*tests\b/i,
  /coming soon/i,
  /sandbox/i,
];

test('the build produced the pages this spec reads (positive control)', () => {
  expect(pages.map(rel)).toEqual(expect.arrayContaining(['/index.html', '/maturity/index.html', '/security/index.html', '/404.html']));
});

test('the scanner flags a deliberately untagged fact line (control)', () => {
  expect(untagged('<main><p>Supports 34 protocols.</p></main>')).toHaveLength(1);
  expect(untagged('<main><p data-claim="made-up">x</p></main>')).toHaveLength(1);
  expect(untagged('<main><p data-claim="home-licence">x</p></main>')).toEqual([]);
  expect(untagged('<main></main>')).toEqual([]);
});

for (const page of pages) {
  test(`${rel(page)}: every fact element is tagged with a DESIGN row`, () => {
    expect(untagged(readFileSync(page, 'utf8'))).toEqual([]);
  });

  test(`${rel(page)}: no word DESIGN.md rules out`, () => {
    const text = readFileSync(page, 'utf8').replace(/<[^>]+>/g, ' ');
    expect(BANNED.filter((re) => re.test(text)).map(String)).toEqual([]);
  });
}

test('the "ui" id (no fact) appears only on the 404 page', () => {
  const users = pages.filter((p) => /data-claim="ui"/.test(readFileSync(p, 'utf8'))).map(rel);
  expect(users).toEqual(['/404.html']);
});

test('no third-party script or link reaches the built output', () => {
  const offenders: string[] = [];
  for (const p of pages) {
    const html = readFileSync(p, 'utf8');
    for (const m of html.matchAll(/<script\b[^>]*>/gi)) offenders.push(`${rel(p)}: ${m[0]}`);
    for (const m of html.matchAll(/(?:src|href)="(https?:\/\/[^"]+)"/gi)) {
      const host = new URL(m[1]).hostname;
      if (!['github.com', 'docs.rs', 'crates.io', 'authframework.dev'].includes(host)) offenders.push(`${rel(p)}: ${m[1]}`);
    }
  }
  expect(offenders).toEqual([]);
});
