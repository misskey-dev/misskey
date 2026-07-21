# Backend Diagnostics Memory Noise Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make backend diagnostics report independent-start memory differences conservatively, while preserving PSS/USS visibility and keeping the workflow within approximately 1.5 times its current duration.

**Architecture:** Add one shared independent-sample summary primitive and use it in the backend memory table and the shared backend/frontend heap snapshot renderer. Keep `HeapSnapshotReport` unchanged, filter backend samples without snapshots at its adapter boundary, and separately limit backend snapshot collection to the final three of fifteen measured rounds.

**Tech Stack:** TypeScript 5.9, Vitest 4, pnpm workspaces, GitHub Actions YAML, Linux `/proc` memory measurements, V8 heap snapshots.

## Global Constraints

- Keep `pairedDeltaSummary` unchanged for diagnostics that still intentionally use paired observations.
- Define independent delta as `median(head) - median(base)`.
- Define combined noise as `hypot(MAD(base), MAD(head))`.
- Use `inconclusive` when either side has fewer than two finite values or when any backend memory sample did not converge.
- Use `within noise` when `abs(delta) <= 3 * combinedMad`; otherwise use `increase` or `decrease` according to the delta sign.
- Color a displayed value only when its verdict is `increase` or `decrease` and that value also reaches its existing display threshold.
- Preserve the backend thresholds of 100 KiB and 0.1 percentage points, the heap snapshot thresholds of 100,000 bytes and 0.1 percentage points, and the PSS warning threshold of greater than 5%.
- Keep `HeapSnapshotReport`, frontend browser measurement JSON, and both frontend workflow files unchanged.
- Change only the shared heap snapshot table in the frontend report; leave every other frontend diagnostics table unchanged.
- Run fifteen measured backend rounds, one warmup round, and collect snapshots only for the final three measured rounds per revision.
- Keep raw non-converged samples in JSON and keep representative base/head heap snapshot artifacts.
- Do not change Misskey production backend runtime behavior.

## File Structure

- Modify `packages-private/diagnostics-shared/src/stats.ts`: define the independent summary result and classifier.
- Modify `packages-private/diagnostics-shared/test/stats.test.ts`: pin independent medians, MADs, sample sufficiency, and verdicts.
- Modify `packages-private/diagnostics-shared/src/heap-snapshot/render.ts`: render the shared six-column independent-sample table.
- Create `packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts`: directly test verdict-aware heap snapshot coloring.
- Modify `packages-private/diagnostics-backend/src/report/markdown.ts`: adapt nullable snapshots and render the backend memory table with the shared summary.
- Modify `packages-private/diagnostics-backend/test/render-md.test.ts`: cover the misleading paired-delta regression, convergence, undersampling, and nullable snapshots.
- Modify `packages-private/diagnostics-backend/test/__snapshots__/render-md.md`: record the new backend report format.
- Modify `packages-private/diagnostics-frontend/test/__snapshots__/report.md`: record only the shared heap snapshot table change.
- Create `packages-private/diagnostics-backend/src/heap-snapshot-sampling.ts`: isolate final-round collection and representative-round selection policy.
- Create `packages-private/diagnostics-backend/test/heap-snapshot-sampling.test.ts`: test clamping, final-round selection, and representative selection.
- Modify `packages-private/diagnostics-backend/src/compare.ts`: apply the sampling policy and record the effective snapshot count.
- Modify `packages-private/diagnostics-backend/src/types.ts`: describe the optional `heapSnapshotRounds` comparison metadata.
- Modify `.github/workflows/backend-diagnostics.inspect.yml`: configure fifteen memory rounds and three snapshot rounds.

---

### Task 1: Add the independent-sample statistical primitive

**Files:**
- Modify: `packages-private/diagnostics-shared/src/stats.ts`
- Test: `packages-private/diagnostics-shared/test/stats.test.ts`

**Interfaces:**
- Consumes: two independent arrays and `(sample: T) => number | null | undefined`.
- Produces: `IndependentDeltaVerdict`, `IndependentDeltaSummary`, `IndependentDeltaSummaryOptions`, and `independentDeltaSummary<T>(baseSamples, headSamples, getValue, options?)`.
- Preserves: the existing `pairedDeltaSummary` signature and behavior.

- [ ] **Step 1: Write failing tests for medians, noise, sample sufficiency, and forced inconclusive results**

Extend the import in `test/stats.test.ts` and append this suite:

