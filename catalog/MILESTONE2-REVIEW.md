# Milestone 2 — isolated real-BOH interface integration candidate

Base: `60e12a7194da9efa29d7f2034aac99e534a3021c`.
Branch: `review/boh-unified-catalog-interface-milestone2`.

This candidate connects the **actual existing BOH application** to the unified contract in a generated, opt-in, fixture-only page. It does not activate a production format, replace the normal entry point, or alter the POS/kitchen/digital applications. Independent review remains required.

## Implemented and demonstrated

- Existing PIN/login, navigation, menu tree and item/group/prix-fixe/tasting/wine/bar/retail editors execute from the tracked `index.html` and `menu-manager.js`. Their original files are unchanged.
- Additional menu controls support arbitrary owner names, renaming and deletion. Existing specialised package editors remain the source for package/course configuration. A new named menu starts genuinely empty, not populated with all food categories.
- Existing group controls create and rename sections; additive controls reorder sections, attach existing food/wine/bar/retail records, and detach cross-collection offerings. Source IDs and authoritative source prices are reused; wine pours retain separate prices. No recipes or restaurant prices are manufactured.
- Deleting a menu/section retains unshared sections in an inactive owner archive; deleting a food source item marks it inactive instead of destroying authentic records. The archive is omitted from public projections. There is no permanent source-record deletion in this lab.
- The real existing **Publish all changes** boundary and the explicit local publication button both invoke the unified publisher. Validation errors are visible; immutable release history, a selectable historical rollback and read-only POS/voice/digital projection previews are present.
- A new menu, `Chocolate Studio Moonlight 2030`, and owner-created section are published through the actual screens, using a tracked BOH wine record and its existing glass price. Browser assertions read the resulting identity and price through **all three shared projection functions**, and also exercise the visible preview control. These are contract readers, not deployed consuming applications.
- The actual STATE exporter accounts for all catalog keys, including legacy voice-profile/revision and inventory-reference metadata absent from the seed fixture; unknown STATE fields fail closed. Existing metadata is not omitted by selecting only fixture keys.
- Local writes use separate fixture storage. Publication uses a cloned local store and commits the complete snapshot before replacing the in-memory active pointer. Invalid catalog data, failed storage and stale tabs cannot advance the active release. Rollback restores the source STATE from that immutable release without modifying old publication keys.
- No dish-name temperature inference executes in the opt-in page: `ensureMenuManager` seed/heuristic initialization is bypassed and `mmAttachTemps` calls the shared explicit-metadata/stable-ID reconciler. Ordinary item editing has an explicit temperature prompt and a review-required choice. Conflicting/unsupported metadata blocks publication. An ambiguous ordinary item edit is rejected before changing the item. The real Add Item path flushes/validates the current form before allocating a draft record, so rejected edits cannot create stray items. Existing explicit temperature groups remain available in package dish modifier editors.
- `menuCats.posName` is modeled as section metadata and exposed only as an allowlisted `displayName` in projections. `menuCats.offeringRefs` are typed source references, individually ledger-accounted; unknown nested fields, unresolved references and unavailable prices block publication. Owner section order is preserved.

## Reproduction (no installation, listener, Firebase or physical device)

From this repository, using the already-installed Playwright and Chromium:

```sh
PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs \
XDG_CONFIG_HOME=/tmp/epicurean-browser-config \
XDG_CACHE_HOME=/tmp/epicurean-browser-cache \
node catalog/test/run-milestone2.mjs
```

On a different development machine, set `PLAYWRIGHT_MODULE` to an existing installation's `index.mjs`. Chromium is expected at `/usr/bin/chromium` for the real-BOH suite. No package installation is performed. The runner executes all contract tests, the earlier prototype regression suite, and three fresh real-BOH browser runs. Every final run is recorded in `evidence/milestone2/runs.jsonl`, with separate logs; any failing run causes a nonzero exit. Screenshots are regenerated from the real-BOH browser run.

Targeted commands:

```sh
node --test catalog/test/*.test.mjs
# With the same Playwright/browser environment variables:
node catalog/test/boh-interface-browser.mjs
node catalog/test/browser.mjs
# These original application files must have NO diff:
git diff 60e12a7 -- index.html menu-manager.js scalini-dining.js cellar.js ops-codes.js voice-vocab.js voice-profiles.js
```

The real-BOH suite checks login, arbitrary menu creation, section renaming/reordering/archival, attaching a real wine, all projections and visible previews, publication failure retention, two releases/rollback, reload, dish-name temperature independence, ambiguous edit rejection with unchanged item, specialised editor rendering, floor geometry/admin navigation, source-preserving menu deletion (including explicit bookId references), modifier allergen-field preservation and verification invalidation, quota failure, stale tabs, intentionally empty catalog publication, absent Firebase and zero external requests/browser errors. These are automated Chromium results, not physical iPhone evidence or formal restaurant acceptance.

## Isolation and evidence

`lab/page.mjs` transforms the actual app **in memory**, removes the Firebase SDK/configuration/adapter and external CDNs, replaces the owner PIN with fixture PIN `5000`, prefixes legacy fixture storage and removes automatic seed resurrection/bootstrap. It injects a network-blocking CSP and API guards. `boh-integration.mjs` refuses activation without the explicit fixture-page marker and fixture data. No normal BOH HTML loads it. The Playwright route exposes only that generated HTML and local script/style assets, aborts other origins and starts no HTTP listener. Catalog photos remain in source data but external images are blocked. Uploads, AI, legacy voice publishing and sales/stock-consumption boundaries are disabled. Fixture identity is not production authorization or allergen approval.

Exact changed paths are listed in `evidence/milestone2/changed-files.txt`.

