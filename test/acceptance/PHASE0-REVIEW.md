# Phase 0 review: BOH (`phase0/boh-critical-fixes`, base `7bf4066`)

**Scope:** targeted corrections only.
**Tests:** offline, against a clearly labelled in-memory mock Firestore (`test/acceptance/`).
**Protected files** `cellar.js`, `ops-codes.js` and `scalini-dining.js` are unchanged.

## Commits
1. `64715d5` — Harness, plus a baseline that reproduces the startup-sync and modifier-editor defects.
2. `3e88fe8` — Fixes:
   - startup sync no longer overwrites the cloud;
   - modifier option identity is kept in the editor;
   - the Voice tab is read-only.
3. `6297bd3` — Run ledger.
4. Hardening commit for the owner's conditions (#1 fail-closed sync, #4 modifier publish validation). This commit sits on top of the three above.

## Invariants to check (`index.html`, `menu-manager.js`)
| # | Invariant | Where |
|---|---|---|
| 1a | Nothing is written before every startup read succeeds. A failed read is never treated as an empty cloud. Seeds and migrations attempted before the sync are refused, and they re-run after it. | `CLOUD_SYNC_STATE`, `BOOT_AUTOMATION`, `fbGetDocStrict`, `syncFromCloud` (core + dining wrapper), `boot` |
| 1b | Every sync read records a hash of the cloud doc (`CLOUD_BASE`). Each write re-reads the doc first. The write is refused (kept locally) if the read fails, or if the cloud changed since this device's base. Refused cases include a doc this device never loaded that exists in the cloud. | `guardedCloudWrite`, `fbSetDoc` |
| 1c | Writes to the same doc are serialized, so this device's own writes never self-conflict. | `DOC_WRITE_CHAIN` |
| 1d | Refused changes are kept per doc in `eh_pending_cloud_edits`:<br>• never truncated (the old 50-entry list was migrated, not dropped);<br>• a storage failure is reported, not ignored;<br>• a change identical to the cloud copy is not stored. | `keepPendingEdit`, `writePendingEdits` |
| 1e | **Reconciliation, owner or manager only:**<br>• "Publish my change" is offered only when the cloud hash still equals the change's base, or the doc is absent. It asks for confirmation and re-checks just before writing.<br>• Otherwise only "Keep cloud version" (the local copy is archived in `eh_archived_local_edits`, then the device re-syncs) and "Download my copy".<br>• **Retry cloud sync** replaces "reload to retry". | `openCloudReconcile`, `publishPendingEdit`, `keepCloudVersion`, `downloadPendingEdit`, `retryCloudSync`, `updateCloudBanner` |
| 1f | Cloud photos win. Photos that exist only on this device go to review. Wine chunk reads are strict, so a failed chunk can't truncate the cellar. | `syncFromCloud` (`menu_photos`), `loadWineChunks` |
| 4 | No menu publish if any modifier group has:<br>• a missing or duplicate option id;<br>• an unnamed option;<br>• non-list allergens;<br>• a malformed `itemRef`;<br>• an option renamed from its cloud name but still `verified`.<br>The same check runs before publishing a reviewed change. | `validateModGroupsForPublish`, `saveMenu`, `publishPendingEdit` |
| 8 | Editor: rows carry `data-oid`. Delete and add keep the other options' ids, prices, allergens and refs. A rename resets `verified`. The Voice tab doesn't mutate state. | `menu-manager.js` (`mmModEditor`, `mmSaveModFromForm`, `mmDropModOpt`, `mmAddModOpt`, `mmVoiceView`) |

## Tests
- **Phase 0 acceptance:** `test/acceptance/phase0-acceptance.mjs`, 17 checks through the real BOH screens. Ledger: `runs.jsonl`.
- **Fixture:** `fixtures/established-cloud.json`, a test-only cloud with an owner price and a photo.
- **Mock additions:**
  - `__MOCK_FAIL_WRITES__`
  - `__MOCK_DB__.__rawSet` (another device)
  - `collection().get()`

## Known limits
- **Read-then-write race.** Another writer can change a doc between this device's pre-read and its write. A full fix needs transactions or server rules (Phase 3).
- **Expected conflicts from shared docs.** The POS writes `boh_shared/bar` (stock) and the clock app writes `punches`. A BOH edit made after one of their writes is refused as a conflict. The owner keeps the cloud version (the device then re-syncs) and redoes the edit.
- **Edits made while the startup sync was failing** have no known base. They can be kept or downloaded, but not published.
- **Wine chunks** are separate docs. Publishing a reviewed wine change publishes only the docs that were reviewed.
