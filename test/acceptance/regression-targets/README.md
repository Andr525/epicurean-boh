# Fixed Phase 0 regression targets — tests only

These are implementation targets, **not fixes** and not a passing acceptance delivery. Each suite asserts correct business behavior and deliberately exits **1** on the pinned defective application. A FAIL means an unmet business assertion; ERROR means a setup/action failure and is not accepted as reproduction evidence. Nothing suppresses or inverts the failures. Existing application files, existing tests, and existing offline mocks are unchanged.

## Source and review branches

| Repository | Failing application source | Test-only review branch | Cases |
| --- | --- | --- | --- |
| `Andr525/epicurean-boh` | `0cb055830ca6551f4e435d93bfe597af9150fc1d` | `review/phase0-boh-regression-targets` | B01, B02, B03, I01 |
| `Andr525/epicurean-pos` | `4d3aabedf2b6fc4e45ae293dd8dcbf7b5dae7b7e` | `review/phase0-pos-regression-targets` | B04–B08, I02–I04 |

Both repositories contain the identical `contract.json`: the fixed 8 BLOCKER / 4 IMPORTANT matrix, the correct behavior, normal/recovery/cross-device coverage, and the named mandatory executable assertions. Every mandatory assertion must execute. Test bodies contain literal expected values or fixture-captured identities; reports record each exact expected and observed value. Positive controls must pass on the failing baseline. No application repair may be called accepted because it merely makes `verify-baseline.mjs` pass.

## Twelve acceptance targets

| ID | Finding and correct behavior | Representative exact required comparison |
| --- | --- | --- |
| B01 | Load authoritative flights/settings before edits; retain unknown-base offline work for review. | `STATE.wineFlights` includes existing ID; untouched Federal percentage remains `17.25`; adding a flight yields **two** records. |
| B02 | Explicit empty published PF/tasting lists stay empty through startup, retry, owner Publish and a second device. | Cloud lists `=== [[], []]`; automatic writes to those documents `=== 0`. |
| B03 | Invalid modifier edits are rejected without erasing valid options, prices or allergen declarations. | Blank name retains option ID; blank price retains cloud `up === 1.5`; malformed publish returns `false` and previous menu is byte-for-value unchanged. Signed `-1.5` and explicit Delete remain valid. |
| B04 | Move the latest cloud check, not stale local data; preserve identities and nested table/seat/owner/price references. | Remote allergies/note/guest count survive; line remains `{seat:'2A',price:12,ownerCode:'3001',table:'2',checkId:original}`. Partial failure/retry and second-device restoration must preserve it exactly once. |
| B05 | A stored receipt must resume finalization exactly once after failure or restart. | One receipt; **zero new tokenizations** on recovery; full payment finishes original check/line; first /3 share recovers `{n:3,totalCents:1000,paid:[333]}` without paying the line early. |
| B06 | Extend the existing unsent-before-charge restriction to every owner on a check. | An unresolved parked draft means **zero receipts**, **zero tokenizations**, an **open** check, and the exact draft recoverable by its owner on a fresh browser. Legitimate draft removal permits payment. |
| B07 | Apply new remote restrictions/notes to a clean stale local view; do not erase them on save. | Position `2=['Dairy']`, `2A=['Tree Nut']`, `3=['Fish']`; conflicting Fish request not committed; subsequent compatible ticket carries the exact restriction/latest note; fresh browser restores all three. |
| B08 | Evaluate selected modifier allergens and conservative nut identities; preserve guest isolation and compatible orders. | Tree Nut topping at flagged 2A adds **zero** lines and visibly warns; compatible guest 2 adds one **$11** line. Tree Nut vs Almond warns; Peanut/Tree Nut remain distinct; Nutmeg/Donut do not become nut allergens. |
| I01 | A post-write observation is not permission to overwrite an unapplied remote version. | Remote torte price stays **77** on the next edit; either STATE is rebased first or stale publication is refused with the local copy retained. |
| I02 | Split → EVEN → /3 must survive first entry to Payment. | `payEven === 3`, first principal **333 cents**, correct displayed selected-tip total; actual normal shares **[333,333,334]** settle $10. |
| I03 | Use modifier group/option IDs, not display names. | One choice cannot satisfy two required groups; final selections retain **both** group/option ID pairs and price **13**. Differently named groups remain a passing control. |
| I04 | Rejected SEND is not success and cannot discard an unpaid draft. | Zero success message; original line remains active and durable; a fresh browser restores it; retry creates **one** original-ID ticket and **$10** billable balance; repeated retry creates no duplicate. |