```ts
import { finiteMedian, independentDeltaSummary, mad, median, pairedDeltaSummary, sampleSpread } from '../src/stats';

describe('independentDeltaSummary', () => {
	const base = [290_000, 292_900, 295_800, 298_700, 301_600]
		.map((value, index) => ({ round: index + 1, value }));
	const head = [292_900, 296_300, 298_700, 301_600, 290_000]
		.map((value, index) => ({ round: index + 1, value }));

	test('uses the difference of independent medians instead of the paired median', () => {
		expect(pairedDeltaSummary(base, head, sample => sample.value).median).toBe(2_900);

		const summary = independentDeltaSummary(base, head, sample => sample.value);
		expect(summary).toMatchObject({
			baseMedian: 295_800,
			headMedian: 296_300,
			delta: 500,
			baseMad: 2_900,
			headMad: 3_400,
			baseSamples: 5,
			headSamples: 5,
			verdict: 'within noise',
		});
		expect(summary.combinedMad).toBeCloseTo(Math.hypot(2_900, 3_400));
	});

	test('allows unequal sample counts and ignores non-finite values', () => {
		const summary = independentDeltaSummary(
			[{ value: 10 }, { value: 20 }, { value: Number.NaN }],
			[{ value: 20 }, { value: 30 }, { value: 40 }],
			sample => sample.value,
		);

		expect(summary).toMatchObject({
			baseMedian: 15,
			headMedian: 30,
			delta: 15,
			baseSamples: 2,
			headSamples: 3,
			verdict: 'within noise',
		});
	});

	test('returns inconclusive without throwing when either side has fewer than two values', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }],
			[{ value: 20 }, { value: 20 }],
			sample => sample.value,
		)).toStrictEqual({
			baseMedian: 10,
			headMedian: 20,
			delta: 10,
			baseMad: null,
			headMad: 0,
			combinedMad: null,
			baseSamples: 1,
			headSamples: 2,
			verdict: 'inconclusive',
		});
	});

	test('classifies clear increases and decreases when MAD is zero', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 11 }, { value: 11 }],
			sample => sample.value,
		).verdict).toBe('increase');

		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 9 }, { value: 9 }],
			sample => sample.value,
		).verdict).toBe('decrease');
	});

	test('can force a statistically sufficient result to inconclusive', () => {
		expect(independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 20 }, { value: 20 }],
			sample => sample.value,
			{ forceInconclusive: true },
		).verdict).toBe('inconclusive');
	});
});
```

- [ ] **Step 2: Run the focused test and verify the new API is missing**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/stats.test.ts
```

Expected: FAIL because `independentDeltaSummary` is not exported.

- [ ] **Step 3: Implement the independent summary without changing paired summaries**

Add this after `sampleSpread` and before `RoundedSample` in `src/stats.ts`:

```ts
export type IndependentDeltaVerdict = 'inconclusive' | 'within noise' | 'increase' | 'decrease';

export type IndependentDeltaSummary = {
	baseMedian: number | null;
	headMedian: number | null;
	delta: number | null;
	baseMad: number | null;
	headMad: number | null;
	combinedMad: number | null;
	baseSamples: number;
	headSamples: number;
	verdict: IndependentDeltaVerdict;
};

export type IndependentDeltaSummaryOptions = {
	forceInconclusive?: boolean;
};

function finiteSampleValues<T>(samples: T[], getValue: (sample: T) => number | null | undefined) {
	return samples
		.map(getValue)
		.filter((value): value is number => value != null && Number.isFinite(value));
}

export function independentDeltaSummary<T>(
	baseSamples: T[],
	headSamples: T[],
	getValue: (sample: T) => number | null | undefined,
	options: IndependentDeltaSummaryOptions = {},
): IndependentDeltaSummary {
	const baseValues = finiteSampleValues(baseSamples, getValue);
	const headValues = finiteSampleValues(headSamples, getValue);
	const baseMedian = finiteMedian(baseValues);
	const headMedian = finiteMedian(headValues);
	const delta = baseMedian == null || headMedian == null ? null : headMedian - baseMedian;
	const baseMad = sampleSpread(baseValues);
	const headMad = sampleSpread(headValues);
	const combinedMad = baseMad == null || headMad == null ? null : Math.hypot(baseMad, headMad);

	let verdict: IndependentDeltaVerdict;
	if (options.forceInconclusive === true || delta == null || combinedMad == null) {
		verdict = 'inconclusive';
	} else if (Math.abs(delta) <= combinedMad * 3) {
		verdict = 'within noise';
	} else {
		verdict = delta > 0 ? 'increase' : 'decrease';
	}

	return {
		baseMedian,
		headMedian,
		delta,
		baseMad,
		headMad,
		combinedMad,
		baseSamples: baseValues.length,
		headSamples: headValues.length,
		verdict,
	};
}
```

- [ ] **Step 4: Run the shared stats tests and lint**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/stats.test.ts
pnpm --filter diagnostics-shared lint
```

Expected: both commands PASS; the existing paired-summary tests remain unchanged.

- [ ] **Step 5: Commit the statistical primitive**

```powershell
git add packages-private/diagnostics-shared/src/stats.ts packages-private/diagnostics-shared/test/stats.test.ts
git commit -m "feat(diagnostics): add independent delta summary"
```

---

### Task 2: Convert the shared heap snapshot table without changing its input type

**Files:**
- Modify: `packages-private/diagnostics-shared/src/heap-snapshot/render.ts`
- Create: `packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts`
- Modify: `packages-private/diagnostics-backend/src/report/markdown.ts`
- Modify: `packages-private/diagnostics-backend/test/render-md.test.ts`
- Modify: `packages-private/diagnostics-backend/test/__snapshots__/render-md.md`
- Modify: `packages-private/diagnostics-frontend/test/__snapshots__/report.md`

