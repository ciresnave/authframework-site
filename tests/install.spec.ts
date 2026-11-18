import { test, expect } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

// /install shows a RECORDED run. These pin what DESIGN.md "Install" rows promise.
const html = readFileSync(join(process.cwd(), 'dist', 'install', 'index.html'), 'utf8');
const text = html.replace(/<[^>]+>/g, ' ').replace(/&#34;|&quot;/g, '"');

test('the recorded output and the README failure are both on the page (positive control)', () => {
  expect(text).toContain('Token is valid!');
  expect(text).toContain('is yanked');
  expect(text).toContain('User has permission to read documents');
});

test('no crate version is written except the README pin the page quotes', () => {
  const rcs = [...text.matchAll(/rc\d+/g)].map((m) => m[0]);
  expect(rcs.length).toBeGreaterThan(0); // control: the README pin is there, so the scan can see rc strings
  expect(new Set(rcs)).toEqual(new Set(['rc85']));
});

test('the scan would catch a leaked version (control)', () => {
  expect([...'cargo add auth-framework 0.6.0-rc217'.matchAll(/rc\d+/g)].map((m) => m[0])).toEqual(['rc217']);
});

test('the redacted recording holds no home-directory path', () => {
  const rec = readFileSync(join(process.cwd(), 'docs', 'recordings', 'QUICKSTART-RECORDING-2026-11-18.txt'), 'utf8');
  expect(rec).not.toMatch(/C:\Users|AppData|scratchpad/i);
  expect(rec).toContain('Token is valid!'); // control: it is the real recording
});
