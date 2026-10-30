# Changelog

Versions follow the portfolio rule: every pushed change bumps the version; pre-1.0 the second number is the
breaking-change number. The PM allocates the number at gate time.

## 0.1.0

- Astro scaffold per `docs/DESIGN.md`: home, maturity and security pages, a 404, and `src/config.ts` as the one
  place names live. Versions and the advisory list are read from crates.io and the GHSA API at build time; the
  build fails if either cannot be read.
- Four CI jobs on hosted runners (tree-freshness guard, `astro check`, `astro build`, Playwright + axe), actions pinned to SHAs.
- `tests/claims.spec.ts`: every fact element must carry a `data-claim` id from `src/claims.ts`, with a deliberately untagged control.
- Not yet: Features and Install pages (need the pinned version's tarball and a recorded quickstart run).
