> Historical af275ce delivery. The temperature blocker and browser prerequisites are addressed separately in [PREINTEGRATION-REVIEW.md](PREINTEGRATION-REVIEW.md); original source snapshots remain unchanged.

# Narrow corrective iteration based on 76b06ce

Branch: `review/boh-catalog-required-courses-corrections`. **Not production or integration ready.** Only the isolated `catalog/` implementation, its schema, tests and documentation changed.

## Verified baseline and corrections

`node catalog/test/baseline-76b06ce.mjs` reads immutable Git objects into a temporary directory and reproduces six failing baseline probes. It never checks out or modifies the parent branch. Result details: `evidence/baseline-76b06ce.json`.

| Failure | Cause | Correction and independent regression |
|---|---|---|
| Repeated welcome dish accepted | Only the section's total quantity was checked | Count each offering across all submitted lines. Each automatic offering must occur exactly once per package quantity; missing/overrepresented offerings fail. Tests cover repeated aggregate/split lines and two-package quantities. |
| Empty/optional-only package quoted | No invariant required an included course | Active fixed-price/tasting packages without required included courses fail canonical validation, publishing and quoting. Both imported and owner-edited cases are covered, including refusal in the actual pilot screen. Inactive empty menus and ordinary intentionally empty menus are preserved, never seeded. |
| Nested records falsely marked mapped | Ledger inherited any ancestor's mapping | Explicit typed record/field policies classify every node. Unknown children become unresolved and block publication; recognized private values are visibly reported as preserved. Exact coverage and targets are validated. |
| Pairing sale missing | Tasting `pairings[]` had no representation | Each pairing has stable source identity, a reusable product and optional individually priced offering; source taxes/components are retained. Missing wine identity/pour/allergen/routing prevents ordering. Suggestions remain non-orderable labels without name/price inference. |
| Package tax references lost | Source `taxIds` were not represented on menus | Menu `taxRuleIds` survive validation, projection, price snapshots and quotes, separately from per-line taxes. Missing referenced tax rules block publication. Tax calculation itself remains outside this quote milestone. |
| Declared modifier allergens bypassed | Only ingredient/unknown classifications checked verification | Every declared allergen requires option verification, across temperature, preference, pricing, ingredient and unknown classes. Positive compatible verified choices remain supported. |

Additional checks refuse stale mirrored dish price/tax/course data rather than claiming it was modeled. No original recipe, price, modifier or floor-map record was corrected or overwritten to make a test pass.

## Explicit allergen-free verification workflow

Empty source declarations still import as unknown. An empty list or `verified:true` never authorizes it. The isolated API demonstrates an explicit approval path:

1. A trusted fixture initializer configures `LocalAllergenVerificationAuthority` with allowed verifier IDs. `openSimulatedSession` is deliberately a **simulation**, not real PIN login or staff authentication.
2. A configured reviewer uses the opaque session capability and a nonempty review reason to approve an explicitly identified recipe/option. The original subject is unchanged; the returned candidate records verifier, reason, issuance and expiry (maximum 60 minutes).
3. The authority privately binds the approval to the complete canonical subject/recipe. Publication/read/quote validation must receive the same trusted authority. Proof JSON, forged session/issuer, recipe/name/declaration changes and cross-subject replay cannot grant approval.
4. Revocation/expiry causes validation and quoting to fail closed. Proofs survive local release serialization only while the original trusted registry is explicitly retained. A new process or authority cannot trust an exported proof automatically.

Regression cases demonstrate this for a seed-STATE empty-allergen item, ingredient modifier and actual green-apple flavor. Positive approvals and additional temperature mappings in price tests are **explicit simulated decisions in private fixture copies**, not certification or changes to authentic restaurant data. Default importing never invokes approval. Real human recipe/preparation review, staff authentication, durable authorization and cross-contact policy remain separate integration gates. The pilot UI intentionally does not provide an authorization shortcut.

## Verification

From the BOH checkout:

```sh
node catalog/test/baseline-76b06ce.mjs
node --test catalog/test/*.test.mjs
PLAYWRIGHT_MODULE=/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache node catalog/test/browser.mjs
```

Current results: **38 contract cases pass; 12 browser checks pass; zero failed/skipped/aborted checks, browser errors or external requests**. Runtime schema and generated `schema.json` equality plus the existing independent Draft 2020-12 validation cases also pass. No package installation, external API, HTTP listener, Firebase/emulator or owner-device session is used.

The previous arbitrary-package tests now explicitly create a required selection rule instead of relying on an empty/optional-only package being publishable. The corresponding negative browser test proves that the unsafe old behavior is refused. No assertion was disabled to hide a failure.

## Actual seed evidence and remaining blockers

`seedStateFixture` extracts and evaluates the actual seed function declarations from tracked `index.html` in a VM, combines the real tracked Scalini data, and optionally applies actual `mmRebuildPf`/`mmNormTm` functions from `menu-manager.js`. No app bootstrap, DOM, Firebase, persistence, network or live STATE is accessed. These are tracked seed fixtures, **not an owner's live catalog export**.

The fully normalized fixture remains **BLOCKED**: `mmAttachTemps` classifies “Filet of Faroe Island salmon” as both meat and fish, while its tasting variant has only fish. Machine-readable functional status: `evidence/seed-state-blockers.json` (BLOCKED, not accepted). The exact blocked paths include `/prixFixeMenus/0/dishes/17` and `/tastingMenus/0/courses/4`. A permanent test verifies that publication refuses this conflict and the source remains unchanged. That passing refusal test does not mean normalized seed migration succeeded. Its source repair is deliberately outside this narrow iteration.

Other gates remain: authentic full live-export reconciliation; real authorization for allergen-free approval; durable approval storage and revocation; compatible actual-app readers; backend security/atomicity/recovery; complete tax calculations and physical-device acceptance. Free-text pairing suggestions are not wine identities, and optional pairing records without fulfillment data remain non-orderable.

Rollback: stop using the isolated pilot or revert this corrective commit. No existing application or production format was activated. New candidate schema fields require explicit source re-import of older pilot releases; originals must be retained, never silently upgraded. Local verification registry expiry/revocation may prevent rollback to an expired approval, intentionally.

Exact files: `evidence/changed-files.txt`. Stop for independent review. No main merge, deployment, production writes, kitchen operations, payment actions or spending occurred.
