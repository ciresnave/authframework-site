# authframework.dev — design note (first PR; no site code yet)

Task from the PM, 2026-10-17 (board 228 addendum). CireSnave owns the domain. This note is reviewed before any site code
exists. Nothing on the site is written until its source is in the table below.

## What this site is

A small static Astro site on Cloudflare Pages (P2, Git integration; project `authframework-site`; CireSnave does the
dashboard click-through) that describes the `auth-framework` crate. **It describes the published crate, not `main`.** Facts
below were first read on 2026-10-17 from `ciresnave/auth-framework` `origin/main` and, where a claim is about what a user gets,
from a **published tarball** (`static.crates.io/crates/auth-framework/auth-framework-<version>.crate`). The 2026-10-17 reads
(rc73 tarball) are stale for versions and security; those two areas are rebuilt from live APIs as described below, and every
other row is re-read against the then-newest published tarball before site code.

**No hosted-service claim**, no "sandbox", no "coming soon", no performance, no compliance, no adoption numbers. The sandbox
and any production service are later stages of board 228 and get their own pages only after they exist.

## Versions the site may name

No version number is copied by hand into this note or the site. Every version string is **read from the crates.io API at build
time** (newest stable, newest release candidate per line, and which versions are yanked) and rendered from that response; a
yanked version is never offered. The build fails if the API cannot be read, rather than falling back to a stale number.

Rule kept: the site describes the **published crate, never `main`**. A version that is on `main` but not on crates.io is never
named as available.

## Pages and the source behind each claim

| Page | Claim | Source (ref) |
|---|---|---|
| Home | One sentence: an authentication and authorization framework for Rust, library plus an optional OAuth 2.0 / OIDC server; currently a release-candidate line | `Cargo.toml` `description`; README banner line ends "Release candidate"; its intro says that, as an active release candidate, it should be validated against your environment, storage, TLS and operational requirements (main) |
| Home | Licence MIT OR Apache-2.0 | `Cargo.toml` `license`; `LICENSE-MIT`, `LICENSE-APACHE` in the rc73 tarball |
| Home | Rust 1.95+, edition 2024 | `Cargo.toml` `rust-version`, `edition` (rc73 tarball) |
| Maturity | Which line is newest stable and which are release candidates; **not 1.0** unless the API says so | crates.io `max_stable_version` and version list, read at build time |
| Features | The protocol list, each row linked to its module path and feature flag | `PROTOCOLS.md` in the rc73 tarball. **Checked:** all 34 module paths it names exist in the rc73 tarball (0 missing; a nonexistent path is absent, as control) |
| Features | Storage backends: PostgreSQL (default), SQLite, Redis, tiered | `FEATURE_FLAGS.md`, `Cargo.toml` `[features]` |
| Features | Web integrations: Axum, Actix-web, Warp | `FEATURE_FLAGS.md` "Web Framework Integrations" |
| Features | SAML is Linux/macOS only for now | `FEATURE_FLAGS.md` `saml` row (issue 106 linked there) |
| Security | The advisory list, linked, with severity | Rendered from the GHSA API at build time (`GET /repos/ciresnave/auth-framework/security-advisories`, `state: published` only). No advisory is listed, named or linked from a snapshot in this note or the source: more are being prepared and are not public yet |
| Security | Which versions are fixed | Nothing until each line's fixed version is read back from the advisory. Until then the page has **no sentence about which lines are safe or patched** |
| Security | How to report: email, not a public issue | `SECURITY.md` "Reporting Security Vulnerabilities" (the address printed there) |
| Install | Cargo dependency line and a minimal program | **Run before it is written** (below) |
| Docs | Links: docs.rs, CHANGELOG, repository, crates.io | docs.rs link per version the build names; build checks each returns 200 |

## Words the site will not copy from the README, and why

- "The Most Complete ... Framework for Rust", "Unmatched Feature Set", "Zero-Trust Architecture", "Best Choice": comparative or
  unmeasured superlatives. No source supports them.
- "Production-grade" (the heading in `PROTOCOLS.md`): the same file's README calls the crate a release candidate to be validated
  first. The site lists protocols as **present in the published crate**, not as production-ready. A grep for stub markers in the
  protocol modules finds only test fixtures and a doc example, which says nothing about completeness; the site does not claim it.
- "35+ protocols": a count in prose. The site shows the table's rows, and a number only if it is computed from the file at build
  time (the file's tables mix protocols with header and separator rows, so a hand count is easy to get wrong).
- The README's install one-liners and `docker run ... :0.6.0-rc41`: the Docker image is a pinned old version inside a
  known-affected range, and `install.sh` / `install.ps1` pipe `main` into a shell. Not run, so not documented.
- Test counts ("1,900+ tests"): the README itself says its recorded results are a historical rc18 snapshot.
- Supported-versions table: resolved upstream. `SECURITY.md` on auth-framework `main` now has a Supported versions section
  (latest line fixed, older lines backported when small, no support period promised). The site links `SECURITY.md` and states
  **no support matrix**.

## Install and quickstart: run first

The README's Basic Usage program (`AuthConfig`, `register_method`, `create_auth_token`, `validate_token`) is built and run in a
scratch project against the **newest published patched version, determined at build time** (never a number copied here; rc73 is
no longer the newest and falls inside newly found affected ranges) before it appears. The README's own dependency line is
stale and is not copied. The quickstart is rerun on the version the build pins before the page shows it. The page shows the
exact command, the exact output, the Rust version, and the OS it ran on, or it says it did not run. If it does not build, the page says what
was observed instead of the README's text. Result is recorded in the site PR, not here.

## Site mechanics (follows ThinkersFoundation-site)

- Astro, zero client JavaScript by default, no tracking, no cookies, no third-party fonts or scripts.
- `public/_headers`: CSP with `script-src 'self'`, same shape as the sibling site.
- Four required CI jobs on **hosted** runners (the repo is public, so hosted Actions are free): tree-freshness guard, `astro check`,
  `astro build`, Playwright + axe. Actions pinned to full SHAs with a version comment. `CODEOWNERS`. Branch protection on `main`
  requiring those four names, set and **read back** from `branches/main` (`enforcement_level`, `contexts`), not inferred from
  `.protected`.
- A claims test: every sentence that states a fact is tagged in the source with the row of the table above; CI fails on an
  untagged fact line. (A test that cannot fail on an untagged line is not accepted: it ships with a deliberately untagged control.)
- Version rule: every pushed change bumps the version; pre-1.0 the second number is the breaking one.

## Not in this PR / needs someone else

- Repo write access for `ciresnave-bot` (the first push returned 403; PM asked).
- CireSnave: Cloudflare Pages click-through (project name `authframework-site`), then `dns-pages`/`pages-domains` equivalents for
  the `authframework.dev` zone. `plan.mjs` here is specific to the three foundation domains; the new zone gets its own steps.
- Whether the footer names CireSnave and an address: the site shows only what `SECURITY.md` and `Cargo.toml` already publish.

## Naming (AuthAnt rename pending, approved 2026-10-21)

`auth-framework` is to be renamed AuthAnt after the security advisory work. Until then no brand copy is final. The site keeps
every name in ONE config module (`src/config.ts`) as separate fields: `productName`, `domain`, `repoUrl`, `crateName`, `crateVersionPin`.
Pages read these fields; no page hard-codes them. Crate name, repo URL, advisory links and version pins are identifiers, not brand:
published versions stay under the old crate name. Today's hard-coded set is `authframework.dev`, `authframework-site` (repo and
Cloudflare project), `auth-framework` (crate, repo URL, advisory API paths).
