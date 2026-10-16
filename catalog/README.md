# BOH Milestone 1 — corrective review candidate

**Not integration ready.** This additive, isolated catalog prototype does not load in the existing BOH interface or any current consumer application. No production records, Firebase, kitchen/payment transports, floor geometry, POS branches or deployed settings are changed.

Current branch: `review/boh-catalog-required-courses-corrections`, based on reviewed commit `76b06ce`. See `REVIEW-76b06ce-CORRECTIONS.md` for this iteration. Earlier review notes and baseline probes remain historical evidence.

## Reproduce locally

From this BOH repository:

```sh
node catalog/test/baseline-76b06ce.mjs
node --test catalog/test/*.test.mjs
PLAYWRIGHT_MODULE=/absolute/path/to/already-installed/playwright/index.mjs XDG_CONFIG_HOME=/tmp/epicurean-browser-config XDG_CACHE_HOME=/tmp/epicurean-browser-cache node catalog/test/browser.mjs
```

Verified here with Node 24.19, Python 3 with already-installed `jsonschema` 4.26, existing Playwright at `/workspace/epicurean-pos/lab/node_modules/playwright/index.mjs`, and `/usr/bin/chromium`. Override `CHROMIUM_PATH` if needed. No installation, backend, emulator or HTTP listener is started by these commands. Browser requests are fulfilled from local files, with all external requests blocked. No owner/device session is started.

Results: **38/38 contract tests and 12/12 browser checks pass**, with zero skipped tests, browser errors or external requests.

Evidence: `evidence/baseline-76b06ce.json` records six reproduced failure probes against the reviewed parent. `evidence/baseline-defects.json` remains the historical original-commit audit. `evidence/contract-tests.tap` and `evidence/browser-tests.json` are current automated results. They are local simulations, not physical-device, live-data or production acceptance.

## Corrected contract and boundaries

`epicurean.catalog/v1` remains a **pre-integration candidate**; no production reader depends on it. This correction changes its candidate shape. It deliberately rejects older pilot releases lacking required safety/accounting fields. It does not silently upgrade them. Preserve/export old local data and re-import from its original source; existing BOH storage keys are never read or changed.

| Entity | Authoritative meaning |
|---|---|
| Menu | Arbitrary stable ID/name, ordered section IDs, individual/package price rule, explicit package base cents, visibility/channels, availability reference |
| Section | One parent menu, ordered offerings, explicit `individual` or `included` price basis, selection bounds/automatic/deferred rule, structured fire timing |
| Offering | One section and reusable product reference, explicit standalone cents or null for included items, nonnegative upcharge, taxes, availability, optional menu-specific display label/description or wine pour |
| Product | Stable source identity, verified/declared/unknown allergen state, structured temperature reference/prompt, dietary claims, aliases, chooseCount/choices, wine components, photos, metadata and private original record |
| Rules | Reusable price behavior or selection bounds; menu names/types are not an enum |
| Import report | Per-source-record paths, mapped target IDs or explicit private-preservation reasons, and unresolved mappings that block publication |
| Release | Complete immutable hashed chunks, manifest/counts and content-derived ID; active pointer changes only after complete verification and expected-revision comparison |

`schema.json` and runtime `schema.mjs` are generated together with:

```sh
python catalog/tools/generate-schema.py
```

Runtime `schema-validation.mjs` checks this same schema's structure; `contract.mjs` adds referential, ownership, pricing, availability and accounting invariants that JSON Schema alone cannot express. Tests check artifact equality and eight independent Draft 2020-12 shape cases. Consumers must enable the documented custom `media-url` format checker: absolute HTTPS, valid host/port, no embedded username/password. The runtime uses URL parsing; the independent Python test registers the equivalent checker. Embedded data, javascript, file and credential-bearing photo URLs block publication. Originals remain privately preserved; rejected URLs are not deleted from source records.

### Allergen verification

