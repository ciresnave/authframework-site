// The ONE place every name lives (docs/DESIGN.md "Naming"). The product is being renamed
// AuthAnt after the advisory work: that is an edit to `productName` and `domain` here, and
// pages read these fields, never a literal. `crateName`, `repoUrl` and `crateVersionPin` are
// identifiers, not brand: published versions stay under the old crate name.
export const SITE = {
  productName: 'auth-framework',
  domain: 'authframework.dev',
  repoUrl: 'https://github.com/ciresnave/auth-framework',
  repoSlug: 'ciresnave/auth-framework',
  crateName: 'auth-framework',
  // null = the newest published version, read from crates.io at build time. A pin is a
  // reviewed exception, never a hand-copied "latest".
  crateVersionPin: null as string | null,
};

export const NAV: { label: string; href: string }[] = [
  { label: 'Maturity', href: '/maturity' },
  { label: 'Security', href: '/security' },
];
