# Frontend Diagnostics Metric Noise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the top-level Frontend Diagnostics browser Metric table suppress independent-run noise and use the same six-column median/MAD presentation as the backend memory table.

**Architecture:** Keep the change local to `diagnostics-frontend`. Replace paired round deltas with the existing shared `independentDeltaSummary`, compute visibility from the independent verdict plus each metric's existing absolute threshold, and render Base/Head median and MAD, absolute and relative delta, combined MAD, and Result directly in `report.ts`. Do not introduce a shared generic table renderer.

**Tech Stack:** TypeScript 5.9, Vitest 4, pnpm workspaces, Markdown golden tests.

## Global Constraints

- Change only the top-level browser Metric table and its explanatory note.
- Leave Requests by resource type, V8 heap snapshot statistics, Bundle Stats, visualizer tables, detailed HTML, browser JSON types, and workflows unchanged.
- Use `delta = median(head) - median(base)` and `combinedMad = hypot(baseMad, headMad)` through `independentDeltaSummary`.
- Hide `within noise` and `inconclusive` rows.
- Show a directional row only when its absolute delta reaches the existing threshold: `1` for count metrics and `10,000` bytes for byte metrics.
- Render absolute and relative deltas on separate lines; use `0.1%` as the independent relative color threshold and render `-` when the base median is zero.
- Color a displayed value only when the verdict is directional and that value reaches its own threshold.
- Do not add a shared Markdown-table renderer in this change.
- Remove this plan and its design spec before final handoff so `docs/superpowers` does not remain in the final PR diff.

## File Structure

- Modify `packages-private/diagnostics-frontend/src/report.ts`: compute independent summaries, filter noise, and render the six-column table.
- Modify `packages-private/diagnostics-frontend/test/report.test.ts`: add focused report-level regression tests around independent statistics, row visibility, percentages, and insufficient samples.
- Modify `packages-private/diagnostics-frontend/test/__snapshots__/report.md`: update only the top-level Metric table and its note.
- Delete `docs/superpowers/specs/2026-07-21-frontend-diagnostics-metric-noise-design.md` after implementation validation.
- Delete `docs/superpowers/plans/2026-07-21-frontend-diagnostics-metric-noise.md` after implementation validation.

---

### Task 1: Convert the Frontend Metric table to independent summaries

**Files:**
- Modify: `packages-private/diagnostics-frontend/src/report.ts`
- Test: `packages-private/diagnostics-frontend/test/report.test.ts`
- Test: `packages-private/diagnostics-frontend/test/__snapshots__/report.md`

**Interfaces:**
- Consumes: `independentDeltaSummary<T>(baseSamples, headSamples, getValue)` from `diagnostics-shared/stats`.
- Preserves: `renderFrontendDiagnosticsMarkdown(input: FrontendDiagnosticsMarkdownInput): string` and every report input type.
- Produces: the top-level table `Metric | @ Base | @ Head | Δ | MAD | Result` with frontend-local row filtering.

- [ ] **Step 1: Add report-test helpers for controlled metric samples**

In `packages-private/diagnostics-frontend/test/report.test.ts`, replace the browser type import with:

```ts
import type { BrowserMeasurementSample, BrowserMetricsReport } from '../src/browser/types';
```

Replace `renderReport` with this version and add the two helpers immediately after it:

```ts
type BrowserReports = {
	base: BrowserMetricsReport;
	head: BrowserMetricsReport;
};

async function renderReport(detailedHtmlUrl: string | null, reports?: BrowserReports) {
	const base = reports?.base ?? await loadBrowserReport('base');
	const head = reports?.head ?? await loadBrowserReport('head');

	return renderFrontendDiagnosticsMarkdown({
		bundle: {
			base: await collectBundleReport(repoDirs.base),
			head: await collectBundleReport(repoDirs.head),
			baseStats: await loadBundleStats('base'),
			headStats: await loadBundleStats('head'),
			visualizerArtifactUrl: 'https://example.invalid/treemap',
		},
		browser: {
			base,
			head,
			baseHeapSnapshotUrl: 'https://example.invalid/base',
			headHeapSnapshotUrl: 'https://example.invalid/head',
			detailedHtmlUrl,
		},
	});
}

function withMetricSamples(
	report: BrowserMetricsReport,
	values: number[],
	setValue: (sample: BrowserMeasurementSample, value: number) => void,
): BrowserMetricsReport {
	const cloned = structuredClone(report);
	const samples = values.map((value, index) => {
		const sample = structuredClone(cloned.samples[index % cloned.samples.length]);
		sample.round = index + 1;
		setValue(sample, value);
		return sample;
	});

	return {
		...cloned,
		sampleCount: samples.length,
		samples,
	};
}

function requireMetricRow(markdown: string, label: string) {
	const row = markdown.split('\n').find(line => line.startsWith(`| **${label}** |`));
	if (row == null) throw new Error(`Metric row not found: ${label}`);
	return row;
}
```