A list is not verification. Nonempty unverified lists are `declared`, not orderable. Empty lists imported from legacy data are `unknown` even when `verified:true`; there is no implicit allergen-free certification. Nonempty declarations retain the existing explicit-verification flag. An empty declaration additionally requires an opaque approval from a trusted, configured local test authority, bound to the exact canonical recipe/subject and backed by its in-memory approval registry. A flag or imported proof JSON alone is rejected. The same rule applies to selectable flavors and ingredient modifiers. Any option declaring allergens requires verification regardless of modifier class. Ingredient/unknown options with empty declarations need explicit allergen-free approval. Explicit non-ingredient temperature/preference/price choices are not treated as ingredient safety assertions. Legacy temperature IDs retain their explicit structured options. Unknown required modifier groups make a product non-orderable. Dietary labels never certify allergen safety. The local approval API records verifier identity, reason, time and expiry, supports revocation, and rejects subject changes/replay. It is a mock workflow; real authorized recipe review, staff authentication, durable approval storage and cross-contact policy are not implemented. The browser pilot has no approval control and never silently approves empty data.

Public and voice views flag non-orderability, required-section satisfiability, verification status and missing choices. `calculatePrice` also rejects unverified products/choices, missing routes, and temperature prompts without structured choice groups. This is not a guest-allergy decision or authorized kitchen ordering engine. Existing application allergy policy remains untouched.

### One price calculation

`pricing.mjs::calculatePrice(release, request)` is the single authoritative catalog quote function. USD integer cents only; no transport or mutation.

- Package base × package quantity is charged once, separately from component lines.
- An included line has no standalone price: `(upcharge + selected signed modifier deltas) × quantity`.
- An individual/additional line is `(explicit offering price + upcharge + selected signed modifier deltas) × quantity`.
- Total is package base plus all component lines. Individual lines and aggregate package totals cannot be negative; included package components may carry a signed credit. Fractional cents, unsafe integer arithmetic, unknown/duplicate modifiers and invalid selection bounds are rejected.
- Active packages must have at least one required included course. Automatic courses require each offering exactly once per package quantity; repeated dishes cannot replace missing offerings. Required sections are enforced per package quantity. Initial quotes may explicitly list deferred sections as pending; complete quotes must satisfy them. `chooseCount` requires exactly that many distinct valid, verified choice IDs.
- Quotes retain release IDs. Existing `priceSnapshot` objects and immutable releases remain unchanged by later prices or rollback. This is not durable POS/open-check integration. Menu-level tax references and per-line tax references are retained separately in projections, snapshots and quotes. Tax rates are preserved metadata; tax/tip/payment calculation is not added in this milestone.

### Actual BOH STATE export and loss prevention

`state-exporter.mjs::exportBohState(state)` is a pure explicitly invoked function. It copies the actual local STATE catalog fields: `menuItems`, `menuCats`, `menuBooks`, `modGroups`, `taxRates`, `menuPhotos`, `retail`, `wineFlights`, `bar`, `wines`, `prixFixeMenus`, `tastingMenus`, `dailySpecials`, `ingredients`, voice-profile metadata and related cellar revision/code metadata. It excludes staff, guests, punches, sales, rooms/floor geometry and service stations. Unknown top-level fields block export for classification. It never reads globals/storage or executes seed functions.

`importLegacy` accepts that export or the earlier explicit `menu:{items,cats,books,...}` wrapper. It preserves the entire catalog-only source snapshot. Every source node/field gets an explicit ledger disposition under a typed policy; no unknown child inherits its parent's mapped status. Known private fields are explicitly reported as preserved; unknown fields are unresolved. missing ledger entries/targets or unresolved mappings block publication. Ingredients and retired-code references are explicitly retained privately, not invented as offerings. Missing categories, orphan photos, unplaced/mismatched course mirrors, missing flight wine references, unknown course behaviors and conflicting stable-product ordering metadata block publication.

Menu books use actual `groupIds`; arbitrary kind/name values remain generic. Legacy bar/wine/retail containers populate from their corresponding records. Food source IDs remain stable across ordinary books and fixed-course menus, including tasting `dishId` references. Independently owned source collections retain namespaces; no name-based cross-inventory identity guesses are made. Menu-specific labels are preserved on offerings; original variants are private. Conflicting metadata requires reconciliation, never silent overwrite. Existing unpublished/unavailable products remain preserved but cannot be quoted for ordering.

Fixed-price course choices default to required one-of selection; automatic courses require every included offering; deferred dessert remains required later. Dish `chooseCount` describes structured flavor selection separately. Explicit tasting `dessertMenuId`/course label resolves its deferred dessert source. Missing mappings block publication. No arbitrary dessert or standalone entremet price is invented.