B06 intentionally uses the existing Phase 0 rule (“send or remove unsent items before charging”), applied consistently across employees. It does not introduce partial-tender policy. B05 requires replayable receipt finalization, not another card token or a real processor integration. B08 uses the owner's existing allergen distinctions and adds no cross-contact policy. These explicit criteria are reviewable before any implementation begins.

## Run without installs or live services

Use existing Playwright and Chromium. In this workspace:

```sh
export PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs
export CHROMIUM_PATH=/usr/bin/chromium
export XDG_CONFIG_HOME=/tmp/epicurean-browser-config
export XDG_CACHE_HOME=/tmp/epicurean-browser-cache
export BOH_ROOT=/workspace/epicurean-boh
export POS_ROOT=/workspace/epicurean-pos
```

On another machine change those paths to existing local installations/checkouts. POS reads the **tracked test fixture** `test/acceptance/fixtures/established-cloud.json` from BOH; both checkouts are therefore required. No package or paid provider is installed or enabled by these runners.

From BOH:

```sh
RESULTS_FILE=/tmp/boh-target-results.json node test/acceptance/regression-targets/boh.mjs --baseline
```

From POS:

```sh
RESULTS_FILE=/tmp/pos-target-results.json node test/acceptance/regression-targets/pos.mjs --baseline
```

**Both commands must currently exit 1.** `--baseline` refuses to call a different application or modified pre-existing harness the original failing baseline. Once application fixes are separately authorized, run the same suite **without** `--baseline`; correct business behavior must eventually yield exit **0**, all cases PASS, no ERROR, and passing controls. Do not relax the targets to match the defect.

To run one implementation target while correcting it:

```sh
node test/acceptance/regression-targets/pos.mjs --only B05
```

Other cases are explicitly `UNRUN`, never passed. No partial run constitutes acceptance.

To verify that saved artifacts establish the original failing baseline (this only validates the evidence):

```sh
node test/acceptance/regression-targets/verify-baseline.mjs evidence-file.json
# Or provide the BOH and POS reports together to verify all 12:
node test/acceptance/regression-targets/verify-baseline.mjs /tmp/boh-target-results.json /tmp/pos-target-results.json
```

That verifier reports `applicationAcceptance: "FAIL"`. It rejects ERROR, UNRUN, failed controls, missing cases, missing mandatory assertions, a mismatched contract, or a failure caused only by an uncaught browser exception. It does not turn red application tests green.

## What is actually exercised

The tracked BOH/POS HTML and local scripts run in Chromium. Existing actual editor and order functions handle the actions; normal form, chip and payment interactions use actual controls where relevant. Some setup and retry actions invoke the same public handlers directly to arrange deterministic cases; this is not a physical iPhone or unrestricted touch-automation claim. No replacement menu parser, money calculator, allergy engine or ordering implementation is substituted.

Fixtures are explicitly synthetic MOCK records. The new tests reuse the original offline `serve.mjs`/`mockfb.js` and mock card SDK without editing them. The generated test page adds `connect-src 'none'`; Playwright aborts every foreign request. There is no listening HTTP server, public tunnel, Firebase/emulator, real payment, kitchen transport, or owner-device session. Square tokenization counters refer only to the fake SDK. All SEND actions terminate in in-memory fixture storage.

A “second device” is a separate Chromium context constructed from **only the persisted mock documents**. It carries no process-local locks, pending item arrays, receipt caches or staff session from the first. Failed-read/write injection and the lost-payment-ack hook modify only the mock transport, never the application's validation or financial functions. This proves simulated recovery behavior, not durable production Firestore semantics, rules, distributed transactions, or real provider idempotency.

The negative modifier-allergen cases use declared/verified synthetic test metadata solely to exercise warnings. They authorize no real orders or allergen-free claims. No BOH restaurant records, recipes, published prices, floor-map geometry, POS application code, voice functionality, production configuration or existing tests were changed.

## Baseline evidence and stopping point

`evidence/baseline-run1.json` and `baseline-run2.json` record all exact assertions, their expected/actual values, setup errors, controls, blocked foreign requests, application source identity and test/contract hashes. Corresponding logs retain the red command output. A result of FAIL is expected because the application is intentionally unfixed.

No Phase 0 fix, merge, deployment, provider activation or formal POS/iPhone acceptance is included. The existing `voice-engine.mjs` guard and all existing tests remain untouched. Stop here for Claude's independent review of these targets before application changes.
