# authframework-site

Source of authframework.dev, the website for the [auth-framework](https://github.com/ciresnave/auth-framework) Rust crate.

`docs/DESIGN.md` lists the pages and the source behind each claim; the site is written only from that list.
Built so far: home, maturity and security pages. Versions and advisories are read from crates.io and the GHSA API at
build time (the build fails if either cannot be read). Features and Install pages are not built yet.

    npm ci
    npm run build     # needs network: crates.io, GHSA API, docs.rs
    npx playwright test

Every name lives in `src/config.ts`. Every fact element carries a `data-claim` id from `src/claims.ts`
(`tests/claims.spec.ts` fails the build on one that does not).

Licence: MIT OR Apache-2.0 (`LICENSE-MIT`, `LICENSE-APACHE`).