**Interfaces:**
- Consumes: the existing `HeapSnapshotReport` `{ summary, samples: { round, data }[] }` shape.
- Produces: `renderHeapSnapshotTable(base, head)` with `Metric | Base | Head | Delta | Combined MAD | Result`.
- Preserves: frontend adapters, browser JSON fixtures, frontend workflow YAML, category swatches/details, and Sankey rendering.

- [ ] **Step 1: Add focused shared-renderer tests**

Create `test/heap-snapshot-render.test.ts` with the required SPDX header:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	createEmptyHeapSnapshotData,
	renderHeapSnapshotTable,
	summarizeHeapSnapshotDataSamples,
	type HeapSnapshotData,
	type HeapSnapshotReport,
} from '../src/heap-snapshot';

function snapshot(total: number): HeapSnapshotData {
	const data = createEmptyHeapSnapshotData();
	data.categories.total = total;
	return data;
}

function report(totals: number[]): HeapSnapshotReport {
	const samples = totals.map((total, index) => ({
		round: index + 1,
		data: snapshot(total),
	}));
	return {
		summary: summarizeHeapSnapshotDataSamples(samples, sample => sample.data)!,
		samples,
	};
}

function totalRow(markdown: string) {
	return markdown.split('\n').find(line => line.includes('**Total**'))!;
}

describe('renderHeapSnapshotTable', () => {
	test('leaves a threshold-sized delta uncoloured when it is within observed noise', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_100_000, 1_200_000]),
			report([1_100_000, 1_200_000, 1_300_000]),
		));

		expect(row).toContain('$\\text{+100 KB}$');
		expect(row).toContain('within noise');
		expect(row).not.toContain('\\color{orange}');
	});

	test('colours a clear increase that also reaches the display threshold', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_200_000, 1_200_000, 1_200_000]),
		));

		expect(row).toContain('\\color{orange}');
		expect(row).toContain('increase');
	});

	test('applies the absolute and percentage display thresholds independently', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_050_000, 1_050_000, 1_050_000]),
		));

		expect(row).toContain('increase');
		expect(row).toContain('$\\text{+50 KB}$');
		expect(row).toContain('\\color{orange}{\\text{+5');
	});

	test('renders a single snapshot per side as inconclusive without throwing', () => {
		const row = totalRow(renderHeapSnapshotTable(report([1_000_000]), report([1_200_000])));

		expect(row).toContain('inconclusive');
		expect(row).not.toContain('\\color{orange}');
	});
});
```

- [ ] **Step 2: Run the focused renderer test and verify it fails against paired columns**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/heap-snapshot-render.test.ts
```

Expected: FAIL because the current table has paired-delta columns and colors without a noise verdict.

- [ ] **Step 3: Replace paired heap snapshot rendering with independent summaries**

In `src/heap-snapshot/render.ts`, replace the stats import and the table-only helpers/function with the following. Leave `renderHeapSnapshotSankey` and its helpers unchanged.

```ts
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from '../stats';

/** これ未満のバイト差分には色を付けない (0.1 MB) */
const byteColorThreshold = 100_000;
const percentColorThreshold = 0.1;

function categoryValue(report: HeapSnapshotReport, category: HeapSnapshotCategory) {
	return report.summary.categories[category];
}

function swatch(category: HeapSnapshotCategory) {
	return `$\\color{${heapSnapshotCategory[category].color}}{\\rule{8pt}{8pt}}$ **${heapSnapshotCategory[category].label}**`;
}

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatOptionalBytes(value: number | null) {
	return value == null ? '-' : formatBytes(value);
}

function formatMedianWithMad(value: number | null, spread: number | null) {
	if (value == null) return '-';
	return `${formatBytes(value)} <br> ± ${formatOptionalBytes(spread)}`;
}

function formatSnapshotDelta(summary: IndependentDeltaSummary) {
	if (summary.delta == null) return '-';
	return formatDeltaBytes(
		summary.delta,
		isDirectionalVerdict(summary.verdict) ? byteColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatSnapshotDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return '-';
	const percent = summary.delta * 100 / summary.baseMedian;
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function formatCategoryPercent(value: number | null, total: number | null) {
	if (value == null || total == null || total === 0) return '-';
	return formatPercent((value * 100) / total);
}

function categoryDeltaSummary(base: HeapSnapshotReport, head: HeapSnapshotReport, category: HeapSnapshotCategory) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => sample.data.categories[category],
	);
}

/**
 * base / head のheap snapshotをカテゴリ別に比較するMarkdownテーブルを描画する。
 */
export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	const lines = [
		'| Metric | Base | Head | Delta | Combined MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
	];
	const totalSummary = categoryDeltaSummary(base, head, 'total');
	const baseTotal = totalSummary.baseMedian;
	const headTotal = totalSummary.headMedian;

	for (const category of heapSnapshotCategories) {
		const summary = category === 'total' ? totalSummary : categoryDeltaSummary(base, head, category);
		const baseValue = summary.baseMedian;
		const headValue = summary.headMedian;
		const combinedMad = formatOptionalBytes(summary.combinedMad);

		if (category === 'total') {
			const delta = `${formatSnapshotDelta(summary)}<br>${formatSnapshotDeltaPercent(summary)}`;
			lines.push(`| ${swatch(category)} | ${formatMedianWithMad(baseValue, summary.baseMad)} | ${formatMedianWithMad(headValue, summary.headMad)} | ${delta} | ${combinedMad} | ${summary.verdict} |`);
			lines.push('| | | | | | |');
		} else {
			const basePercent = formatCategoryPercent(baseValue, baseTotal);
			const headPercent = formatCategoryPercent(headValue, headTotal);
			const metric = `<details><summary>${swatch(category)}</summary>${basePercent} → ${headPercent}</details>`;
			lines.push(`| ${metric} | ${formatOptionalBytes(baseValue)} | ${formatOptionalBytes(headValue)} | ${formatSnapshotDelta(summary)} | ${combinedMad} | ${summary.verdict} |`);
		}
	}

	return lines.join('\n');
}
```

