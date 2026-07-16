# Frontend bundle report: generated chunk handling

## Background

The frontend bundle report compares the Vite manifests produced for the pull request base and head builds. Chunks with a `src` value are currently identified by that source path. Chunks without `src` are identified by Rolldown's generated `name`.

Generated names are not unique or stable identities. Multiple unrelated shared chunks can all be called `dist`, `esm`, `index`, or a similar path-derived name. The current collection logic stores those chunks in a `Map` under `chunk:<name>`, so later entries overwrite earlier entries. This produces two problems:

1. unrelated chunks can be compared as if they were the same chunk; and
2. overwritten chunks are omitted from the reported total.

Individual size changes for these generated shared chunks are not sufficiently actionable to justify heuristic matching.

## Goals

- Never compare unrelated generated chunks as the same chunk.
- Keep generated chunks out of the individual chunk-diff rows.
- Preserve the contribution of every physical JavaScript chunk in totals.
- Show the aggregate size change of generated chunks so unexplained bundle growth remains visible.
- Apply the same rules to the full chunk report and the startup chunk report.
- Continue comparing source-backed chunks and intentionally named chunks.

## Non-goals

- Inferring chunk identity from module-set similarity.
- Preserving an `updated` relationship for every shared chunk after code splitting changes.
- Changing the frontend's code-splitting strategy or output filenames.
- Suppressing specific names such as `esm` or `dist` with a denylist.

## Approaches considered

### Denylist generated-looking names

Exclude names such as `esm`, `dist`, `lib`, and `index`.

This is not selected because Rolldown can generate many other names, and a denylist can also hide an intentionally named chunk. It would leave the underlying name collision and total-size bug in place.

### Compare only stable identities and aggregate the rest

Classify chunks by whether the report has a stable semantic identity. Source-backed chunks and explicitly supported manual chunk names remain individually comparable. All other generated chunks are retained as physical files but shown only as an aggregate.

This is the selected approach. It removes false comparisons without introducing matching heuristics, and it keeps all bytes visible.

### Match shared chunks by their module sets

Use visualizer metadata to compare exact or similar sets of module IDs.

This could retain more individual diffs, but splits, merges, dependency-version paths, and small module movements make the matching policy complex and potentially misleading. It can be added later if aggregate data proves insufficient.

## Design

### Separate physical chunks from comparable identities

`collectReport` will no longer use a single map keyed by the comparison identity as its source of truth. It will collect every resolved JavaScript output file exactly once into a physical chunk collection.

Each physical chunk contains:

- its resolved relative output path;
- its byte size;
- its manifest key, when present;
- its display name; and
- an optional comparison key.

The physical output path is used only for de-duplication within one build. It is not used to match changed chunks across builds.

### Comparison-key classification

A chunk receives a comparison key only in one of these cases:

1. `chunk.src` is present: use `src:<normalized source path>`.
2. `chunk.name` is in an explicit allowlist of intentionally stable manual chunks: use `named:<name>`.

The initial stable-name allowlist is:

- `vue`
- `i18n`

These names correspond to the explicit `codeSplitting.groups` configuration in `packages/frontend/vite.config.ts`.

All other manifest chunks without `src`, including generated names such as `esm` and `dist`, receive no comparison key. JavaScript files found in the localized output directory but absent from the manifest also receive no comparison key.

If a supposedly stable comparison key occurs more than once within one build, the report must not silently overwrite it. Collection will fail with a descriptive error because duplicate `src` or allowlisted manual names violate the assumptions required for a correct comparison.

### Full chunk report

The report computes three independent values:

1. **Total:** the sum of every unique physical JavaScript chunk.
2. **Generated chunk aggregate:** the sum of chunks without a comparison key.
3. **Individual rows:** before/after comparisons for stable comparison keys only.

The table starts with the existing `(total)` row. Generated chunks are rendered at the bottom of the table as one aggregate row such as:

```text
(other generated chunks)
```

This row compares aggregate sizes, not individual chunk identities. Generated chunks do not participate in the updated/added/removed row counts.

