# Unified BOH catalog — isolated Milestone 1

Review branch: `review/boh-unified-catalog-milestone1`. Base: `7bf4066c717d2b0aaf54731951ecf4ecd86738a8`.

This is a separate local editor, shared contract and simulated publication store. Existing BOH entry points, records, legacy publishing and floor geometry are unchanged. No Firebase SDK, credentials, backend adapter or kitchen/payment transport is added. The pilot has `connect-src 'none'`; it imports only files explicitly selected by its operator. It starts empty and never seeds restaurant data.

## Contract

`schema.json` describes `epicurean.catalog/v1` catalogs and complete release envelopes. `contract.mjs::validate` enforces semantic references, ownership, selection bounds, explicit prices and schedules. JSON Schema is provided for consumers; no external JSON Schema validator was installed or run. Currency v1 is USD, with nonnegative integer cents.

| Collection | Meaning |
|---|---|
| menus | Arbitrary stable ID/name, presentation group, ordered section IDs, ordering rule, explicit fixed base price when applicable, channels and availability |
| sections | One parent menu, arbitrary name, ordered offerings, reusable selection rule |
| offerings | One section, existing product reference, explicit standalone price or included-course null price, explicit upcharge, tax references and availability |
| products | Preserved BOH identity/name/description/photos/allergens, modifier/temperature references, route, translations and original source payload |
| orderingRules | Individual sale, fixed-price package, or selection bounds with automatic/deferred flags; behaviors rather than hardcoded menu types |
| modifierGroups | Existing choices, bounds and explicit price deltas, including preparation-temperature choices |
| taxRules/routes/availabilityPolicies | Explicit source tax metadata, station identities and timezone-based schedule windows |
| provenance/legacySnapshots | Import evidence and complete original payload preservation |

Example menu (names are unrestricted):

```json
{"id":"owner-menu","name":"Moonlight Studio Collection","orderingRuleId":"fixed-price","basePriceCents":8900,"presentationGroup":"FOOD","active":true,"channels":["pos","digital","voice"],"availabilityPolicyId":null,"sectionIds":["owner-course"]}
```

The example base price comes from the tracked authentic fixture; it is not a new restaurant price. An offering points to an existing BOH product. Included courses have no fabricated standalone price. Unspecified allergens remain `unknown`, never implicitly safe; missing routes/unknown allergen data make the projection non-orderable.

Each release has a SHA-256 ID, a manifest containing schema/currency, every collection's record count, and ordered chunk references with hashes/counts. Immutable chunks hold the complete records. Publication validates, stages, verifies all hashes/counts, then compares the expected active revision before changing the pointer. Validation, partial staging, corruption or concurrent revision conflict leaves the active release intact. This atomicity is tested **within the in-memory mock**, not a claim about Firestore transactions or durability.

`project(release, channel)` is the same generic contract reader for `pos`, `voice` and `digital`. Digital projection omits internal legacy/operational payloads. This is not access control: complete manifests contain internal snapshots and must never be publicly exposed directly. Actual consuming applications are not modified in this milestone.

`priceSnapshot` captures release/product/offering/menu IDs and price components. Publishing a newer price or rolling back never mutates that captured snapshot. Actual POS integration and durable open-check recovery remain future verification gates.

## Reproduce

From the BOH repository, using Node 24:

```sh
node --test catalog/test/catalog.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/already-installed/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache node catalog/test/browser.mjs
```

Chromium defaults to `/usr/bin/chromium`; override with `CHROMIUM_PATH` if needed. No package installation is required. The browser runner fulfills local static assets in-process and blocks external requests; it does not start an HTTP listener, backend, emulator or physical owner session.

Evidence in `evidence/`: **13/13 contract cases pass; six browser checks pass; zero browser errors/external requests**. The browser creates, organizes, renames and publishes an arbitrary owner menu and reads the same offering/base price through all three consumer projections. It verifies failed publication and reload retain the previous release. Tests cover empty menus, authenticity preservation, explicit legacy `groupIds`, fixed-price/tasting rules, immutable price snapshots, schedules, corruption, competing activation and rollback. These are automated local simulations, not deployed-app or iPhone acceptance.

Authentic fixture: `scalini-dining.js` from the base commit, loaded in a VM without DOM/network. Uses existing prix-fixe, tasting and wine-by-glass records/prices. Adversarial internal-field markers and a simulated price revision are explicitly test data, not restaurant records. Live catalog exports were not obtained.

## Compatibility and migration gates

1. Keep existing BOH publishing and consuming applications on their current format. Nothing imports this pilot into the existing UI.
2. Obtain separately authorized catalog exports if required. Explicitly import with `importLegacy`; preserve originals and review candidate mapping. Ordinary book kinds/names are not whitelisted. Recognized legacy fixed-course containers require explicit course mappings; unsupported/unplaced records fail rather than disappearing. An intentionally empty source remains empty.
3. Reconcile IDs, prices, descriptions/photos, allergens, modifiers, temperatures, schedules, routes and menu completeness against authentic exports. Unknown metadata requires owner resolution, not invented defaults. Full live-data compatibility is not yet verified.
4. Add compatible readers to POS/digital/voice only in separately approved milestones. Verify dual-read results and open-check pinned release/price snapshots before considering cutover. Ordering rules here are metadata, not a new ordering or kitchen engine.
5. Design/review an authenticated backend publisher, immutable release storage, transaction/CAS activation, secure public projections and retention/recovery. Request authorization before backend tests, emulator use, deployed rules or real exports. Do not expose raw releases publicly.
6. Only after compatible consumers, migration/recovery/security tests and explicit owner approval may production activate a v1 pointer. None of those production actions occurred here.

## Rollback and recovery

Local simulation: retain old complete releases; `rollback(store, oldReleaseId, expectedRevision)` verifies the old release before changing the pointer. The pilot's rollback button restores its preceding local release. State uses only `epicurean.catalog.LOCAL-PILOT.v1`; it does not read or alter existing BOH local-storage keys. Export candidates before clearing pilot state. Reload checks the active release independently of a damaged draft.

Code rollback: discontinue use of `catalog/pilot.html` or revert this additive commit. Existing BOH entry points are unchanged. No production migration or rollback is necessary or performed. Production rollback must later switch a verified active pointer while retaining old releases for open checks; that backend procedure remains unimplemented and requires review.

## Remaining blockers and limits

- No production backend, authorization/rules, durable recovery or deployed atomic activation has been implemented/tested.
- Actual POS, voice and customer-menu applications do not yet consume v1. Shared-reader proof is not end-to-end application acceptance.
- Real live catalog exports and every historical source shape are unverified; unsupported mappings block import. Operational stock flags are preserved, not a live availability feed.
- Existing legacy seed-fallback behavior outside this pilot is not changed. Production cutover must eliminate inappropriate fallback through compatible readers.
- No physical-device test, kitchen workflow, payment action, voice implementation or production activation. No spending.

## Exact changed files

All additions, exclusively in this repository: `catalog/contract.mjs`, `catalog/publication.mjs`, `catalog/legacy-adapter.mjs`, `catalog/schema.json`, `catalog/pilot.html`, `catalog/pilot.mjs`, `catalog/test/fixture.mjs`, `catalog/test/catalog.test.mjs`, `catalog/test/browser.mjs`, `catalog/evidence/contract-tests.tap`, `catalog/evidence/browser-tests.json`, and this `catalog/README.md`.