- [ ] **Step 4: Filter nullable backend snapshots at the adapter boundary**

In `packages-private/diagnostics-backend/src/report/markdown.ts`, import `HeapSnapshotReport` and replace `renderHeapSnapshotSection`'s inline report objects with this adapter:

```ts
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';

function toHeapSnapshotReport(report: MemoryReport): HeapSnapshotReport | null {
	const summary = report.summary.afterGc.heapSnapshot;
	if (summary == null) return null;

	return {
		summary,
		samples: report.samples.flatMap(sample => {
			const data = sample.phases.afterGc.heapSnapshot;
			return data == null ? [] : [{ round: sample.round, data }];
		}),
	};
}

function renderHeapSnapshotSection(base: MemoryReport, head: MemoryReport) {
	const baseHeapSnapshotReport = toHeapSnapshotReport(base);
	const headHeapSnapshotReport = toHeapSnapshotReport(head);
	if (baseHeapSnapshotReport == null || headHeapSnapshotReport == null) return null;

	const table = renderHeapSnapshotTable(baseHeapSnapshotReport, headHeapSnapshotReport);
	const lines = [
		'### V8 Heap Snapshot Statistics',
		'',
		table,
		'',
	];

	for (const graph of [
		//renderHeapSnapshotSankey(baseHeapSnapshotReport, 'Base'),
		//renderHeapSnapshotSankey(headHeapSnapshotReport, 'Head'),
	] as (string | null)[]) {
		if (graph == null) continue;
		lines.push(graph);
		lines.push('');
	}

	return lines.join('\n');
}
```

- [ ] **Step 5: Add a backend adapter regression test for sparse snapshots**

Append to `packages-private/diagnostics-backend/test/render-md.test.ts`:

```ts
test('filters rounds without heap snapshots before rendering', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	for (const report of [base, head]) {
		for (const sample of report.samples.slice(0, -1)) {
			sample.phases.afterGc.heapSnapshot = null;
		}
	}

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});
	const totalRow = markdown.split('\n').find(line => line.includes('**Total**'))!;

	expect(totalRow).toContain('inconclusive');
	expect(totalRow).not.toContain('NaN');
});
```

- [ ] **Step 6: Run focused tests and update both consumer goldens**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/heap-snapshot-render.test.ts
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts --update
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts --update
```

Expected: PASS. Review the golden diff and confirm that the frontend diff is confined to `V8 heap snapshot statistics`; its browser summary, resource table, and bundle tables must be byte-for-byte unchanged.

- [ ] **Step 7: Run all three diagnostics package tests and lint**

```powershell
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-frontend test
pnpm --filter diagnostics-shared lint
pnpm --filter diagnostics-backend lint
pnpm --filter diagnostics-frontend lint
```

Expected: all commands PASS.

- [ ] **Step 8: Commit the shared renderer and consumer expectations**

```powershell
git add packages-private/diagnostics-shared/src/heap-snapshot/render.ts packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-backend/test/render-md.test.ts packages-private/diagnostics-backend/test/__snapshots__/render-md.md packages-private/diagnostics-frontend/test/__snapshots__/report.md
git commit -m "feat(diagnostics): make heap snapshot deltas noise-aware"
```

---

### Task 3: Convert the backend memory table and warnings

**Files:**
- Modify: `packages-private/diagnostics-backend/src/report/markdown.ts`
- Modify: `packages-private/diagnostics-backend/test/render-md.test.ts`
- Modify: `packages-private/diagnostics-backend/test/__snapshots__/render-md.md`

**Interfaces:**
- Consumes: `MemoryReport.samples[*].phases[phase].memoryUsage` and `memoryStability.converged`.
- Produces: a six-column backend memory table, a method note, a visible convergence warning, and the existing PSS warning guarded by an `increase` verdict.
- Preserves: PSS, USS, HeapUsed, External, heap snapshot links, and representative artifacts.

- [ ] **Step 1: Add the misleading-pair regression and convergence tests**

Extend `test/render-md.test.ts` with the import/helper/tests below:

```ts
import { pairedDeltaSummary } from 'diagnostics-shared/stats';

