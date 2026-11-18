import { gunzipSync } from 'node:zlib';
import { SITE } from '../config.ts';

// Features facts come from the PUBLISHED tarball of the version the site describes
// (docs/DESIGN.md "Features" rows), never from `main`. Any failure THROWS: no stale fallback.
const UA = `${SITE.domain}-build (+https://github.com/ciresnave/authframework-site)`;

export interface TarEntry {
  path: string;
  body: Buffer;
}

const field = (h: Buffer, from: number, len: number) => h.subarray(from, from + len).toString('utf8').replace(/\0.*$/s, '');

// A minimal ustar/PAX reader: regular files only, which is all a .crate holds.
export function readTar(tar: Buffer): TarEntry[] {
  const out: TarEntry[] = [];
  let off = 0;
  let paxPath: string | null = null;
  while (off + 512 <= tar.length) {
    const h = tar.subarray(off, off + 512);
    if (h.every((b) => b === 0)) break;
    const size = parseInt(field(h, 124, 12).trim() || '0', 8);
    if (!Number.isFinite(size)) throw new Error('tar: unreadable size field');
    const type = String.fromCharCode(h[156]);
    const body = tar.subarray(off + 512, off + 512 + size);
    off += 512 + Math.ceil(size / 512) * 512;
    if (type === 'x') {
      const m = /\d+ path=([^\n]*)\n/.exec(body.toString('utf8'));
      paxPath = m ? m[1] : null;
      continue;
    }
    if (type === 'g') continue;
    if (type !== '0' && type !== '\0') continue;
    const prefix = field(h, 345, 155);
    const path = paxPath ?? (prefix ? `${prefix}/${field(h, 0, 100)}` : field(h, 0, 100));
    paxPath = null;
    out.push({ path, body: Buffer.from(body) });
  }
  return out;
}

export interface ProtocolRow {
  protocol: string;
  standard: string;
  module: string; // "core" or a path inside the crate
  flag: string | null;
}
export interface Features {
  version: string;
  protocols: ProtocolRow[];
  // feature flags read from Cargo.toml [features]
  flags: string[];
  defaultFlags: string[];
  samlNote: string | null; // the sentence PROTOCOLS.md prints about SAML, or null
}

const clean = (s: string) => s.replace(/`/g, '').trim();
const isRule = (c: string) => /^[-: ]+$/.test(c);

export function parseProtocols(md: string): ProtocolRow[] {
  const rows: ProtocolRow[] = [];
  let inTable = false;
  for (const line of md.split(/\r?\n/)) {
    if (!line.trim().startsWith('|')) {
      inTable = false;
      continue;
    }
    const cells = line.trim().replace(/^\||\|$/g, '').split('|').map((c) => c.trim());
    if (cells.length < 4) continue;
    if (/^protocol$/i.test(cells[0])) {
      inTable = true;
      continue;
    }
    if (!inTable || cells.every(isRule)) continue;
    const flag = clean(cells[3]);
    rows.push({
      protocol: cells[0],
      standard: cells[1] === '—' ? '' : cells[1],
      module: clean(cells[2]),
      flag: /^(—|-)/.test(flag) ? null : flag,
    });
  }
  if (rows.length === 0) throw new Error('PROTOCOLS.md: no protocol table found');
  return rows;
}

export function parseFeatures(toml: string): { flags: string[]; defaultFlags: string[] } {
  const m = /^\[features\]\r?\n([\s\S]*?)(?=^\[)/m.exec(toml + '\n[end]');
  if (!m) throw new Error('Cargo.toml: no [features] table');
  const flags: string[] = [];
  let defaultFlags: string[] = [];
  const re = /^([A-Za-z0-9_-]+)\s*=\s*\[([\s\S]*?)\]/gm;
  for (const k of m[1].matchAll(re)) {
    flags.push(k[1]);
    if (k[1] === 'default') defaultFlags = [...k[2].matchAll(/"([^"]+)"/g)].map((x) => x[1]);
  }
  return { flags, defaultFlags };
}

export function samlNote(md: string): string | null {
  const line = md.split(/\r?\n/).find((l) => /`saml`/.test(l) && /Linux\/macOS only/.test(l));
  return line ? 'Linux/macOS only for now (not Windows)' : null;
}

// Every module path PROTOCOLS.md names must exist in the tarball (DESIGN "Checked"). A path
// is a file, or a directory when some entry sits under it. `core` is not a path.
export function missingPaths(rows: ProtocolRow[], entries: string[], root: string): string[] {
  const missing: string[] = [];
  for (const r of rows) {
    if (r.module === 'core' || !r.module.startsWith('src/')) continue;
    const want = `${root}/${r.module}`;
    const dir = want.endsWith('/') ? want : `${want}/`;
    if (!entries.some((e) => e === want || e.startsWith(dir))) missing.push(r.module);
  }
  return missing;
}

export function featuresFrom(entries: TarEntry[], version: string): Features {
  const root = `${SITE.crateName}-${version}`;
  const get = (name: string) => {
    const e = entries.find((x) => x.path === `${root}/${name}`);
    if (!e) throw new Error(`${name} is not in the published tarball of ${version}`);
    return e.body.toString('utf8');
  };
  const md = get('PROTOCOLS.md');
  const protocols = parseProtocols(md);
  const missing = missingPaths(protocols, entries.map((e) => e.path), root);
  if (missing.length) throw new Error(`PROTOCOLS.md names paths absent from ${version}: ${missing.join(', ')}`);
  return { version, protocols, ...parseFeatures(get('Cargo.toml')), samlNote: samlNote(md) };
}

const memo = new Map<string, Promise<Features>>();
export function features(version: string): Promise<Features> {
  let p = memo.get(version);
  if (!p) {
    p = (async () => {
      const res = await fetch(`https://static.crates.io/crates/${SITE.crateName}/${SITE.crateName}-${version}.crate`, {
        headers: { 'user-agent': UA },
      });
      if (!res.ok) throw new Error(`tarball for ${version} returned ${res.status}; refusing to build without it`);
      return featuresFrom(readTar(gunzipSync(Buffer.from(await res.arrayBuffer()))), version);
    })();
    memo.set(version, p);
  }
  return p;
}
