# authframework.dev — design note (first PR; no site code yet)

Task from the PM, 2026-10-17 (board 228 addendum). CireSnave owns the domain. This note is reviewed before any site code
exists. Nothing on the site is written until its source is in the table below.

## What this site is

A small static Astro site on Cloudflare Pages (P2, Git integration; project `authframework-site`; CireSnave does the
dashboard click-through) that describes the `auth-framework` crate. **It describes the published crate, not `main`.** Facts
below were read on 2026-10-17 from `ciresnave/auth-framework` `origin/main` (0.6.0-rc74, unpublished) and, where a claim is
about what a user gets, from the **published rc73 tarball** (`static.crates.io/crates/auth-framework/auth-framework-0.6.0-rc73.crate`).

**No hosted-service claim**, no "sandbox", no "coming soon", no performance, no compliance, no adoption numbers. The sandbox
and any production service are later stages of board 228 and get their own pages only after they exist.

## Versions the site may name (crates.io, API read 2026-10-17)

| Line | Version | Note |
|---|---|---|
| stable | `0.4.28` | `max_stable_version`; patched for both advisories |
| rc | `0.5.0-rc49` | patched for GHSA-9r7g-3hh2-8x65 |
| rc | `0.6.0-rc73` | newest published; `0.6.0-rc69` is **yanked** |

`main` is `0.6.0-rc74` (a test/CI-only change, CHANGELOG), which is not on crates.io. The site never names rc74 as available.
Version strings on the site come from one data file so a release is a one-line change; a CI check compares it with the crates.io
API response.

## Pages and the source behind each claim

| Page | Claim | Source (ref) |
|---|---|---|
| Home | One sentence: an authentication and authorization framework for Rust, library plus an optional OAuth 2.0 / OIDC server; currently a release-candidate line | `Cargo.toml` `description`; README banner line ends "Release candidate"; its intro says that, as an active release candidate, it should be validated against your environment, storage, TLS and operational requirements (main) |
| Home | Licence MIT OR Apache-2.0 | `Cargo.toml` `license`; `LICENSE-MIT`, `LICENSE-APACHE` in the rc73 tarball |
| Home | Rust 1.95+, edition 2024 | `Cargo.toml` `rust-version`, `edition` (rc73 tarball) |
| Maturity | 0.4.x is the newest stable line; 0.5 and 0.6 are release candidates; **not 1.0** | crates.io `max_stable_version` = 0.4.28; README "The 0.4.x line is the newest stable release; `main` is on 0.6.0" |
| Maturity | Advisories exist and are fixed by the versions above | Both GHSAs, read through the API (below) |
| Features | The protocol list, each row linked to its module path and feature flag | `PROTOCOLS.md` in the rc73 tarball. **Checked:** all 34 module paths it names exist in the rc73 tarball (0 missing; a nonexistent path is absent, as control) |
| Features | Storage backends: PostgreSQL (default), SQLite, Redis, tiered | `FEATURE_FLAGS.md`, `Cargo.toml` `[features]` |
| Features | Web integrations: Axum, Actix-web, Warp | `FEATURE_FLAGS.md` "Web Framework Integrations" |
| Features | SAML is Linux/macOS only for now | `FEATURE_FLAGS.md` `saml` row (issue 106 linked there) |
| Security | The two published advisories, linked, with severity and the patched version per line | GHSA-7jcf-r8rm-w7vc (low; patched 0.4.22 / 0.5.0-rc45 / 0.6.0-rc69) and GHSA-9r7g-3hh2-8x65 (high; patched 0.4.28 / 0.5.0-rc49 / 0.6.0-rc73), `GET /repos/ciresnave/auth-framework/security-advisories/<id>`, both `state: published` |
| Security | How to report: email, not a public issue | `SECURITY.md` "Reporting Security Vulnerabilities" (the address printed there) |
| Install | Cargo dependency line and a minimal program | **Run before it is written** (below) |
| Docs | Links: docs.rs, CHANGELOG, repository, crates.io | docs.rs returns 200 for 0.4.28, 0.5.0-rc49, 0.6.0-rc73 (read 2026-10-17) |

## Words the site will not copy from the README, and why

- "The Most Complete ... Framework for Rust", "Unmatched Feature Set", "Zero-Trust Architecture", "Best Choice": comparative or
  unmeasured superlatives. No source supports them.
- "Production-grade" (the heading in `PROTOCOLS.md`): the same file's README calls the crate a release candidate to be validated
  first. The site lists protocols as **present in the published crate**, not as production-ready. A grep for stub markers in the
  protocol modules finds only test fixtures and a doc example, which says nothing about completeness; the site does not claim it.
- "35+ protocols": a count in prose. The site shows the table's rows, and a number only if it is computed from the file at build
  time (the file's tables mix protocols with header and separator rows, so a hand count is easy to get wrong).
- The README's install one-liners and `docker run ... :0.6.0-rc41`: the Docker image is in the advisory's vulnerable range
  (`< 0.6.0-rc73`) and `install.sh` / `install.ps1` pipe `main` into a shell. Not run, so not documented.
- Test counts ("1,900+ tests"): the README itself says its recorded results are a historical rc18 snapshot.
- Supported-versions table: `SECURITY.md` says 0.5.x is supported and 0.4.x is not, yet GHSA-9r7g patches 0.4.28. These
  disagree, so the site states no support matrix and links `SECURITY.md`. **Raised to the PM as a finding.**

## Install and quickstart: run first

The README's Basic Usage program (`AuthConfig`, `register_method`, `create_auth_token`, `validate_token`) is built and run in a
scratch project against `auth-framework = "=0.6.0-rc73"` before it appears. Its README dependency line says `0.6.0-rc50`, which
is inside the high-severity advisory's vulnerable range; the site pins a patched version. The page shows the exact command,
the exact output, the Rust version, and the OS it ran on, or it says it did not run. If it does not build, the page says what
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