- [ ] **Step 2: Add failing tests for independent medians and noise-aware visibility**

Append these tests to `packages-private/diagnostics-frontend/test/report.test.ts`:

```ts
test('renders the difference of independent medians instead of the paired median delta', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100, 100, 100, 1_000, 1_000],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[0, 0, 200, 200, 200],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Requests');

	expect(row).toContain('100 <br> ± 0');
	expect(row).toContain('200 <br> ± 0');
	expect(row).toContain('$\\color{orange}{\\text{+100}}$<br>$\\color{orange}{\\text{+100\\\\%}}$');
	expect(row).toContain('| 0 | increase |');
	expect(row).not.toContain('\\color{green}');
});

test('hides a threshold-sized change that remains within observed noise', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100, 110, 120],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[110, 120, 130],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const markdown = await renderReport(null, { base, head });

	expect(markdown).not.toContain('| **Requests** |');
});

test('hides a directional byte change below the existing absolute threshold', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[1_000_000, 1_000_000, 1_000_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[1_005_000, 1_005_000, 1_005_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);

	const markdown = await renderReport(null, { base, head });

	expect(markdown).not.toContain('| **Encoded network** |');
});

test('colours absolute and relative deltas using independent thresholds', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100_000_000, 100_000_000, 100_000_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[100_020_000, 100_020_000, 100_020_000],
		(sample, value) => { sample.network.totalEncodedBytes = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Encoded network');

	expect(row).toContain('100 MB <br> ± 0 B');
	expect(row).toContain('$\\color{orange}{\\text{+20 KB}}$<br>$\\text{+0\\\\%}$');
	expect(row).toContain('| 0 B | increase |');
});

test('renders an unavailable relative delta when the base median is zero', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[0, 0, 0],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[2, 2, 2],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const row = requireMetricRow(await renderReport(null, { base, head }), 'Requests');

	expect(row).toContain('$\\color{orange}{\\text{+2}}$<br>-');
	expect(row).toContain('increase');
});

test('hides an inconclusive metric with fewer than two samples on one side', async () => {
	const base = withMetricSamples(
		await loadBrowserReport('base'),
		[100],
		(sample, value) => { sample.network.requestCount = value; },
	);
	const head = withMetricSamples(
		await loadBrowserReport('head'),
		[102, 102],
		(sample, value) => { sample.network.requestCount = value; },
	);

	const markdown = await renderReport(null, { base, head });

	expect(markdown).not.toContain('| **Requests** |');
});
```

- [ ] **Step 3: Run the focused report test and verify the paired renderer fails**

Run:

```powershell
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts
```

Expected: FAIL. The current table lacks the six-column independent presentation, uses paired deltas, shows a within-noise Requests row, and does not render relative deltas.

- [ ] **Step 4: Replace paired row formatting with frontend-local independent formatting**

In `packages-private/diagnostics-frontend/src/report.ts`, replace the format and stats imports with:

```ts
import { formatBytes, formatColoredDelta, formatDeltaPercentInMdTable, formatNumber } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from 'diagnostics-shared/stats';
```

Replace `renderMetricRow` and add its helpers with this code:

```ts
const percentColorThreshold = 0.1;

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatOptionalMetricValue(value: number | null, formatter: (value: number) => string) {
	return value == null ? '-' : formatter(value);
}

function formatMetricMedianWithMad(
	value: number | null,
	spread: number | null,
	formatter: (value: number) => string,
) {
	if (value == null) return '-';
	return `${formatter(value)} <br> ± ${formatOptionalMetricValue(spread, formatter)}`;
}

function formatMetricDelta(
	summary: IndependentDeltaSummary,
	formatter: (value: number) => string,
	absoluteThreshold: number,
) {
	if (summary.delta == null) return '-';
	return formatColoredDelta(
		summary.delta,
		formatter,
		isDirectionalVerdict(summary.verdict) ? absoluteThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatMetricDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return '-';
	const percent = summary.delta * 100 / summary.baseMedian;
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function renderMetricRow(
	label: string,
	base: BrowserMetricsReport,
	head: BrowserMetricsReport,
	getSampleValue: (sample: BrowserMeasurementSample) => number,
	formatter: (value: number) => string,
	significantThreshold: number,
) {
	const summary = independentDeltaSummary(base.samples, head.samples, getSampleValue);
	if (!isDirectionalVerdict(summary.verdict) || summary.delta == null || Math.abs(summary.delta) < significantThreshold) return null;

	const delta = `${formatMetricDelta(summary, formatter, significantThreshold)}<br>${formatMetricDeltaPercent(summary)}`;
	return `| **${label}** | ${formatMetricMedianWithMad(summary.baseMedian, summary.baseMad, formatter)} | ${formatMetricMedianWithMad(summary.headMedian, summary.headMad, formatter)} | ${delta} | ${formatOptionalMetricValue(summary.combinedMad, formatter)} | ${summary.verdict} |`;
}
```

Replace `renderBrowserSummaryTable` with this version. Keep the existing commented metric candidates, but update their argument shape as shown so they remain accurate examples:

```ts
function renderBrowserSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	//function getMetric(report: BrowserMeasurementSample, key: string) {
	//	return report.performance.cdpMetrics[key];
	//}

	const rows = [
		//renderMetricRow('Scenario duration', base, head, sample => sample.durationMs, formatMs, 0),
		renderMetricRow('Requests', base, head, sample => sample.network.requestCount, formatNumber, 1),
		//renderMetricRow('Failed requests', base, head, sample => sample.network.failedRequestCount, formatNumber, 1),
		renderMetricRow('Encoded network', base, head, sample => sample.network.totalEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Decoded body', base, head, sample => sample.network.totalDecodedBodyBytes, formatBytes, 10_000),
		renderMetricRow('Same-origin encoded', base, head, sample => sample.network.sameOriginEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Third-party encoded', base, head, sample => sample.network.thirdPartyEncodedBytes, formatBytes, 10_000),
		renderMetricRow('Script encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Script']), formatBytes, 10_000),
		renderMetricRow('Stylesheet encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Stylesheet']), formatBytes, 10_000),
		renderMetricRow('Fetch/XHR encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']), formatBytes, 10_000),
		renderMetricRow('Image encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Image']), formatBytes, 10_000),
		renderMetricRow('Font encoded', base, head, sample => resourceTypeSampleBytes(sample, ['Font']), formatBytes, 10_000),
		//renderMetricRow('First contentful paint', base, head, sample => sample.performance.webVitals.firstContentfulPaintMs, formatMs, 0),
		//renderMetricRow('Load event end', base, head, sample => sample.performance.webVitals.loadEventEndMs, formatMs, 0),
		//renderMetricRow('Long tasks', base, head, sample => sample.performance.webVitals.longTaskCount, formatNumber, 1),
		//renderMetricRow('Long task duration', base, head, sample => sample.performance.webVitals.longTaskDurationMs, formatMs, 0),
		//renderMetricRow('Max long task', base, head, sample => sample.performance.webVitals.maxLongTaskDurationMs, formatMs, 0),
		//renderMetricRow('JS heap used', base, head, sample => sample.performance.runtimeHeap?.usedSize ?? getMetric(sample, 'JSHeapUsedSize'), formatBytes, 10_000),
		//renderMetricRow('JS heap total', base, head, sample => sample.performance.runtimeHeap?.totalSize ?? getMetric(sample, 'JSHeapTotalSize'), formatBytes, 10_000),
		//renderMetricRow('V8 heap snapshot total', base, head, sample => sample.heapSnapshot.categories.total, formatBytes, 10_000),
		//renderMetricRow('DOM elements', base, head, sample => sample.performance.webVitals.domElements, formatNumber, 1),
		//renderMetricRow('CDP nodes', base, head, sample => getMetric(sample, 'Nodes'), formatNumber, 1),
		//renderMetricRow('JS event listeners', base, head, sample => getMetric(sample, 'JSEventListeners'), formatNumber, 1),
		//renderMetricRow('Layout count', base, head, sample => getMetric(sample, 'LayoutCount'), formatNumber, 1),
		//renderMetricRow('Recalc style count', base, head, sample => getMetric(sample, 'RecalcStyleCount'), formatNumber, 1),
		//renderMetricRow('Script duration', base, head, sample => getMetric(sample, 'ScriptDuration'), formatSecondsAsMs, 0),
		//renderMetricRow('Task duration', base, head, sample => getMetric(sample, 'TaskDuration'), formatSecondsAsMs, 0),
		renderMetricRow('WebSocket connections', base, head, sample => sample.network.webSocketConnectionCount, formatNumber, 1),
		renderMetricRow('WebSocket sent', base, head, sample => sample.network.webSocketSentBytes, formatBytes, 10_000),
		renderMetricRow('WebSocket received', base, head, sample => sample.network.webSocketReceivedBytes, formatBytes, 10_000),
		renderMetricRow('Page errors', base, head, sample => sample.diagnostics.pageErrorCount, formatNumber, 1),
		renderMetricRow('Console log', base, head, sample => sample.diagnostics.console.log, formatNumber, 1),
		renderMetricRow('Console warnings', base, head, sample => sample.diagnostics.console.warning, formatNumber, 1),
		renderMetricRow('Console errors', base, head, sample => sample.diagnostics.console.error, formatNumber, 1),
		renderMetricRow('Console info', base, head, sample => sample.diagnostics.console.info, formatNumber, 1),
		renderMetricRow('Page-attributed memory', base, head, sample => sample.performance.tabMemory.totalBytes, formatBytes, 10_000),
	].filter(row => row != null);

	return [
		'| Metric | @ Base | @ Head | Δ | MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
		...rows,
	].join('\n');
}
```