function replacePssSamples(report: MemoryReport, values: number[]) {
	const templates = structuredClone(report.samples);
	report.samples = values.map((Pss, index) => {
		const sample = structuredClone(templates[index % templates.length]);
		sample.round = index + 1;
		sample.phases.afterGc.memoryUsage.Pss = Pss;
		const privateClean = sample.phases.afterGc.memoryUsage.Private_Clean;
		sample.phases.afterGc.memoryUsage.Private_Dirty = Pss - privateClean;
		return sample;
	});
	report.sampleCount = report.samples.length;
	return report;
}

function findMetricRow(markdown: string, metric: string) {
	return markdown.split('\n').find(line => line.startsWith(`| **${metric}**`))!;
}

test('reports the difference of medians and leaves a paired-looking PSS delta uncoloured', async () => {
	const base = replacePssSamples(await loadFixture('base'), [290_000, 292_900, 295_800, 298_700, 301_600]);
	const head = replacePssSamples(await loadFixture('head'), [292_900, 296_300, 298_700, 301_600, 290_000]);

	expect(pairedDeltaSummary(
		base.samples,
		head.samples,
		sample => sample.phases.afterGc.memoryUsage.Pss,
	).median).toBe(2_900);

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});
	const row = findMetricRow(markdown, 'PSS');

	expect(row).toContain('295.8 MB <br> ± 2.9 MB');
	expect(row).toContain('296.3 MB <br> ± 3.4 MB');
	expect(row).toContain('$\\text{+0.5 MB}$');
	expect(row).toContain('4.5 MB');
	expect(row).toContain('within noise');
	expect(row).not.toContain('\\color{orange}');
	expect(findMetricRow(markdown, 'USS')).toContain('within noise');
	expect(findMetricRow(markdown, 'USS')).not.toContain('\\color{orange}');
});

test('marks every memory metric inconclusive when a sample did not converge', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	base.samples[0].phases.afterGc.memoryStability.converged = false;

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});
	const memorySection = markdown.slice(0, markdown.indexOf('### V8 Heap Snapshot Statistics'));

	expect(memorySection.match(/\| inconclusive \|/g)).toHaveLength(4);
	expect(markdown).toContain('1 memory sample did not converge');
	expect(markdown).not.toContain('⚠️ **Warning**: Memory usage (PSS)');
});

test('marks an undersampled memory comparison inconclusive', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	base.samples = base.samples.slice(0, 1);
	head.samples = head.samples.slice(0, 1);

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});

	expect(findMetricRow(markdown, 'PSS')).toContain('inconclusive');
});

test('renders an unavailable percentage when the base median is zero', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	for (const sample of base.samples) sample.phases.afterGc.memoryUsage.External = 0;

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});

	expect(findMetricRow(markdown, 'External')).toContain('<br>-');
});
```

- [ ] **Step 2: Run the backend report tests and verify the paired implementation fails**

```powershell
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts
```

Expected: FAIL because the current memory table still uses `pairedDeltaSummary`, has seven columns, and does not force non-converged results to inconclusive.

- [ ] **Step 3: Replace memory aggregation and formatting helpers**

In `src/report/markdown.ts`, replace the stats import and the helpers from `getSampleValues` through `renderMainTableForPhase` with:

```ts
import { independentDeltaSummary, type IndependentDeltaSummary, type IndependentDeltaVerdict } from 'diagnostics-shared/stats';

const memoryColorThresholdKiB = 100;
const percentColorThreshold = 0.1;

function hasNonConvergedMemorySample(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	return [...base.samples, ...head.samples]
		.some(sample => !sample.phases[phase].memoryStability.converged);
}

function summarizeMemoryMetric(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => getMemoryValueFromSample(sample, phase, metric),
		{ forceInconclusive: hasNonConvergedMemorySample(base, head, phase) },
	);
}

function isDirectionalVerdict(verdict: IndependentDeltaVerdict) {
	return verdict === 'increase' || verdict === 'decrease';
}

function formatMedianWithMad(value: number | null, spread: number | null) {
	if (value == null) return '-';
	return `${formatKiBAsMb(value)} <br> ± ${formatKiBAsMb(spread)}`;
}

function formatMemoryDelta(summary: IndependentDeltaSummary) {
	if (summary.delta == null) return '-';
	return formatColoredDelta(
		summary.delta,
		value => formatKiBAsMb(value),
		isDirectionalVerdict(summary.verdict) ? memoryColorThresholdKiB : Number.POSITIVE_INFINITY,
	);
}

function getDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian == null || summary.baseMedian === 0 || summary.delta == null) return null;
	return summary.delta * 100 / summary.baseMedian;
}

