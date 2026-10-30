// One id per row of the table in docs/DESIGN.md ("Pages and the source behind each claim").
// A sentence that states a fact carries `data-claim="<id>"`; tests/claims.spec.ts fails the
// build on a fact element with no id, or with an id that is not listed here. Adding a row
// here is a DESIGN.md change first.
export const CLAIMS = [
  'home-description',
  'home-licence',
  'home-rust-version',
  'maturity-lines',
  'security-advisories',
  'security-reporting',
  'docs-links',
  // Interface text that states no fact about the crate. Allowed only on /404 (tests/claims.spec.ts).
  'ui',
] as const;
export type ClaimId = (typeof CLAIMS)[number];