Remove the now-unused `BrowserMeasurement` import and the `resourceTypeBytes` helper. Keep `resourceTypeSampleBytes`, implemented directly as:

```ts
function resourceTypeSampleBytes(sample: BrowserMeasurementSample, resourceTypes: string[]) {
	return resourceTypes.reduce((sum, resourceType) => sum + (sample.network.byResourceType[resourceType]?.encodedBytes ?? 0), 0);
}
```

- [ ] **Step 5: Update the explanatory note and run the focused tests**

In `renderFrontendDiagnosticsMarkdown`, replace the existing `<i>Only metrics...` line with:

```ts
		`_Values are median ± MAD (${browser.base.samples.length} base / ${browser.head.samples.length} head samples). Δ is Head - Base. Only changes outside observed noise that reach the display threshold are shown._`,
```

Run:

```powershell
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts
```

Expected: the six focused tests pass, while the golden test fails because the checked-in Markdown still has the seven-column paired table.

- [ ] **Step 6: Update and inspect the frontend Markdown golden**

Run:

```powershell
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts --update
git diff -- packages-private/diagnostics-frontend/test/__snapshots__/report.md
```

Expected:

- `test/report.test.ts` has 8 passing tests.
- The top-level Metric table has six columns.
- Base and Head cells contain median and MAD.
- Delta cells contain absolute and relative changes.
- The MAD column contains combined MAD.
- Every visible row has `increase` or `decrease`.
- The explanatory note describes independent noise-aware visibility.
- Requests by resource type, heap snapshot, Bundle Stats, and visualizer sections are unchanged.

- [ ] **Step 7: Run the frontend package test and lint gates**

Run:

```powershell
pnpm --filter diagnostics-frontend test
pnpm --filter diagnostics-frontend lint
git diff --check
```

Expected: all frontend tests pass, typecheck/ESLint complete with zero errors, and `git diff --check` has no output. Existing unrelated warnings may remain, but the new tests and implementation must add none.

- [ ] **Step 8: Commit the frontend behavior**