function formatMemoryDeltaPercent(summary: IndependentDeltaSummary) {
	const percent = getDeltaPercent(summary);
	if (percent == null) return '-';
	return formatDeltaPercentInMdTable(
		percent,
		isDirectionalVerdict(summary.verdict) ? percentColorThreshold : Number.POSITIVE_INFINITY,
	);
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	const lines = [
		'| Metric | Base | Head | Delta | Combined MAD | Result |',
		'| --- | ---: | ---: | ---: | ---: | --- |',
	];

	for (const metric of memoryMetrics) {
		const summary = summarizeMemoryMetric(base, head, phase, metric);
		const delta = `${formatMemoryDelta(summary)}<br>${formatMemoryDeltaPercent(summary)}`;

		lines.push(`| **${formatMemoryMetricName(metric)}** | ${formatMedianWithMad(summary.baseMedian, summary.baseMad)} | ${formatMedianWithMad(summary.headMedian, summary.headMad)} | ${delta} | ${formatKiBAsMb(summary.combinedMad)} | ${summary.verdict} |`);
	}

	return lines.join('\n');
}
```

Keep the existing `getMemoryValueFromSample` directly above these helpers. Remove the now-unused `median`, `pairedDeltaSummary`, `sampleSpread`, `getSampleValues`, `getMemoryValue`, and `getSampleSpread` references.

- [ ] **Step 4: Add the method note, convergence warning, and verdict-gated PSS warning**

Add this helper before `renderMemoryReportMarkdown`:

```ts
function countNonConvergedMemorySamples(base: MemoryReport, head: MemoryReport) {
	return [base, head]
		.flatMap(report => report.samples)
		.filter(sample => memoryReportPhases.some(phase => !sample.phases[phase.key].memoryStability.converged))
		.length;
}
```

In `renderMemoryReportMarkdown`, add this immediately after the memory-table loop:

```ts
	lines.push(`_Values are median ± MAD (${base.samples.length} base / ${head.samples.length} head samples). Delta is Head - Base. Results are increase or decrease only when |Delta| > 3 × Combined MAD._`);
	lines.push('');

	const nonConvergedSamples = countNonConvergedMemorySamples(base, head);
	if (nonConvergedSamples > 0) {
		const noun = nonConvergedSamples === 1 ? 'sample' : 'samples';
		lines.push(`⚠️ **Measurement warning**: ${nonConvergedSamples} memory ${noun} did not converge. Memory results are marked inconclusive.`);
		lines.push('');
	}
```

Replace the old `getDiffPercent`, `isBeyondSampleNoise`, and final PSS warning block with:

```ts
	const warningMetric = 'Pss';
	const warningSummary = summarizeMemoryMetric(base, head, 'afterGc', warningMetric);
	const warningDiffPercent = getDeltaPercent(warningSummary);
	if (warningSummary.verdict === 'increase' && warningDiffPercent != null && warningDiffPercent > 5) {
		lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
		lines.push('');
	}
```

- [ ] **Step 5: Run the focused tests and update the backend golden**

```powershell
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts --update
```

Expected: PASS. Confirm the golden contains six columns, `Combined MAD`, result labels, the method note, and the existing PSS warning for the clearly increasing fixture.

- [ ] **Step 6: Run backend and shared tests/lint**

```powershell
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-shared lint
pnpm --filter diagnostics-backend lint
```

Expected: all commands PASS.

- [ ] **Step 7: Commit the backend report behavior**

```powershell
git add packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-backend/test/render-md.test.ts packages-private/diagnostics-backend/test/__snapshots__/render-md.md
git commit -m "fix(diagnostics): suppress backend memory noise"
```

---

### Task 4: Limit backend snapshots to the final three of fifteen rounds

**Files:**
- Create: `packages-private/diagnostics-backend/src/heap-snapshot-sampling.ts`
- Create: `packages-private/diagnostics-backend/test/heap-snapshot-sampling.test.ts`
- Modify: `packages-private/diagnostics-backend/src/compare.ts`
- Modify: `packages-private/diagnostics-backend/src/types.ts`
- Modify: `.github/workflows/backend-diagnostics.inspect.yml`

**Interfaces:**
- Produces: `clampHeapSnapshotRounds`, `shouldCollectHeapSnapshot`, and `selectRepresentativeHeapSnapshotRound` as pure policy helpers.
- Consumes: `MK_MEMORY_HEAP_SNAPSHOT_ROUNDS`, defaulting to all measured rounds outside the workflow for backward compatibility.
- Preserves: `MK_MEMORY_HEAP_SNAPSHOT=0` disabling snapshots, warmups never collecting snapshots, and artifact upload failure when no representative snapshot exists.

- [ ] **Step 1: Write failing tests for snapshot-round policy and representative selection**

Create `test/heap-snapshot-sampling.test.ts`:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	clampHeapSnapshotRounds,
	selectRepresentativeHeapSnapshotRound,
	shouldCollectHeapSnapshot,
} from '../src/heap-snapshot-sampling';

describe('heap snapshot sampling', () => {
	test('collects only the final requested rounds', () => {
		const selected = Array.from({ length: 15 }, (_, index) => index + 1)
			.filter(round => shouldCollectHeapSnapshot(round, 15, 3));
		expect(selected).toStrictEqual([13, 14, 15]);
	});

	test('clamps the requested count to the measured round count', () => {
		expect(clampHeapSnapshotRounds(5, 20)).toBe(5);
		expect(Array.from({ length: 5 }, (_, index) => index + 1)
			.filter(round => shouldCollectHeapSnapshot(round, 5, 20)))
			.toStrictEqual([1, 2, 3, 4, 5]);
	});

	test('collects no snapshots when the effective count is zero', () => {
		expect(Array.from({ length: 5 }, (_, index) => index + 1)
			.filter(round => shouldCollectHeapSnapshot(round, 5, 0)))
			.toStrictEqual([]);
	});

	test('selects the snapshot nearest the median and ignores missing rounds', () => {
		const samples = [
			{ round: 12, total: null },
			{ round: 13, total: 100 },
			{ round: 14, total: 110 },
			{ round: 15, total: 130 },
		];
		expect(selectRepresentativeHeapSnapshotRound(samples, 110, sample => sample.total)).toBe(14);
	});
});
```