The report includes a short note stating how many generated chunks were grouped on each side. This makes the scope of the aggregate explicit without listing noisy filenames.

### Small-delta aggregation

Stable comparison rows whose absolute byte delta is at most `5 B` are grouped into an `(other)` aggregate instead of being rendered individually. The threshold is inclusive: deltas from `-5 B` through `+5 B` are grouped, while a `6 B` absolute delta remains an individual row. Small additions and removals are handled by the same rule.

The `(other)` row reports the sum of the grouped chunks' before sizes and the sum of their after sizes. It does not expose an arbitrary representative filename. In the full chunk report, only changed rows are candidates because unchanged rows are already omitted. In the startup report, all rows currently eligible for display are candidates, so unchanged rows are also grouped instead of being listed individually.

The updated/added/removed counts are calculated before small-delta rows are grouped. Therefore the summary continues to include every stable changed chunk, including chunks represented only by `(other)`.

Table rows are ordered as follows:

1. `(total)`;
2. individual stable comparison rows whose absolute delta is greater than `5 B`;
3. one empty separator row, when at least one aggregate row follows;
4. `(other generated chunks)`, when generated chunks exist; and
5. `(other)`, when small-delta stable chunks exist.

The existing 30-row limit applies after small-delta rows have been removed from the individual-row candidates.

### Startup chunk report

Startup traversal continues to follow the entry chunk's static `imports`, but it records manifest keys or resolved physical file paths rather than generated comparison keys. This prevents two startup chunks named `dist` from collapsing into one.

Startup totals include every unique physical startup chunk. Stable startup chunks receive individual rows, while startup chunks without stable identities contribute to the same `(other generated chunks)` aggregate row within the startup table.

### Displayed filenames

For an individually comparable chunk, the details should expose both filenames when they differ. A single before-side filename must not imply that the after size belongs to that same file.

The display can use one filename when unchanged and `before → after` when the content-hashed filename differs.

The generated aggregate row does not display an arbitrary representative filename.

## Data flow

1. Read each build's Vite manifest.
2. Resolve localized output files and collect unique physical chunks.
3. Attach optional stable comparison keys using the classification rules.
4. Traverse startup imports using manifest identities and map them to physical chunks.
5. Calculate full and startup totals from physical chunks.
6. Calculate generated aggregates from chunks without comparison keys.
7. Compare only unique stable keys for individual rows.
8. Render totals, generated aggregates, and stable rows.

## Error handling

- A manifest entry whose expected localized JavaScript file is absent remains a fatal report-generation error.
- Duplicate physical output paths are de-duplicated and counted once.
- Duplicate stable comparison keys fail with an error that includes the key and conflicting files.
- Missing or malformed manifest data remains fatal rather than producing a partial report.

## Testing

Add focused fixtures or pure-function tests covering:

- two unrelated `dist` chunks are both counted in total and grouped into the generated aggregate;
- `dist` and `esm` chunks never produce individual comparison rows;
- source-backed chunks with the same `src` are reported as updated;
- source-backed additions and removals remain visible;
- allowlisted `vue` and `i18n` chunks remain individually comparable;
- duplicate stable keys produce a descriptive error instead of overwriting;
- full totals equal the sum of all unique physical chunks;
- startup totals include multiple same-name generated chunks exactly once each;
- generated aggregate changes do not affect the updated/added/removed summary counts;
- differing before/after filenames are rendered without attributing both sizes to one file;
- deltas of exactly `5 B` are grouped into `(other)`, while `6 B` deltas remain individual;
- small updated, added, and removed chunks remain included in the summary counts;
- `(other generated chunks)` and `(other)` appear below individual rows after an empty separator row; and
- the same small-delta and ordering rules apply to the full and startup tables.

Validation should include the focused tests and repository lint. No CHANGELOG entry is required because this changes developer-facing CI reporting rather than Misskey user behavior.

## Future extension

If aggregate generated-chunk data is later found insufficient, visualizer module metadata can support a separate opt-in analysis. That extension must preserve the physical-chunk accounting introduced here and must not reintroduce name-based identity.
