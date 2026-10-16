> Historical verification map for 76b06ce. Current iteration: [REVIEW-76b06ce-CORRECTIONS.md](REVIEW-76b06ce-CORRECTIONS.md).

# Corrective verification map

Reviewed baseline: `8e85e56`. Candidate: `review/boh-catalog-milestone1-corrections`.

| Claude finding | Correction | Reproduction/regression |
|---|---|---|
| 1 Allergen verification | Explicit nonempty verified source assertion; unknown/empty never safe; selected ingredient modifiers/flavors fail closed | `R1`, `R1/R7` |
| 2 Pricing | Section price basis validation; one package/line quote function; signed integer modifier deltas; bounds/overflow checks | Both `R2` tests |
| 3 Actual STATE | Explicit catalog-only pure exporter with actual STATE field names | `R3/4` |
| 4 Silent loss | Complete record ledger, private originals, missing refs/orphans/conflicting or unsupported mappings block publication | `R3/4`, `R4` |
| 5 Stable identities | Food source IDs reused in every book/PF/tasting; menu display labels on offerings | `R5` |
| 6 Required choices | One-of required courses, full automatic courses, explicit deferred dessert, separate flavor chooseCount | `R6`, `R2` |
| 7 Metadata | Structured temperatures, aliases/profile overrides, diet, fire timing, wine groups/pours/components | `R7`, `R1/R7` |
| 8 Privacy/types/media | Allowlisted voice/digital fields, no raw operational/cost payloads; schema types and HTTPS media validator | Both `R8` tests; `R12` |
| 9 Availability | 86/stock/activity checks at quote boundary; static impossible required sections block publication; temporal impossibility flagged | Both `R9` tests |
| 10 Prototype defects | Dollars converted to cents; edit/delete; historical rollback selection; cross-tab stale prevention; transactional local error recovery | Browser checks 7–11; `R10` |
| 11 Regressions | Original 13 cases retained (updated for explicit new schema/safety semantics), plus 15 corrective cases | 28/28 automated cases; 11 browser checks |
| 12 Schema consistency | One generated schema pair, runtime shape and semantic checks, independent JSON Schema validator | `R12` (8 parity cases) |

The original schedule regression hid an automatically required item while expecting publication to succeed. It now hides an optional alternative; a separate R9 test explicitly requires publication failure when a required course becomes impossible. This corrects the old test's assumption rather than bypassing the new safety rule.

`test/baseline.mjs` reproduces seven original implementation failures directly from Git objects at `8e85e56`, in temporary local files removed after the run. Baseline evidence is distinct from corrected results.

Authenticity limits: tracked `scalini-dining.js` supplies authentic product descriptions/prices/recipes. The STATE-shape fixture uses those records (including a wine with its published glass price), with explicitly simulated placements/IDs, modifier adjustments and verification assertions for boundary tests. These are not claims of actual restaurant STATE configuration or verified allergens. No restaurant verification flag, recipe or price was changed.

**Integration readiness remains unverified.** Real complete STATE exports, backend/auth/rules/durability, actual-app readers, migration equivalence and physical-device behavior are not covered. Unknown allergen assertions, unsupported mappings, ambiguous identities, missing routing/temperature definitions, or unsafe media remain blocked. No production activation is authorized or performed.