- [ ] **Step 2: Run the focused test and verify the policy module is missing**

```powershell
pnpm --filter diagnostics-backend exec vitest run test/heap-snapshot-sampling.test.ts
```

Expected: FAIL because `src/heap-snapshot-sampling.ts` does not exist.

- [ ] **Step 3: Implement the pure snapshot sampling policy**

Create `src/heap-snapshot-sampling.ts`:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function clampHeapSnapshotRounds(totalRounds: number, requestedRounds: number) {
	return Math.min(totalRounds, requestedRounds);
}

export function shouldCollectHeapSnapshot(round: number, totalRounds: number, requestedRounds: number) {
	const snapshotRounds = clampHeapSnapshotRounds(totalRounds, requestedRounds);
	return round > totalRounds - snapshotRounds;
}

export function selectRepresentativeHeapSnapshotRound<T extends { round: number }>(
	samples: T[],
	medianTotal: number | null | undefined,
	getTotal: (sample: T) => number | null | undefined,
) {
	if (medianTotal == null || !Number.isFinite(medianTotal)) return null;

	let selected: { round: number; distance: number } | null = null;
	for (const sample of samples) {
		const total = getTotal(sample);
		if (total == null || !Number.isFinite(total)) continue;

		const distance = Math.abs(total - medianTotal);
		if (selected == null || distance < selected.distance || (distance === selected.distance && sample.round < selected.round)) {
			selected = { round: sample.round, distance };
		}
	}

	return selected?.round ?? null;
}
```

- [ ] **Step 4: Apply the policy in the comparison harness**

In `src/compare.ts`, import `readBooleanEnv` with the existing environment helpers, import the three sampling helpers, remove the local `selectRepresentativeHeapSnapshotRound`, and change sample generation and round setup as follows:

```ts
import { readBooleanEnv, readIntegerEnv, readOptionalEnv } from 'diagnostics-shared/env';
import {
	clampHeapSnapshotRounds,
	selectRepresentativeHeapSnapshotRound,
	shouldCollectHeapSnapshot,
} from './heap-snapshot-sampling';

type GenSampleOptions = {
	collectHeapSnapshot?: boolean;
	heapSnapshotSavePath?: string;
};

async function genSample(label: string, repoDir: string, round: number, options: GenSampleOptions = {}) {
	process.stderr.write(`[${label}] Resetting database and Redis\n`);
	await resetState();

	process.stderr.write(`[${label}] Running migrations\n`);
	await execa('pnpm', ['--filter', 'backend', 'migrate'], {
		cwd: repoDir,
		stdout: ['pipe', process.stderr],
		stderr: ['pipe', process.stderr],
	});

	process.stderr.write(`[${label}] Measuring memory\n`);
	return await measureBackendMemory(resolve(repoDir, 'packages/backend'), {
		...(round <= 0 || options.collectHeapSnapshot === false ? { heapSnapshot: false } : {}),
		heapSnapshotSavePath: options.heapSnapshotSavePath ?? null,
	});
}
```

At the start of `compareBackendMemory`, calculate the effective count:

```ts
	const rounds = readIntegerEnv('MK_MEMORY_COMPARE_ROUNDS', 5, 1);
	const warmupRounds = readIntegerEnv('MK_MEMORY_COMPARE_WARMUP_ROUNDS', 1, 0);
	const heapSnapshotsEnabled = readBooleanEnv('MK_MEMORY_HEAP_SNAPSHOT', false);
	const requestedHeapSnapshotRounds = heapSnapshotsEnabled
		? readIntegerEnv('MK_MEMORY_HEAP_SNAPSHOT_ROUNDS', rounds, 1)
		: 0;
	const heapSnapshotRounds = clampHeapSnapshotRounds(rounds, requestedHeapSnapshotRounds);
```

Replace the measured-round call with:

```ts
		for (const label of order) {
			const collectHeapSnapshot = shouldCollectHeapSnapshot(round, rounds, heapSnapshotRounds);
			const sample = await genSample(label, reports[label].dir, round, {
				collectHeapSnapshot,
				...(collectHeapSnapshot ? { heapSnapshotSavePath: heapSnapshotPath(label, round) } : {}),
			});
			reports[label].samples.push({
				...sample,
				round,
			});
		}
