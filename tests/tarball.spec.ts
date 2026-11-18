import { test, expect } from '@playwright/test';
import { featuresFrom, missingPaths, parseFeatures, parseProtocols, readTar, samlNote } from '../src/lib/tarball.ts';

// The tarball reader, on fixtures (no network). A hand-built ustar archive stands in for a .crate.
function tar(files: Record<string, string>): Buffer {
  const blocks: Buffer[] = [];
  for (const [name, text] of Object.entries(files)) {
    const body = Buffer.from(text);
    const h = Buffer.alloc(512);
    h.write(name, 0, 100, 'utf8');
    h.write(body.length.toString(8).padStart(11, '0'), 124, 'ascii');
    h[156] = '0'.charCodeAt(0);
    blocks.push(h, body, Buffer.alloc((512 - (body.length % 512)) % 512));
  }
  blocks.push(Buffer.alloc(1024));
  return Buffer.concat(blocks);
}

const MD = `# P
| Protocol | Standard | Module | Feature Flag |
| --- | --- | --- | --- |
| OAuth 2.0 | RFC 6749 | core | — (always) |
| SAML 2.0 | OASIS | \`src/protocols/saml.rs\` | \`saml\` |
| OIDC | Core | \`src/server/oidc/\` | — |

- **\`saml\`** — assertions. **Linux/macOS only for now** (not Windows)
`;
const TOML = `[package]\nname = "x"\n\n[features]\ndefault = [\n    "postgres-storage",\n]\npostgres-storage = ["dep:sqlx"]\nsqlite-storage = []\n\n[dependencies]\n`;
const root = 'auth-framework-1.0.0';
const crate = () =>
  readTar(tar({ [`${root}/PROTOCOLS.md`]: MD, [`${root}/Cargo.toml`]: TOML, [`${root}/src/protocols/saml.rs`]: '', [`${root}/src/server/oidc/mod.rs`]: '' }));

test('readTar returns each file with its path and body', () => {
  const e = crate();
  expect(e.map((x) => x.path)).toContain(`${root}/Cargo.toml`);
  expect(e.find((x) => x.path.endsWith('PROTOCOLS.md'))?.body.toString()).toBe(MD);
});

test('the protocol table is parsed row by row, header and rule rows skipped', () => {
  const rows = parseProtocols(MD);
  expect(rows.map((r) => r.protocol)).toEqual(['OAuth 2.0', 'SAML 2.0', 'OIDC']);
  expect(rows[1]).toMatchObject({ module: 'src/protocols/saml.rs', flag: 'saml' });
  expect(rows[0].flag).toBeNull();
  expect(() => parseProtocols('no table here')).toThrow();
});

test('features come from Cargo.toml, default flags separately', () => {
  expect(parseFeatures(TOML)).toEqual({ flags: ['default', 'postgres-storage', 'sqlite-storage'], defaultFlags: ['postgres-storage'] });
  expect(() => parseFeatures('[package]\nname = "x"\n')).toThrow();
});

test('the SAML note appears only when the file says so (control: without the line, null)', () => {
  expect(samlNote(MD)).not.toBeNull();
  expect(samlNote('| SAML | x | y | `saml` |')).toBeNull();
});

test('a module path absent from the tarball is reported, a directory path counts (control)', () => {
  const entries = crate().map((e) => e.path);
  const rows = parseProtocols(MD);
  expect(missingPaths(rows, entries, root)).toEqual([]);
  expect(missingPaths([...rows, { protocol: 'X', standard: '', module: 'src/protocols/nope.rs', flag: null }], entries, root)).toEqual(['src/protocols/nope.rs']);
});

test('featuresFrom throws when a named path is missing or a file is absent', () => {
  expect(featuresFrom(crate(), '1.0.0').protocols).toHaveLength(3);
  expect(() => featuresFrom(crate().filter((e) => !e.path.endsWith('saml.rs')), '1.0.0')).toThrow(/absent/);
  expect(() => featuresFrom(crate().filter((e) => !e.path.endsWith('Cargo.toml')), '1.0.0')).toThrow(/not in the published tarball/);
});
