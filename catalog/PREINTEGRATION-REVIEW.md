# Final isolated prerequisites — based on af275ce

Branch: `review/boh-preintegration-temperature-browser`. Only isolated `catalog/` code, fixtures, tests and evidence change. No full BOH UI integration, production data repair or deployment is performed.

## Temperature cause and repair

The existing BOH `mmAttachTemps` regular expressions treat “filet” as meat and “salmon” as fish. Thus normalized source records can acquire both groups, cooked-sole dishes acquire a meat group, and ready-to-serve smoked salmon acquires a cooking-temperature requirement. Those old application functions remain unchanged in this isolated milestone.

The shared catalog importer now calls `temperature-policy.mjs` instead of interpreting names. It uses exact authentic `askTemp` tokens and explicit group links, with a source-reviewed policy keyed by stable food product ID for the known heuristic artifacts:

| Stable product | Authentic askTemp | Isolated canonical selection |
|---|---|---|
| `sf_m_forestiere` — Faroe Island salmon | `salmon` | Existing `mg_fish_temp` choices only |
| `sf_m_sole` — Filet of sole | empty | No required cooking temperature |
| `sf_m_genovese` — Genovese sole | empty | No required cooking temperature |
| `sf_w_salmon` — Smoked Salmon | empty | No required cooking temperature |

“Reviewed” here means checked against tracked authentic metadata in this candidate; independent approval of this policy is still required. No dish-name inference is used. Existing explicitly assigned seed temperature groups remain valid configuration. Unsupported prompts without explicit links, missing authentic groups, contradictory explicit references, conflicting reviewed metadata and custom/generic temperature ambiguity block publication. Only known meat/fish heuristic links for the reviewed identities are reconciled; other ambiguous links are not silently discarded. Diagnostics record source path, stable ID, original links, selected link and basis in private provenance.

`test/temperature-baseline.mjs` compares the candidate with immutable `af275ce` on the **same** actual normalized seed STATE. It checks every canonical product field except the three temperature/modifier-link fields, plus entire menu/section/offering/modifier/tax/route collections. Original recipes, allergens, prices, photos, routing and source snapshots match exactly.

Results: **73 products, 9 menus; zero unresolved mappings; local import and simulated publication PASS.** `evidence/temperature-reconciliation.json` contains the prior four blocking messages and exact before/after groups. This supersedes the parent commit's historical `seed-state-blockers.json`. These are actual tracked seed definitions and real Scalini configurations, not an owner-authorized live export. No missing menu values or choices were manufactured. The older wrapper fixture now includes the actual existing BOH modifier/tax definitions rather than omitting required referenced data; negative tests still remove groups to prove refusal.

## Browser investigation and repair

There were two unsafe application-state boundaries and early test readiness checks:

1. The old code announced activation before save/render/preview completed. Publish remained disabled while editable fields stayed enabled; an edit could be rejected as “Publication in progress.” The old suite treated a changed release pointer or success text as completion. An injected preview delay deterministically reproduces the problem against `af275ce`.
2. The old storage handler locked the page on **any** notification for the pilot key, even if the saved snapshot already matched. A replay of an obsolete/current-snapshot notification deterministically reproduces a false stale lock. The first corrected cohort also had a disabled-menu timeout after reload; its original trace does not identify which event produced the lock, so that precise spontaneous event sequence is not claimed as proven.
3. Reload restoration was asynchronous, but the old suite waited only for a non-null pointer. That was not proof that restoration and preview were ready.

The candidate keeps mutating controls locked during restore/publication, announces success only after save/render/preview complete, and reenables controls in `finally`, including errors. Storage notifications are checked against the actual current saved snapshot before marking stale. Genuine competing-tab changes still lock and cannot overwrite data. Test waits require real UI readiness; they do not force-enable controls, suppress timeouts or retry failures. A read-only state diagnostic is included in browser failure output.

`test/publish-lifecycle.mjs` transforms only in-memory served test assets to delay preview. It proves the old inconsistent state, the corrected lock/readiness behavior, successful upcharge editing after completion, and obsolete-event handling. No artificial delay/hook is shipped in the application. Separate JSON artifacts retain both pre- and post-storage-probe executions.

## Every full-suite browser run

No failed execution is discarded. Full exit status, duration, stdout and stderr are retained in `evidence/browser-runs.jsonl`; summary: `evidence/browser-run-summary.json`.

| Cohort | Runs | Result |
|---|---|---|
| Immutable `af275ce` ordinary suite | 1–3 | All PASS; spontaneous failure not reproduced in these three runs |
| First lifecycle correction (`corrected` label) | 1–10 | Runs 1–6, 8–10 PASS; **run 7 FAIL**, disabled menu after reload, full timeout retained |
| Final candidate (`final` label) | 1–10 | **All ten PASS**, 13 screen checks per run; zero external requests or browser errors |

The first correction was not accepted as stable after run 7. The final candidate includes the snapshot-aware event guard, explicit restore readiness and deterministic event-replay regression. No claim is made that repetition alone proves the absence of every browser race.

## Reproduce

Use the already-installed Node 24, Python/jsonschema and Playwright/Chromium environment; no installation, paid API, emulator or server listener is required:

```sh
node --test catalog/test/*.test.mjs
node catalog/test/temperature-baseline.mjs
PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache CATALOG_REF=af275ce node catalog/test/publish-lifecycle.mjs
PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache node catalog/test/publish-lifecycle.mjs
PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache BROWSER_RUNS=10 BROWSER_LABEL=independent-review node catalog/test/repeat-browser.mjs
```

Override `PLAYWRIGHT_MODULE` and `CHROMIUM_PATH` for another existing installation. The repeat runner appends **every** run and returns failure if any run fails; no automatic retry. For the exact old suite, set `BASELINE_REF=af275ce BROWSER_RUNS=3 BROWSER_LABEL=independent-baseline`; it extracts tracked files temporarily, runs the original script and removes the copy. All browser assets are fulfilled locally in-process and external requests are blocked. No owner/iPhone test session starts.

## Remaining gates

- Independent review must approve the stable-ID reconciliation policy and browser corrections. Existing BOH normalizer/UI has not been wired to this policy; no production repair is claimed.
- Authentic complete live STATE export compatibility, actual-app consumers, real staff authentication/durable allergen-free approvals, backend security/atomicity/recovery and physical iPhone acceptance remain unverified.
- Unverified allergen declarations, missing fulfillment and ambiguous custom source data still block ordering/publication as applicable. Successful seed publication is not restaurant or integration acceptance.
- Rollback is to discontinue the isolated pilot or revert this additive review commit. Existing BOH/POS/kitchen/voice/Firebase/payment systems need no migration rollback because none were changed.

Exact files: `evidence/changed-files.txt`. Stop for independent verification; no main merge, deployment, kitchen transaction, live Firebase action or expense is authorized/performed.
