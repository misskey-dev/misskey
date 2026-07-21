# Backend diagnostics memory noise design

## Context

The backend diagnostics workflow starts the base and head backends repeatedly and reports V8 heap, PSS, and USS differences. The current workflow already uses warmup runs, interleaved base/head execution, explicit GC, stability polling, ten samples per side, and median aggregation.

Despite those measures, cold starts settle at different PSS and USS levels. A representative run for PR #17756 had effectively identical V8 memory (`HeapUsed` median difference 0 KiB and heap snapshot total difference below 1 KiB), while its PSS paired differences ranged from about -14.7 MB to +10.8 MB. The report displayed a +2.9 MB median paired difference even though the displayed base and head medians differed by only about +0.5 MB.

The variation is concentrated in `Private_Dirty`, rather than `Shared_Clean` or live V8 objects. Explicit GC does not normalize V8 committed pages, native allocator slack, or other private dirty mappings. In addition, the current report treats independently started processes with the same round number as a meaningful pair. Therefore `median(head[i] - base[i])` can diverge substantially from the difference between the reported head and base medians.

## Goals

- Do not present a difference within observed cold-start noise as a meaningful increase or decrease.
- Make the displayed delta arithmetically consistent with the displayed base and head values.
- Improve the stability of the point estimate without increasing the workflow duration beyond approximately 1.5 times its current duration.
- Preserve PSS and USS as coarse whole-process footprint signals while keeping V8 heap metrics available for precise object-retention diagnosis.
- Surface insufficient or non-converged measurements instead of silently assigning them a verdict.

## Non-goals

- Reliably detecting a 3 MB PSS or USS change on GitHub-hosted runners. The observed cold-start spread is too large for that guarantee within the accepted runtime budget.
- Making PSS or USS deterministic by changing production-like Node.js allocator or V8 flags.
- Introducing a dedicated runner, long-running baseline database, or cross-workflow historical baseline.
- Changing Misskey backend runtime behavior.

## Selected approach

Use independent-sample aggregation for the backend memory report and the shared heap snapshot table used by both backend and frontend diagnostics. Make report coloring noise-aware, increase backend memory sampling from ten to fifteen rounds per side, and limit backend heap snapshot collection to the final three rounds per side.

This is preferred over a display-only fix because fifteen cold starts modestly stabilize the median. It is preferred over bootstrap confidence intervals or dedicated-runner calibration because the primary requirement is conservative presentation, and the existing MAD-based report already provides an understandable measure of observed spread.

## Measurement flow

1. Keep one warmup round per side. Warmup samples are not included in summaries and do not collect heap snapshots.
2. Run fifteen measured rounds per side.
3. Continue alternating execution order (`base -> head`, then `head -> base`) to distribute slow runner drift and order effects across both sides.
4. Continue resetting PostgreSQL and Redis and running the target checkout's migrations before every sample.
5. Continue triggering explicit GC and waiting for within-process PSS and `Private_Dirty` slopes to settle before reading memory.
6. Collect heap snapshots only during the final three measured rounds. PSS and USS are read before snapshot creation, as they are today. Restricting snapshots to the tail prevents snapshot parsing from affecting most memory samples and reduces the expensive snapshot count from twenty to six.
7. Keep every measured sample in the JSON artifact, including its convergence metadata. Do not silently discard a non-converged sample.

The workflow will set:

- `MK_MEMORY_COMPARE_ROUNDS=15`
- `MK_MEMORY_COMPARE_WARMUP_ROUNDS=1`
- `MK_MEMORY_HEAP_SNAPSHOT_ROUNDS=3`

The comparison harness will clamp the configured snapshot count to the total measured round count. When heap snapshots are disabled, the snapshot-round setting has no effect.

## Independent-sample summary

Introduce a shared helper named `independentDeltaSummary` without changing `pairedDeltaSummary`, because other diagnostics may still intentionally use paired samples.

For a metric with finite base values `B` and head values `H`, calculate:

- `baseMedian = median(B)`
- `headMedian = median(H)`
- `delta = headMedian - baseMedian`
- `baseMad = MAD(B)`
- `headMad = MAD(H)`
- `combinedMad = hypot(baseMad, headMad)`

The delta must always equal the head value shown in the report minus the base value shown in the report. Round numbers remain useful for execution tracing but do not define statistical pairs for backend cold starts.

Classify the result as follows:

- `inconclusive`: either side has fewer than two finite samples, or any memory sample on either side did not converge.
- `within noise`: `abs(delta) <= 3 * combinedMad`.
- `increase`: `delta > 3 * combinedMad`.
- `decrease`: `delta < -3 * combinedMad`.

The three-times-combined-MAD rule is a deliberately conservative heuristic based on observed sample spread, not a formal confidence interval. It matches the intent of the existing warning guard while applying the same rule consistently to table presentation.

## Report presentation

Change the main backend memory table to:

| Metric | Base | Head | Delta | Combined MAD | Result |
| --- | ---: | ---: | ---: | ---: | --- |

- Base and Head continue to show median and individual MAD.
- Delta shows `headMedian - baseMedian` and its percentage relative to `baseMedian`.
- Combined MAD shows the noise scale used for the verdict.
- A displayed delta is colored orange or green only when both conditions hold: the verdict is `increase` or `decrease`, and that displayed value exceeds its existing display-level threshold. The existing thresholds remain 100 KiB for an absolute backend memory delta and 0.1 percentage points for its percentage delta.
- A `within noise` or `inconclusive` delta remains uncolored.
- Remove paired-delta MAD/min/max columns from the main backend report because their pairing is arbitrary for independent process starts. Raw samples remain downloadable in the JSON artifacts.
- Add a short note explaining the sample count, median/MAD notation, and the three-times-combined-MAD verdict rule.
- If any memory sample did not converge, add a visible warning and mark memory verdicts inconclusive.

Apply the same independent delta calculation and noise-aware coloring to the shared V8 heap snapshot table. The shared `HeapSnapshotReport` input shape remains unchanged: it continues to contain a summary and `{ round, data }` samples, which are sufficient for calculating independent medians and MADs. The existing heap snapshot display thresholds remain 100,000 bytes for an absolute delta and 0.1 percentage points for its percentage delta.

The shared heap snapshot table also uses `Metric | Base | Head | Delta | Combined MAD | Result`. Preserve its category swatches, category composition details, and the Total row's percentage presentation, but remove the arbitrary paired-delta MAD/min/max columns. Values displayed as Base and Head come from the same independent summary as Delta so that the displayed arithmetic is consistent.

Both backend and frontend diagnostics call the shared `renderHeapSnapshotTable`, so both reports receive the corrected table format and statistics. This does not require changes to the frontend workflow YAML, browser measurement JSON, or frontend adapter. The backend adapter filters out samples without a snapshot before constructing `HeapSnapshotReport`, because only its final three measured rounds contain snapshots. Other frontend diagnostics tables remain unchanged.

Only samples containing a snapshot participate in snapshot medians and MADs. Snapshot verdicts depend on snapshot sample sufficiency, not PSS convergence.

The existing PSS warning remains limited to increases greater than 5%, but it must also require an `increase` verdict from the common noise classification.

For the observed PR #17756 data, the corrected PSS row should be approximately:

- Base: 297.8 MB +/- 5.9 MB
- Head: 298.3 MB +/- 4.4 MB
- Delta: +0.5 MB (+0.2%), uncolored
- Combined MAD: about 7.3 MB
- Result: `within noise`

## Failure and edge-case handling

- Fewer than two finite values must produce `inconclusive`; report rendering must not throw solely because MAD cannot be calculated.
- A snapshot configuration greater than the measured round count is clamped to that count.
- If heap snapshots are enabled but none are successfully produced, retain the workflow's current artifact failure behavior rather than publishing a partial successful report.
- A zero combined MAD permits a meaningful verdict for a non-zero delta, subject to the metric's existing minimum color threshold.
- A zero base value renders the delta percentage as unavailable instead of dividing by zero.

## Testing

Add or update focused tests for:

- Independent delta summary: medians, individual MADs, combined MAD, and unequal base/head sample counts.
- The regression shape from PR #17756: a paired median near +2.9 MB but a difference of medians near +0.5 MB must render the latter as `within noise` and without increase coloring.
- A clear positive and negative change beyond three times combined MAD.
- Fewer than two valid samples producing `inconclusive` without throwing.
- A non-converged memory sample forcing an inconclusive memory verdict.
- Snapshot summaries ignoring rounds without snapshots while still selecting a representative artifact from the final snapshot rounds.
- Updated backend and frontend Markdown golden output for the shared heap snapshot table. The frontend workflow and measurement fixture formats remain unchanged.

Run the diagnostics package tests and type/lint checks during implementation. Before handoff, run the Misskey shipping checklist appropriate to the changed workflow and packages.

## Acceptance criteria

- The reported delta equals the displayed head median minus the displayed base median for every backend memory and heap snapshot metric.
- PSS/USS differences within three times combined MAD are not colored as regressions or improvements.
- Non-converged or undersampled measurements are visibly inconclusive.
- The backend workflow records fifteen memory samples and three heap snapshot samples per side.
- Representative base and head heap snapshot artifacts are still uploaded.
- Backend and frontend heap snapshot tables use the shared independent-sample calculation without changing `HeapSnapshotReport` or either workflow's artifact format.
- The frontend workflow YAML and browser measurement collection remain unchanged; only its generated heap snapshot table and corresponding Markdown golden output change.
- The backend diagnostics, frontend diagnostics, and shared diagnostics test suites pass.
- Total workflow duration remains at or below approximately 1.5 times the current duration; if the first real run exceeds that bound, reduce measured rounds while keeping the aggregation and presentation changes.