Screenshots: `evidence/milestone2/published.png`, `source-reference.png`, `floor.png`. Per-run stdout/stderr is adjacent. The floor comparison covers rooms, geometry, statuses, station assignments and all object fields except the pre-existing transient `_demoTurns` seating decoration. Final repeat batches use unique timestamps and log filenames. Earlier exploratory ledger rows predate this naming convention.

The initial exploratory comparison of every field failed because opening the existing floor screen appends those demo notes; this was diagnosed rather than changing floor-map code. Subsequent checks deliberately exclude only `_demoTurns`, not geometry. The initial complete suite passed three runs at 13 checks. When the suite was expanded, three runs failed because a deliberately rejected temperature form remained invalid before Add Item; this led to the Add Item pre-validation guard and an unchanged-record-count regression. A subsequent three-run batch (`2026-10-16T04-03-20.083Z`) failed because test teardown removed a temporary dish but retained its voice profile; the now-complete STATE exporter correctly rejected the orphan. Teardown now restores the complete captured catalog snapshot, rather than weakening import validation or dropping voice metadata. The failure logs and all runner outcomes are retained alongside the final corrected runs.

## Migration and rollback

1. Do not deploy this branch or add its module to production `index.html`.
2. Review this isolated candidate, including the generated-page boundary and direct publishing behavior. Approval of fixture tests does not authorize live SDK access.
3. Separately authorize an authentic catalog export and reader migration testing before claiming live-data compatibility. Keep old publications and open-check price snapshots immutable.
4. A future production adapter needs approved backend authorization, transactions, durable history and multi-client conflict tests; the local store must not be substituted for those guarantees.
5. Lab rollback selects a historical immutable release and restores its source draft plus active local release. Browser storage is local test persistence only. To discard the candidate, stop the browser and return to the base commit/branch; production has no changed entry point, rules, records or publication to undo. Do not reset a checkout containing someone else's work.

## Final recorded results

Final candidate batch: `2026-10-16T04-11-28.008Z`.

| Verification | Result |
| --- | --- |
| Contract/safety regressions | 47 passed, 0 failed |
| Earlier separate prototype regression | 13 checks passed |
| Actual BOH browser run 1 | 15 checks passed; 0 external requests/browser errors |
| Actual BOH browser run 2 | 15 checks passed; 0 external requests/browser errors |
| Actual BOH browser run 3 | 15 checks passed; 0 external requests/browser errors |
| Actual normalized seed import | 73 products, 9 menus, 0 unresolved records; source unchanged |
| Physical device/backend/live catalog | NOT TESTED |
| Full modifier-reference editing/publication | BLOCKED; not accepted by passing safety tests |

Earlier expanded runs include **six failures**, retained in the run ledger and logs: three invalid-form transition failures and three fixture-teardown orphan-profile failures. Later corrected batches passed. These failures are not counted as acceptance passes. The final suite also verifies the added modifier-metadata preservation correction. No formal POS acceptance results are advanced.

## Remaining blockers and limits

- **No production/integration readiness claim.** No live export, Firebase/emulator/backend security, actual consuming-app integration or physical iPhone test was run. Backend work and live export access remain separately authorized tasks.
- Legacy modifier-editor saves remain an integration review blocker: `mmSaveModFromForm` constructs options afresh and can emit `voiceRole`, `voiceAliases` and `itemRef`, which the current contract importer deliberately does not classify. The lab wrapper preserves unexposed option metadata (including allergens), validates signed deltas and invalidates verification when an option label changes; a real-form regression verifies this using explicitly simulated metadata, never an order. Full operational-reference mapping still needs independent semantic review before being accepted for rollout; this delivery does not claim them accepted. Strict source accounting blocks unsupported metadata rather than discarding it.
- Authenticated multi-user editing and durable atomic activation are not provided by this browser mock. Fixture PIN 5000 and localStorage are not production session/authorization controls. Cross-tab protection blocks publication from stale snapshots; it is not a distributed editor.
- Allergen-free authorization remains unimplemented in the real BOH UI; no simulated authority is used. Empty/unverified declarations stay non-orderable through the contract. The fixture demo publishes data, not authorization to prepare food.
- Existing specialised editors are reused, not comprehensively redesigned or independently accepted. Tests prove rendering and exercised save paths; they do not establish every legacy administrative operation works. Unknown newly produced metadata fails closed in import accounting.
- Known reviewed temperature normalization remains in the import reconciler; raw source snapshots preserve original legacy values for audit. This is not a bulk rewrite of restaurant data. Ambiguity requires explicit owner review, not guessed values.
- Generic menu names are unlimited; generic reusable sections coexist with the original prix-fixe/tasting editors. New kinds of ordering behavior still need explicit reusable rule support rather than inference from a name.
- Photos are preserved as references but remote fetching/upload is deliberately unavailable in this isolated environment. Charts loaded from a CDN are absent; unrelated application source is unchanged.

## Exact changed files

- `catalog/boh-integration.mjs` — opt-in real-BOH UI binding and local publishing.
- `catalog/lab/page.mjs` — fixture-only transformation/isolation.
- `catalog/legacy-adapter.mjs` — source references, section display metadata/order and complete category targets.
- `catalog/import-accounting.mjs` — typed reference ledger and category display label.
- `catalog/publication.mjs` — allowlisted section display label projection.
- `catalog/test/boh-integration.test.mjs` — added contract/isolation regressions.
- `catalog/test/boh-interface-browser.mjs` — actual BOH UI browser regressions/evidence.
- `catalog/test/run-milestone2.mjs` — repeatable full regression runner.
- `catalog/MILESTONE2-REVIEW.md` — this delivery/reproduction/limitations record.
- `catalog/evidence/milestone2/` — screenshots, per-run logs, run ledger and normalized seed summary (individual files listed by `git show --stat`).