Before committing, invoke `shipping-misskey-change`. API generation, migration checks, locale checks, Vue review, and CHANGELOG changes are not applicable because this task changes only private diagnostics report rendering and tests.

```powershell
git add packages-private/diagnostics-frontend/src/report.ts packages-private/diagnostics-frontend/test/report.test.ts packages-private/diagnostics-frontend/test/__snapshots__/report.md
git commit -m "fix(diagnostics): suppress frontend metric noise"
```

---

### Task 2: Validate scope and remove temporary planning documents

**Files:**
- Verify: all Task 1 files and diagnostics package gates
- Delete: `docs/superpowers/specs/2026-07-21-frontend-diagnostics-metric-noise-design.md`
- Delete: `docs/superpowers/plans/2026-07-21-frontend-diagnostics-metric-noise.md`

**Interfaces:**
- Consumes: the committed frontend Metric-table behavior from Task 1.
- Produces: final validation evidence and a PR diff without temporary `docs/superpowers` files.

- [ ] **Step 1: Run all affected diagnostics tests**

Run:

```powershell
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-frontend test
```

Expected: all three suites pass. The frontend report suite includes the six new focused cases.

- [ ] **Step 2: Run all affected diagnostics lint gates**

Run:

```powershell
pnpm --filter diagnostics-shared lint
pnpm --filter diagnostics-backend lint
pnpm --filter diagnostics-frontend lint
```

Expected: all three commands complete with zero errors. Pre-existing warnings outside the Task 1 lines may remain.

- [ ] **Step 3: Run the repository lint gate and classify unrelated failures**

Run:

```powershell
pnpm lint
```

Expected: PASS when the full workspace dependencies resolve. If the existing workspace reproduces unresolved `misskey-js`/`i18n` modules or duplicate `@oxc-project/types` versions in unchanged packages, preserve the exact failing package list and report it separately; do not modify production packages outside this task.

- [ ] **Step 4: Verify the implementation scope**

Run:

```powershell
git show --name-status --format= HEAD
git diff --check
git status --short
git diff HEAD^ -- .github/workflows packages-private/diagnostics-frontend/src/browser packages-private/diagnostics-frontend/src/bundle packages-private/diagnostics-shared packages-private/diagnostics-backend packages/frontend locales CHANGELOG.md
```

Expected:

- The Task 1 commit contains only `src/report.ts`, `test/report.test.ts`, and the frontend Markdown golden.
- No workflow, browser collection, bundle, shared, backend, production frontend, locale, or CHANGELOG file changed in Task 1.
- `git diff --check` has no output.
- The worktree is clean before deleting the temporary documents.

- [ ] **Step 5: Remove the temporary spec and plan with `apply_patch`**

Delete these two files using `apply_patch` `*** Delete File` entries:

```text
docs/superpowers/specs/2026-07-21-frontend-diagnostics-metric-noise-design.md
docs/superpowers/plans/2026-07-21-frontend-diagnostics-metric-noise.md
```

Run:

```powershell
git diff --check
git diff --name-status develop -- docs/superpowers
```

Expected: no output for `docs/superpowers`, because the working tree now matches `develop` for these temporary files. After the deletions are committed, the final `develop...HEAD` tree contains neither file. Earlier historical planning documents must not be recreated or modified.

- [ ] **Step 6: Commit the planning-document cleanup**

Before committing, invoke `shipping-misskey-change`. The cleanup is documentation-only and does not require code generation or additional package tests.

```powershell
git add docs/superpowers/specs/2026-07-21-frontend-diagnostics-metric-noise-design.md docs/superpowers/plans/2026-07-21-frontend-diagnostics-metric-noise.md
git commit -m "docs: remove temporary frontend metric plans"
```

- [ ] **Step 7: Perform the final clean-tree and golden-scope check**

Run:

```powershell
git status --short
git diff --check
git diff develop...HEAD -- packages-private/diagnostics-frontend/test/__snapshots__/report.md
git log --oneline --decorate -6
```

Expected:

- `git status --short` and `git diff --check` have no output.
- The frontend golden changes only the top-level Metric table and its explanatory note for this task; existing heap-table changes from the parent branch remain intact.
- The final history includes the focused frontend implementation commit and the planning-document cleanup commit.