Temperatures use explicit source group IDs (including legacy temperature modifier IDs) and existing options. No dish-name-based temperature guessing occurs. Photos recognize qualified `pfdish:menu|dish` and `tmcourse:menu|course` keys. Priced wine pairings become optional individually priced offerings under their source package; unresolved wine identities/pour quantities cannot be ordered. Free-text pairing suggestions remain labels and are never parsed into invented identities or prices. Wine group/pour/component identities, tax links, structured fire timing, dietary statements and voice aliases/profile overrides are retained. Unknown source date timezone blocks publication rather than guessing a schedule.

### Projection privacy and availability

All consumer projections use allowlists; voice/digital never receive raw legacy records, internal costs, provenance, stock quantities, arbitrary menu/section metadata or kitchen cook notes. POS receives only additional structured routing/cook fields, not the original raw records. Raw release storage remains private: client-side projection is not a substitute for backend access control.

Inactive, unavailable, sold-out/86, zero-stock and zero-ounce products cannot be quoted and are omitted from offering lists. A static shortage that makes an active required section unsatisfiable blocks publication. Schedule-dependent/verification/choice shortages are explicitly reported with section/menu non-orderability; direct quote validation enforces the requested time. Flight components must also be verified and available. Null stock means the source did not supply a stock count, not an invented stock quantity.

## Local pilot corrections

`pilot.html`/`pilot.mjs` remain separate and opt-in by opening that file through a local static origin. They are not linked from actual BOH. CSP denies connections and images. First use stays empty. Explicit import validates before replacing a draft.

Money inputs use dollars (e.g. `89.50` becomes 8950 cents). Existing menu name/base prices, section names, offering prices/upcharges, ordering and deletion are editable. Deletion affects only the candidate; original sources and published releases remain intact. Required-selection damage blocks publication. Rollback offers distinct historical releases, preserves the selected target across redraws, verifies it and resets the draft to it. Cross-tab storage comparison and Web Locks prevent stale drafts from overwriting another tab. Unsupported locking/persistence failures are reported rather than falling back to unsafe writes. This is a local editor, not multi-user backend concurrency control.

## Migration, rollback and remaining gates

1. Keep existing BOH publishing/readers and deployed applications unchanged. This candidate is not activated by them.
2. Independently review this commit and repeat the local tests. Do not treat representative STATE fixtures as a verified live catalog export.
3. Obtain separate authorization before real catalog exports, backend/emulator tests or deployed rules. Reconcile every source identity, menu, price, schedule, allergen verification, modifier, photo and route. Unsupported/inconsistent source shapes must remain blocked.
4. Implement compatible POS/digital/voice readers in separately approved milestones; verify migration equivalence and durable open-check price/release pinning. No such reader integration occurred here.
5. Review an authenticated publisher, immutable private storage, server-safe public projections, transactional activation, retention and recovery. The mock's in-process CAS and browser local-storage recovery are not Firestore atomicity/durability claims.
6. Require explicit owner approval before any production activation/deployment. No live-data or integration-readiness claim is made.

Local rollback selects a verified old release; old check snapshots remain untouched. Code rollback is to stop opening the pilot or revert this isolated corrective commit. Existing BOH has no migration to undo. Old candidate schemas may require explicit source re-import; originals are never silently normalized. Production rollback is not implemented or exercised.

Remaining limitations: authentic **tracked** data plus representative STATE structures were tested, but complete actual restaurant STATE exports were not supplied/verified. Some authentic records have unverified/empty allergens, missing explicit temperature choices or routing and intentionally remain non-orderable. Media requiring data URLs or unresolved source mappings remain blocked. No actual-app integration, backend authorization/durability, physical iPhone acceptance, SEND/FIRE, payments, deployments or paid services were exercised.

Exact changed paths are recorded in `evidence/changed-files.txt`; regression evidence is stored alongside it. Stop for independent review.

Actual normalized seed-STATE blocker: `mmAttachTemps` assigns meat and fish groups to the salmon “Forrestiere” prix-fixe dish while its tasting variant has only fish. This fixture is explicitly BLOCKED. The test asserting refusal passes; that is not a successful catalog migration. No source repair was made.