```

Call the extracted representative selector from `saveRepresentativeHeapSnapshot`:

```ts
	const round = selectRepresentativeHeapSnapshotRound(
		samples,
		summary.afterGc.heapSnapshot?.categories.total,
		sample => sample.phases.afterGc.heapSnapshot?.categories.total,
	);
```

Record `heapSnapshotRounds` beside `rounds` and `warmupRounds` in the emitted `comparison` object.

- [ ] **Step 5: Extend comparison metadata and workflow configuration**

Add the optional field in `src/types.ts` so existing JSON fixtures remain valid:

```ts
	comparison?: {
		strategy: string;
		rounds: number;
		warmupRounds: number;
		heapSnapshotRounds?: number;
		startedAt: string;
	};
```

Change only the memory measurement environment in `.github/workflows/backend-diagnostics.inspect.yml`:

```yaml
        MK_MEMORY_COMPARE_ROUNDS: 15
        MK_MEMORY_COMPARE_WARMUP_ROUNDS: 1
        MK_MEMORY_HEAP_SNAPSHOT: 1
        MK_MEMORY_HEAP_SNAPSHOT_ROUNDS: 3
```

- [ ] **Step 6: Run backend tests/lint and inspect the workflow diff**

```powershell
pnpm --filter diagnostics-backend exec vitest run test/heap-snapshot-sampling.test.ts
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-backend lint
git diff --check
git diff -- .github/workflows/backend-diagnostics.inspect.yml .github/workflows/frontend-diagnostics.inspect.yml .github/workflows/frontend-diagnostics.comment.yml
```

Expected: tests/lint/diff check PASS; the diff contains the backend environment changes and no frontend workflow changes.

- [ ] **Step 7: Commit the bounded-runtime measurement changes**

```powershell
git add packages-private/diagnostics-backend/src/heap-snapshot-sampling.ts packages-private/diagnostics-backend/test/heap-snapshot-sampling.test.ts packages-private/diagnostics-backend/src/compare.ts packages-private/diagnostics-backend/src/types.ts .github/workflows/backend-diagnostics.inspect.yml
git commit -m "ci: refine backend diagnostics sampling"
```

---

### Task 5: Run cross-package and repository validation

**Files:**
- Verify only; modify a file only to correct a failure caused by Tasks 1-4.

**Interfaces:**
- Consumes: all implementation commits.
- Produces: evidence that package tests, type checks, lint, snapshots, scope, and repository shipping constraints are satisfied.

- [ ] **Step 1: Run all affected package tests**

```powershell
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-frontend test
```

Expected: all Vitest suites PASS with no unintended snapshot updates.

- [ ] **Step 2: Run affected package lint and the repository lint gate**

```powershell
pnpm --filter diagnostics-shared lint
pnpm --filter diagnostics-backend lint
pnpm --filter diagnostics-frontend lint
pnpm lint
```

Expected: the three affected package lints PASS and the repository lint gate PASS. If the repository gate reproduces a pre-existing dependency-version failure outside these packages, preserve the complete output and report it separately instead of changing unrelated files.

- [ ] **Step 3: Verify scope, generated files, and shipping constraints**

```powershell
git diff --check
git status --short
git diff develop...HEAD --name-only
git diff develop...HEAD -- packages-private/diagnostics-frontend/src .github/workflows/frontend-diagnostics.inspect.yml .github/workflows/frontend-diagnostics.comment.yml locales packages/backend packages/misskey-js/src/autogen CHANGELOG.md
```

Expected:

- `git diff --check` has no output.
- No locale, backend API, migration, misskey-js generated file, production backend file, or CHANGELOG change exists.
- No frontend source or workflow changes exist; only the frontend Markdown golden changes.
- Every new `.ts` file begins with the AGPL SPDX header.

- [ ] **Step 4: Review the final report semantics and commits**

```powershell
git diff develop...HEAD -- packages-private/diagnostics-backend/test/__snapshots__/render-md.md packages-private/diagnostics-frontend/test/__snapshots__/report.md
git log --oneline --decorate -6
```

Expected:

- Backend PSS/USS deltas equal displayed head median minus displayed base median.
- `within noise` and `inconclusive` values are uncolored.
- Clear changes still require both a directional verdict and the existing display threshold for color.
- PSS warning requires both greater than 5% and an `increase` verdict.
- Both heap snapshot tables use independent summaries and six columns.
- Frontend non-heap tables are unchanged.
- The implementation is split into the four focused commits named above.

- [ ] **Step 5: Check the first real backend diagnostics run against the runtime budget**

After the branch is pushed and a pull-request run completes, compare the `get-memory-usage` job duration with the latest successful pre-change run of `Backend diagnostics (inspect)`.

Expected: the changed job duration is no more than 1.5 times the pre-change duration. If it exceeds that limit, change `MK_MEMORY_COMPARE_ROUNDS` from `15` to `12`, keep `MK_MEMORY_HEAP_SNAPSHOT_ROUNDS: 3`, rerun the affected package checks, and repeat the Actions comparison before declaring the implementation complete.
