# Changelog

Versions follow the portfolio rule: every pushed change bumps the version; pre-1.0 the second number is the
breaking-change number. The PM allocates the number at gate time.

## 0.1.3 - 2026-11-18

Number provisional until the PM allocates it at the gate.

- Features page (`/features`): the protocol table, storage and web-integration flags and the SAML platform note, read at build time from the published tarball of the version the site names (`src/lib/tarball.ts`). The build fails if the tarball cannot be read or if a `src/` module path `PROTOCOLS.md` names is absent from it.
- `docs/DESIGN.md` Features rows updated: `FEATURE_FLAGS.md` is not in the rc217 tarball, so storage and web rows read `Cargo.toml` `[features]` and the SAML row reads `PROTOCOLS.md`. Four claim ids added (`features-*`).
- Install page still waits for a recorded quickstart run (this lane runs no cargo; asked the PM).

## 0.1.2 - 2026-11-16

- dependencies: astro 7.4.4 -> 7.4.7 (dependabot #4).

## 0.1.1 - 2026-11-16

CI only; number provisional until the PM stamps it at the gate (no version files touched).

- CI workflow: the advisory CodeRipper `portfolio` job moves to the shared workflow at coderipper c72a6e0 (0.47.5). No `.coderipper.toml` or rule-name references here, so the rule-id migration changed nothing.

## 0.1.0

- (fixed before merge) long advisory text no longer overflows at 360px wide.

- Astro scaffold per `docs/DESIGN.md`: home, maturity and security pages, a 404, and `src/config.ts` as the one
  place names live. Versions and the advisory list are read from crates.io and the GHSA API at build time; the
  build fails if either cannot be read.
- Four CI jobs on hosted runners (tree-freshness guard, `astro check`, `astro build`, Playwright + axe), actions pinned to SHAs.
- `tests/claims.spec.ts`: every fact element must carry a `data-claim` id from `src/claims.ts`, with a deliberately untagged control.
- Not yet: Features and Install pages (need the pinned version's tarball and a recorded quickstart run).
