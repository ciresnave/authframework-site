import { SITE } from '../config.ts';

// Rendered from the GHSA API at build time, `state: published` only. Nothing is listed,
// named or linked from a snapshot (docs/DESIGN.md "Security"). Any failure THROWS.
export interface Advisory {
  id: string;
  url: string;
  summary: string;
  severity: string;
  published: string;
}

export function parse(rows: unknown): Advisory[] {
  if (!Array.isArray(rows)) throw new Error('GHSA API did not return a list');
  return rows
    .filter((r) => r.state === 'published')
    .map((r) => ({
      id: String(r.ghsa_id),
      url: String(r.html_url),
      summary: String(r.summary),
      severity: String(r.severity ?? 'unrated'),
      published: String(r.published_at ?? '').slice(0, 10),
    }));
}

let memo: Promise<Advisory[]> | undefined;
export function advisories(): Promise<Advisory[]> {
  memo ??= (async () => {
    const headers: Record<string, string> = {
      accept: 'application/vnd.github+json',
      'user-agent': `${SITE.domain}-build`,
    };
    if (process.env.GITHUB_TOKEN) headers.authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
    const res = await fetch(
      `https://api.github.com/repos/${SITE.repoSlug}/security-advisories?state=published&per_page=100`,
      { headers },
    );
    if (!res.ok) throw new Error(`GHSA API returned ${res.status}; refusing to build a Security page from nothing`);
    return parse(await res.json());
  })();
  return memo;
}
