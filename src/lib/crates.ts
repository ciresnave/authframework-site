import { SITE } from '../config.ts';

// Read from the crates.io API at build time. Any failure THROWS: the site never falls back
// to a stale or hand-copied version (docs/DESIGN.md "Versions the site may name").
const UA = `${SITE.domain}-build (+https://github.com/ciresnave/authframework-site)`;

interface ApiVersion {
  num: string;
  yanked: boolean;
  created_at: string;
  license: string | null;
  rust_version: string | null;
  edition?: string | null;
}
interface ApiCrate {
  crate: { name: string; description: string | null; max_stable_version: string | null; repository: string | null };
  versions: ApiVersion[];
}

export interface Line {
  line: string; // "0.6" — major.minor
  newest: string;
  stable: boolean;
}
export interface CrateInfo {
  name: string;
  description: string;
  current: string; // the version the site describes
  license: string;
  rustVersion: string | null;
  maxStable: string | null;
  lines: Line[];
  docsLinks: { version: string; href: string }[];
}

const isPre = (v: string) => v.includes('-');
const parts = (v: string) => v.split('-')[0].split('.').map(Number);
// rc10 > rc9: compare the numeric tail of the pre-release tag.
const preNum = (v: string) => Number(/(\d+)$/.exec(v.split('-')[1] ?? '')?.[1] ?? 0);
export function compare(a: string, b: string): number {
  const [pa, pb] = [parts(a), parts(b)];
  for (let i = 0; i < 3; i++) if (pa[i] !== pb[i]) return pa[i] - pb[i];
  if (isPre(a) !== isPre(b)) return isPre(a) ? -1 : 1;
  return preNum(a) - preNum(b);
}

export function summarise(api: ApiCrate, pin: string | null = SITE.crateVersionPin): CrateInfo {
  const live = api.versions.filter((v) => !v.yanked); // a yanked version is never offered
  if (live.length === 0) throw new Error('crates.io lists no un-yanked version');
  const sorted = [...live].sort((a, b) => compare(b.num, a.num));
  const chosen = pin ? live.find((v) => v.num === pin) : sorted[0];
  if (!chosen) throw new Error(`crateVersionPin ${pin} is not a live published version`);
  const byLine = new Map<string, Line>();
  for (const v of sorted) {
    const key = parts(v.num).slice(0, 2).join('.');
    const cur = byLine.get(key);
    if (!cur) byLine.set(key, { line: key, newest: v.num, stable: !isPre(v.num) });
    else if (!cur.stable && !isPre(v.num)) byLine.set(key, { line: key, newest: v.num, stable: true });
  }
  return {
    name: api.crate.name,
    description: api.crate.description ?? '',
    current: chosen.num,
    license: chosen.license ?? '',
    rustVersion: chosen.rust_version,
    maxStable: api.crate.max_stable_version,
    lines: [...byLine.values()],
    docsLinks: [],
  };
}

let memo: Promise<CrateInfo> | undefined;
export function crateInfo(): Promise<CrateInfo> {
  memo ??= (async () => {
    const res = await fetch(`https://crates.io/api/v1/crates/${SITE.crateName}`, { headers: { 'user-agent': UA } });
    if (!res.ok) throw new Error(`crates.io returned ${res.status}; refusing to build with a stale version`);
    const info = summarise((await res.json()) as ApiCrate);
    // Only a docs.rs page that answers 200 is linked; one that has not built yet is omitted.
    const names = new Set([info.current, ...(info.maxStable ? [info.maxStable] : [])]);
    for (const version of names) {
      const href = `https://docs.rs/${SITE.crateName}/${version}`;
      const r = await fetch(href, { method: 'HEAD', headers: { 'user-agent': UA } });
      if (r.status === 200) info.docsLinks.push({ version, href });
    }
    return info;
  })();
  return memo;
}
