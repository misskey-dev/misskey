# Frontend Diagnostics Metric Noise Design

## Goal

Make the top-level browser Metric table in Frontend Diagnostics use the same conservative independent-sample presentation as the backend memory table. The report should suppress changes that are explainable by observed run-to-run noise while retaining the existing per-metric display thresholds.

## Scope

Change only the top-level Metric table rendered by `packages-private/diagnostics-frontend/src/report.ts`.

The following remain unchanged:

- Requests by resource type
- V8 heap snapshot statistics
- Bundle Stats and visualizer tables
- Browser measurement and report JSON types
- Frontend diagnostics workflows
- Detailed browser diagnostics HTML
- Shared Markdown-table rendering APIs

Renderer commonization between backend and frontend is explicitly deferred to a later change. This implementation only reuses the existing shared independent-sample statistics primitive.

## Statistical Model

Frontend base and head browser samples are produced by separate sequential server/browser runs, so round numbers do not establish meaningful statistical pairs. For each metric:

- Base value is the median of finite base samples.
- Head value is the median of finite head samples.
- Delta is `headMedian - baseMedian`.
- Base and head noise are their respective median absolute deviations (MADs).
- Displayed MAD is the combined noise `hypot(baseMad, headMad)`.
- The result is `inconclusive` when either side has fewer than two finite samples.
- The result is `within noise` when `abs(delta) <= 3 * combinedMad`.
- Otherwise the result is `increase` or `decrease` according to the sign of delta.

These rules are supplied by `independentDeltaSummary`; `pairedDeltaSummary` is no longer used by this table.

## Table Presentation

Use this six-column layout:

```text
Metric | @ Base | @ Head | Δ | MAD | Result
```

- Base and Head are rendered as `median ± MAD` using the metric's existing formatter.
- Delta contains the absolute delta and relative delta on separate lines.
- Relative delta is `(delta / baseMedian) * 100`; it is `-` when the base median is zero or unavailable.
- MAD displays the combined MAD.
- Result displays the independent-sample verdict.

The existing absolute thresholds remain unchanged:

- Count metrics: `1`
- Byte metrics: `10,000` bytes

The relative-delta color threshold is `0.1%`, matching the backend memory table.

Absolute and relative values are colored independently. A value is colored only when the verdict is directional (`increase` or `decrease`) and that value reaches its own threshold.

## Row Visibility

The compact frontend table continues to show only meaningful changes. A row is included only when both conditions are true:

1. The verdict is `increase` or `decrease` (the delta is outside observed noise).
2. The absolute delta reaches the metric's existing absolute display threshold.

Rows with `within noise` or `inconclusive` are hidden even when their raw delta reaches the display threshold. Directional rows below the existing absolute threshold are also hidden.

The explanatory note below the table will state that values are medians with MAD, delta is Head minus Base, and only changes outside observed noise that reach the display threshold are shown.

## Implementation Boundary

`packages-private/diagnostics-frontend/src/report.ts` remains responsible for:

- selecting each browser metric through its sample accessor;
- calling `independentDeltaSummary`;
- applying frontend row-visibility rules;
- formatting the six-column Markdown row;
- retaining the existing absolute thresholds.

No new generic renderer is added to `diagnostics-shared`. Backend rendering is not modified.

## Edge Cases

- Non-finite sample values are ignored by the shared statistic.
- Fewer than two finite samples on either side produces `inconclusive`, so the row is hidden.
- A zero base median renders the relative delta as `-` without affecting the absolute delta.
- A zero combined MAD permits any non-zero delta to be directional, subject to the existing display threshold.
- An empty set of visible rows leaves the table header and explanatory note; no separate empty-state behavior is introduced.

## Testing

Add focused frontend report tests that verify:

- displayed delta is the difference of independent medians rather than the paired median delta;
- a threshold-sized delta is hidden when it remains within observed noise;
- a directional delta below the existing absolute threshold is hidden;
- a clear directional change is shown with Base/Head median and MAD, absolute and relative delta, combined MAD, and Result;
- absolute and relative color thresholds remain independent;
- a zero base median renders `-` for the relative delta;
- insufficient samples hide the row without throwing.

Update the frontend Markdown golden and confirm that only the top-level Metric table and its explanatory note change. All other report sections must remain byte-for-byte unchanged apart from context required by the updated golden.
