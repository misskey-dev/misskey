# Shared Diagnostics Metric Table Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Heap Snapshot、Backend metrics、Frontend metricsの比較Markdown表を、同一の五列rendererと同一のabsolute-threshold-plus-noise判定へ移行する。

**Architecture:** `diagnostics-shared/stats`を「正常なworkflowでは両側2件以上の有限な数値がある」というstrict contractへ単純化し、その集計結果を使うgenericな`diagnostics-shared/metric-table`を追加する。Heap Snapshotは既存public wrapperを保ったまま内部委譲し、BackendとFrontendは行定義だけをconsumer側に残す。各層をshared stats → shared renderer → Heap Snapshot → Backend → Frontendの順にTDDで移行し、最後に一時設計書と本計画書をPR差分から削除する。

**Tech Stack:** TypeScript 5.9、Vitest 4、pnpm workspace、GitHub-flavored Markdown、既存の`diagnostics-shared/format` utilities。

## Global Constraints

- 表は常に`Metric / @ Base / @ Head / Δ / MAD`の五列とし、`Result`列、verdict判定、inconclusive表示・参照処理を削除する。
- 有意差は`Math.abs(delta) > combinedMad * 3 && Math.abs(delta) >= absoluteThreshold`だけで判定する。absolute thresholdちょうどは有意、`3 × combinedMad`ちょうどは非有意とする。
- Percentage thresholdは完全に廃止する。percentageの表示有無は有意差判定に影響させず、有意な行ではabsolute deltaと表示中のpercentage deltaを同時に着色する。
- `independentDeltaSummary`は両側2サンプル以上を要求し、欠損時は`At least two samples per side are required`を投げる。nullable fallback、非有限値filtering、入力validationは追加しない。
- `finiteMedian`、`sampleSpread`、`pairedDeltaSummary`は他用途の契約を変えない。
- Frontend metricsだけ`onlySignificantChanges: true`を使う。Backend metricsとHeap Snapshotは非有意行も表示する。
- `label`は信頼済みのMarkdown/HTMLとして無加工で出力し、callerはtable delimiterの`|`を含めない。
- Heap SnapshotのTotal行だけmedian/MADとdelta/%を二段表示し、その直後に五列の空rowを入れる。category行は二段表示、割合、`<details>`を使わない。
- 正常なworkflowではBackend metricsが両側15件、Backend Heap Snapshotが両側3件、Frontend metrics/Heap Snapshotが両側5件揃う。計測失敗は部分reportにせずjob failureとする既存挙動を変えない。
- Backendの非収束warningは残すが、非収束による着色/PSS warning抑制と`results are marked inconclusive`文言を削除する。PSS warning固有の5%超条件は残す。
- Requests by resource type、Bundle Stats、visualizer、詳細HTML、workflow、report JSON schema、`packages/backend`、`packages/frontend`、locales、CHANGELOGは変更しない。
- 新規`.ts`ファイルにはAGPL-3.0-onlyのSPDX headerを付ける。新規dependencyは追加しない。
- 各commitと最終handoffの前に`shipping-misskey-change`のchecklistを適用し、`--no-verify`は使わない。
- 最終PRのnet diffには`docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md`と本計画書を残さない。

## File Structure

- Create: `packages-private/diagnostics-shared/src/metric-table.ts` — independent summaryから有意差を判定し、五列Markdown、表示オプション、row filteringを生成するgeneric renderer。
- Create: `packages-private/diagnostics-shared/test/metric-table.test.ts` — renderer単体のlayout、境界条件、着色、filtering、例外契約を固定する。
- Modify: `packages-private/diagnostics-shared/src/stats.ts` — independent summaryをnon-nullableな数値集計へ単純化し、`isOutsideObservedNoise`を公開する。
- Modify: `packages-private/diagnostics-shared/test/stats.test.ts` — verdict/inconclusive testsをstrict contractとnoise predicate testsへ置換する。
- Modify: `packages-private/diagnostics-shared/package.json` — `./metric-table` public exportを追加する。
- Modify: `packages-private/diagnostics-shared/src/heap-snapshot/render.ts` — table部分だけを共有rendererへ委譲し、Sankey処理はそのまま残す。
- Modify: `packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts` — Heap Snapshot固有のrow option mappingとstrict sample contractを検証する。
- Modify: `packages-private/diagnostics-backend/src/report/markdown.ts` — Backendのlocal table formatting/verdict処理を行定義へ置換し、PSS warningにはnoise predicateを直接使う。
- Modify: `packages-private/diagnostics-backend/test/render-md.test.ts` — 五列layout、非収束warning、PSS warning、サンプル不足例外を検証する。
- Modify: `packages-private/diagnostics-backend/test/__snapshots__/render-md.md` — Backend report goldenを新しい表と説明文へ更新する。
- Modify: `packages-private/diagnostics-frontend/src/report.ts` — Frontend metricsを共有rendererへ移し、resource-type HTML table等は維持する。
- Modify: `packages-private/diagnostics-frontend/test/report.test.ts` — significant-only表示、共通着色、五列layout、strict sample contractを検証する。
- Modify: `packages-private/diagnostics-frontend/test/__snapshots__/report.md` — Frontend report goldenを新しい表と説明文へ更新する。
- Delete before final handoff: `docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md`、`docs/superpowers/plans/2026-07-21-shared-diagnostics-metric-table.md`。

---

### Task 1: Strict independent statistics contract

**Files:**
- Modify: `packages-private/diagnostics-shared/test/stats.test.ts`
- Modify: `packages-private/diagnostics-shared/src/stats.ts`

**Interfaces:**
- Consumes: existing `median(values: number[]): number` and `mad(values: number[]): number`.
- Produces: `IndependentDeltaSummary` with non-nullable numeric fields; `independentDeltaSummary<T>(baseSamples: T[], headSamples: T[], getValue: (sample: T) => number): IndependentDeltaSummary`; `isOutsideObservedNoise(summary: IndependentDeltaSummary): boolean`.

- [ ] **Step 1: Replace verdict/inconclusive tests with the strict summary and noise-boundary contract**

In `packages-private/diagnostics-shared/test/stats.test.ts`, replace the existing import from `../src/stats` with:

```ts
import {
	finiteMedian,
	independentDeltaSummary,
	isOutsideObservedNoise,
	mad,
	median,
	pairedDeltaSummary,
	sampleSpread,
	type IndependentDeltaSummary,
} from '../src/stats';
```

Then replace the entire `describe('independentDeltaSummary', ...)` block with:

```ts
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
		});
		expect(summary.combinedMad).toBeCloseTo(Math.hypot(2_900, 3_400));
	});

	test('allows unequal sample counts', () => {
		const summary = independentDeltaSummary(
			[{ value: 10 }, { value: 20 }],
			[{ value: 20 }, { value: 30 }, { value: 40 }],
			sample => sample.value,
		);

		expect(summary).toStrictEqual({
			baseMedian: 15,
			headMedian: 30,
			delta: 15,
			baseMad: 5,
			headMad: 10,
			combinedMad: Math.hypot(5, 10),
			baseSamples: 2,
			headSamples: 3,
		});
	});

	test('throws when either side has fewer than two samples', () => {
		expect(() => independentDeltaSummary(
			[{ value: 10 }],
			[{ value: 20 }, { value: 20 }],
			sample => sample.value,
		)).toThrow('At least two samples per side are required');

		expect(() => independentDeltaSummary(
			[{ value: 10 }, { value: 10 }],
			[{ value: 20 }],
			sample => sample.value,
		)).toThrow('At least two samples per side are required');
	});

	test('treats exactly three combined MADs as noise and only larger deltas as outside noise', () => {
		function summary(delta: number, combinedMad: number): IndependentDeltaSummary {
			return {
				baseMedian: 100,
				headMedian: 100 + delta,
				delta,
				baseMad: 0,
				headMad: combinedMad,
				combinedMad,
				baseSamples: 3,
				headSamples: 3,
			};
		}

		expect(isOutsideObservedNoise(summary(29, 10))).toBe(false);
		expect(isOutsideObservedNoise(summary(30, 10))).toBe(false);
		expect(isOutsideObservedNoise(summary(31, 10))).toBe(true);
		expect(isOutsideObservedNoise(summary(-31, 10))).toBe(true);
	});
});
```

Keep the existing `median`, `mad`, `finiteMedian`, `sampleSpread`, and `pairedDeltaSummary` tests unchanged. There must be no test referring to `verdict`, `inconclusive`, `forceInconclusive`, or ignored non-finite independent values.

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/stats.test.ts
```

Expected: FAIL at type collection because `isOutsideObservedNoise` is not exported and the existing summary still contains nullable fields/verdict; no unrelated test file runs.

- [ ] **Step 3: Replace only the independent-statistics section**

In `packages-private/diagnostics-shared/src/stats.ts`, leave everything through `sampleSpread` and everything from `type RoundedSample` onward unchanged. Replace `IndependentDeltaVerdict` through `independentDeltaSummary` with:

```ts
export type IndependentDeltaSummary = {
	baseMedian: number;
	headMedian: number;
	delta: number;
	baseMad: number;
	headMad: number;
	combinedMad: number;
	baseSamples: number;
	headSamples: number;
};

export function independentDeltaSummary<T>(
	baseSamples: T[],
	headSamples: T[],
	getValue: (sample: T) => number,
): IndependentDeltaSummary {
	const baseValues = baseSamples.map(getValue);
	const headValues = headSamples.map(getValue);
	if (baseValues.length < 2 || headValues.length < 2) {
		throw new Error('At least two samples per side are required');
	}

	const baseMedian = median(baseValues);
	const headMedian = median(headValues);
	const baseMad = mad(baseValues);
	const headMad = mad(headValues);

	return {
		baseMedian,
		headMedian,
		delta: headMedian - baseMedian,
		baseMad,
		headMad,
		combinedMad: Math.hypot(baseMad, headMad),
		baseSamples: baseValues.length,
		headSamples: headValues.length,
	};
}

export function isOutsideObservedNoise(summary: IndependentDeltaSummary) {
	return Math.abs(summary.delta) > summary.combinedMad * 3;
}
```

Delete `IndependentDeltaVerdict`, `IndependentDeltaSummaryOptions`, `finiteSampleValues`, the options parameter, all nullable independent-summary branches, and verdict construction. Do not alter nullable helpers used by paired/Heap Snapshot summary code.

- [ ] **Step 4: Run focused verification for the isolated stats change**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/stats.test.ts
pnpm --filter diagnostics-shared exec eslint src/stats.ts test/stats.test.ts
```

Expected: both commands pass. Full-package typecheck is intentionally deferred until Task 3 because the existing Heap Snapshot consumer is migrated there in the same shared-package dependency chain.

- [ ] **Step 5: Review and commit the independent statistics contract**

Check the staged diff contains only the two Task 1 files and no accidental nullable-helper changes:

```powershell
git diff -- packages-private/diagnostics-shared/src/stats.ts packages-private/diagnostics-shared/test/stats.test.ts
git diff --check
git add packages-private/diagnostics-shared/src/stats.ts packages-private/diagnostics-shared/test/stats.test.ts
git commit -m "refactor(diagnostics): simplify independent delta statistics"
```

Expected: one commit is created; pre-commit checks pass without `--no-verify`.

---

### Task 2: Generic five-column metric table renderer

**Files:**
- Create: `packages-private/diagnostics-shared/test/metric-table.test.ts`
- Create: `packages-private/diagnostics-shared/src/metric-table.ts`
- Modify: `packages-private/diagnostics-shared/package.json`

**Interfaces:**
- Consumes: `independentDeltaSummary<T>(...)` and `isOutsideObservedNoise(summary)` from Task 1; `formatColoredDelta` and `formatDeltaPercentInMdTable` from `./format`.
- Produces: `MetricComparisonRow<T>`, `MetricComparisonTableOptions`, and `renderMetricComparisonTable<T>(baseSamples, headSamples, rows, options?): string`, publicly importable as `diagnostics-shared/metric-table`.

- [ ] **Step 1: Add renderer contract tests**

Create `packages-private/diagnostics-shared/test/metric-table.test.ts` with this complete content:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { describe, expect, test } from 'vitest';
import {
	renderMetricComparisonTable,
	type MetricComparisonRow,
} from '../src/metric-table';

type Sample = { value: number };

const defaultRow: MetricComparisonRow<Sample> = {
	label: '<strong>Metric</strong>',
	getValue: sample => sample.value,
	formatValue: value => `${value} units`,
	absoluteThreshold: 10,
};

function samples(...values: number[]): Sample[] {
	return values.map(value => ({ value }));
}

describe('renderMetricComparisonTable', () => {
	test('renders the fixed five-column layout, raw label, MAD, and percentage by default', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 120, 120),
			[defaultRow],
		);

		expect(table.split('\n')).toStrictEqual([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
			'| <strong>Metric</strong> | 100 units <br> ± 0 units | 120 units <br> ± 0 units | $\\color{orange}{\\text{+20 units}}$<br>$\\color{orange}{\\text{+20\\\\%}}$ | 0 units |',
		]);
	});

	test('can hide second lines and insert a five-column separator row', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 120, 120),
			[{
				...defaultRow,
				showMedianMad: false,
				showDeltaPercentage: false,
				separatorAfter: true,
			}],
		);

		expect(table.split('\n')).toStrictEqual([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
			'| <strong>Metric</strong> | 100 units | 120 units | $\\color{orange}{\\text{+20 units}}$ | 0 units |',
			'| | | | | |',
		]);
	});

	test('leaves both delta lines uncolored below the absolute threshold and can filter the row', () => {
		const base = samples(100, 100, 100);
		const head = samples(109, 109, 109);
		const table = renderMetricComparisonTable(base, head, [defaultRow]);

		expect(table).toContain('$\\text{+9 units}$<br>$\\text{+9\\\\%}$');
		expect(table).not.toContain('\\color{');
		expect(renderMetricComparisonTable(base, head, [defaultRow], {
			onlySignificantChanges: true,
		})).toBe([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
		].join('\n'));
	});

	test('treats the absolute threshold itself as significant', () => {
		const table = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(110, 110, 110),
			[defaultRow],
			{ onlySignificantChanges: true },
		);

		expect(table).toContain('$\\color{orange}{\\text{+10 units}}$');
		expect(table).toContain('$\\color{orange}{\\text{+10\\\\%}}$');
	});

	test('requires the delta to be strictly outside three combined MADs', () => {
		const inside = renderMetricComparisonTable(
			samples(100, 110, 120),
			samples(109, 119, 129),
			[{ ...defaultRow, absoluteThreshold: 1 }],
		);
		const boundary = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(120, 130, 140),
			[defaultRow],
		);
		const outside = renderMetricComparisonTable(
			samples(100, 100, 100),
			samples(121, 131, 141),
			[defaultRow],
		);

		expect(inside).toContain('$\\text{+9 units}$');
		expect(inside).not.toContain('\\color{');
		expect(boundary).toContain('$\\text{+30 units}$');
		expect(boundary).not.toContain('\\color{');
		expect(outside).toContain('$\\color{orange}{\\text{+31 units}}$');
		expect(outside).toContain('$\\color{orange}{\\text{+31\\\\%}}$');
	});

	test('colours a significant decrease green on both delta lines', () => {
		const table = renderMetricComparisonTable(
			samples(120, 120, 120),
			samples(100, 100, 100),
			[defaultRow],
		);

		expect(table).toContain('$\\color{green}{\\text{-20 units}}$');
		expect(table).toContain('$\\color{green}{\\text{-16.7\\\\%}}$');
	});

	test('shows a dash for percentage when the base median is zero', () => {
		const table = renderMetricComparisonTable(
			samples(0, 0, 0),
			samples(20, 20, 20),
			[defaultRow],
		);

		expect(table).toContain('$\\color{orange}{\\text{+20 units}}$<br>-');
	});

	test('propagates the minimum sample contract', () => {
		expect(() => renderMetricComparisonTable(
			samples(100),
			samples(120, 120),
			[defaultRow],
		)).toThrow('At least two samples per side are required');
	});
});
```

- [ ] **Step 2: Run the new test and verify RED**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/metric-table.test.ts
```

Expected: FAIL because `../src/metric-table` does not exist.

- [ ] **Step 3: Implement the generic renderer**

Create `packages-private/diagnostics-shared/src/metric-table.ts` with this complete content:

```ts
/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { formatColoredDelta, formatDeltaPercentInMdTable } from './format';
import {
	independentDeltaSummary,
	isOutsideObservedNoise,
	type IndependentDeltaSummary,
} from './stats';

export type MetricComparisonRow<T> = {
	label: string;
	getValue: (sample: T) => number;
	formatValue: (value: number) => string;
	absoluteThreshold: number;
	showMedianMad?: boolean;
	showDeltaPercentage?: boolean;
	separatorAfter?: boolean;
};

export type MetricComparisonTableOptions = {
	onlySignificantChanges?: boolean;
};

function isSignificant(summary: IndependentDeltaSummary, absoluteThreshold: number) {
	return isOutsideObservedNoise(summary) && Math.abs(summary.delta) >= absoluteThreshold;
}

function formatMedian<T>(
	value: number,
	spread: number,
	row: MetricComparisonRow<T>,
) {
	const formatted = row.formatValue(value);
	if (row.showMedianMad === false) return formatted;
	return `${formatted} <br> ± ${row.formatValue(spread)}`;
}

function formatDelta<T>(
	summary: IndependentDeltaSummary,
	row: MetricComparisonRow<T>,
	significant: boolean,
) {
	const colorThreshold = significant ? 0 : Number.POSITIVE_INFINITY;
	const absolute = formatColoredDelta(summary.delta, row.formatValue, colorThreshold);
	if (row.showDeltaPercentage === false) return absolute;

	const percentage = summary.baseMedian === 0
		? '-'
		: formatDeltaPercentInMdTable(summary.delta * 100 / summary.baseMedian, colorThreshold);
	return `${absolute}<br>${percentage}`;
}

export function renderMetricComparisonTable<T>(
	baseSamples: T[],
	headSamples: T[],
	rows: MetricComparisonRow<T>[],
	options: MetricComparisonTableOptions = {},
): string {
	const lines = [
		'| Metric | @ Base | @ Head | Δ | MAD |',
		'| --- | ---: | ---: | ---: | ---: |',
	];

	for (const row of rows) {
		const summary = independentDeltaSummary(baseSamples, headSamples, row.getValue);
		const significant = isSignificant(summary, row.absoluteThreshold);
		if (options.onlySignificantChanges === true && !significant) continue;

		lines.push(`| ${row.label} | ${formatMedian(summary.baseMedian, summary.baseMad, row)} | ${formatMedian(summary.headMedian, summary.headMad, row)} | ${formatDelta(summary, row, significant)} | ${row.formatValue(summary.combinedMad)} |`);
		if (row.separatorAfter === true) lines.push('| | | | | |');
	}

	return lines.join('\n');
}
```

- [ ] **Step 4: Add the workspace public export**

In `packages-private/diagnostics-shared/package.json`, insert `./metric-table` while preserving the existing exports:

```json
"exports": {
	"./env": "./src/env.ts",
	"./format": "./src/format.ts",
	"./html": "./src/html.ts",
	"./stats": "./src/stats.ts",
	"./metric-table": "./src/metric-table.ts",
	"./heap-snapshot": "./src/heap-snapshot/index.ts"
}
```

- [ ] **Step 5: Run focused and shared verification**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/metric-table.test.ts
pnpm --filter diagnostics-shared exec eslint src/metric-table.ts test/metric-table.test.ts
```

Expected: all renderer tests and targeted eslint checks pass. Full-package typecheck is intentionally deferred until Task 3 completes the existing Heap Snapshot consumer migration.

- [ ] **Step 6: Review and commit the shared renderer**

Run:

```powershell
git diff --check
git diff -- packages-private/diagnostics-shared/src/metric-table.ts packages-private/diagnostics-shared/test/metric-table.test.ts packages-private/diagnostics-shared/package.json
git add packages-private/diagnostics-shared/src/metric-table.ts packages-private/diagnostics-shared/test/metric-table.test.ts packages-private/diagnostics-shared/package.json
git commit -m "feat(diagnostics): add shared metric table renderer"
```

Expected: the new source and test both contain SPDX headers, the export points at the new source, and one commit is created.

---

### Task 3: Heap Snapshot table migration

**Files:**
- Modify: `packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts`
- Modify: `packages-private/diagnostics-shared/src/heap-snapshot/render.ts`

**Interfaces:**
- Consumes: `renderMetricComparisonTable<T>(...)` from Task 2 and the existing `HeapSnapshotReport`, `heapSnapshotCategories`, `formatBytes`, and swatch metadata.
- Produces: the unchanged public `renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport): string`, now using shared row options; all Sankey exports and behavior remain unchanged.

- [ ] **Step 1: Replace Heap Snapshot table tests with layout and significance expectations**

Keep the existing SPDX header, imports, and `snapshot`, `report`, `totalRow` helpers in `packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts`. Replace only the `describe('renderHeapSnapshotTable', ...)` block with:

```ts
describe('renderHeapSnapshotTable', () => {
	test('leaves a threshold-sized delta uncoloured when it is within observed noise', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_100_000, 1_200_000]),
			report([1_100_000, 1_200_000, 1_300_000]),
		));

		expect(row).toContain('$\\text{+100 KB}$');
		expect(row).not.toContain('within noise');
		expect(row).not.toContain('\\color{orange}');
	});

	test('colours both delta lines for a clear increase at or above the absolute threshold', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_200_000, 1_200_000, 1_200_000]),
		));

		expect(row).toContain('$\\color{orange}{\\text{+200 KB}}$');
		expect(row).toContain('$\\color{orange}{\\text{+20\\\\%}}$');
		expect(row).not.toContain('increase');
	});

	test('leaves both delta lines uncoloured below the absolute threshold', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_050_000, 1_050_000, 1_050_000]),
		));

		expect(row).toContain('$\\text{+50 KB}$<br>$\\text{+5\\\\%}$');
		expect(row).not.toContain('\\color{');
	});

	test('throws when only one snapshot per side reaches the renderer', () => {
		expect(() => renderHeapSnapshotTable(
			report([1_000_000]),
			report([1_200_000]),
		)).toThrow('At least two samples per side are required');
	});

	test('uses two-line formatting only for Total and puts a five-column separator after it', () => {
		const table = renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_200_000, 1_200_000, 1_200_000]),
		);
		const lines = table.split('\n');
		const totalIndex = lines.findIndex(line => line.includes('**Total**'));
		const categoryRow = lines.find(line => line.includes('**Code**'));

		expect(lines.slice(0, 2)).toStrictEqual([
			'| Metric | @ Base | @ Head | Δ | MAD |',
			'| --- | ---: | ---: | ---: | ---: |',
		]);
		expect(table).not.toContain('Result');
		expect(totalIndex).toBeGreaterThan(1);
		expect(lines[totalIndex].match(/<br>/g)).toHaveLength(3);
		expect(lines[totalIndex + 1]).toBe('| | | | | |');
		expect(categoryRow).toBeDefined();
		expect(categoryRow).not.toContain('<br>');
		expect(categoryRow).not.toContain('<details>');
		expect(categoryRow).not.toContain('→');
	});
});
```

- [ ] **Step 2: Run the focused Heap Snapshot test and verify RED**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/heap-snapshot-render.test.ts
```

Expected: FAIL because the existing table still has a Result column/details percentages, still colors percentage separately, and no longer typechecks against Task 1's summary contract.

- [ ] **Step 3: Replace only the Heap Snapshot Markdown table implementation**

In `packages-private/diagnostics-shared/src/heap-snapshot/render.ts`, reduce the table-related imports to:

```ts
import { formatBytes } from '../format';
import { renderMetricComparisonTable } from '../metric-table';
```

Keep `heapSnapshotCategories`, `heapSnapshotCategory`, `HeapSnapshotCategory`, and `HeapSnapshotReport` imports. Delete `percentColorThreshold`, `isDirectionalVerdict`, all optional/median/delta/percentage formatters, and `categoryDeltaSummary`. Preserve `byteColorThreshold`, `categoryValue`, `swatch`, and all Sankey code. Replace `renderHeapSnapshotTable` with:

```ts
/**
 * base / head のheap snapshotをカテゴリ別に比較するMarkdownテーブルを描画する。
 */
export function renderHeapSnapshotTable(base: HeapSnapshotReport, head: HeapSnapshotReport) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		heapSnapshotCategories.map(category => ({
			label: swatch(category),
			getValue: sample => sample.data.categories[category],
			formatValue: formatBytes,
			absoluteThreshold: byteColorThreshold,
			showMedianMad: category === 'total',
			showDeltaPercentage: category === 'total',
			separatorAfter: category === 'total',
		})),
	);
}
```

This deliberately removes category percentages and their dependency on the Total median. `categoryValue` remains because `renderHeapSnapshotSankey` still uses the report summary.

- [ ] **Step 4: Run all shared tests and lint**

Run:

```powershell
pnpm --filter diagnostics-shared exec vitest run test/heap-snapshot-render.test.ts
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-shared lint
```

Expected: all `diagnostics-shared` tests and lint pass with zero failures. Confirm the renderer, stats, Heap Snapshot summary, and Sankey tests all execute.

- [ ] **Step 5: Review and commit the Heap Snapshot migration**

Run:

```powershell
git diff --check
git diff -- packages-private/diagnostics-shared/src/heap-snapshot/render.ts packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts
git add packages-private/diagnostics-shared/src/heap-snapshot/render.ts packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts
git commit -m "refactor(diagnostics): use shared heap snapshot table"
```

Expected: no Sankey behavior is changed, no Heap Snapshot public export changes, and one commit is created.

---

### Task 4: Backend metrics migration and warning semantics

**Files:**
- Modify: `packages-private/diagnostics-backend/test/render-md.test.ts`
- Modify: `packages-private/diagnostics-backend/src/report/markdown.ts`
- Modify: `packages-private/diagnostics-backend/test/__snapshots__/render-md.md`

**Interfaces:**
- Consumes: `renderMetricComparisonTable` from Task 2; strict `independentDeltaSummary`, `isOutsideObservedNoise`, and `IndependentDeltaSummary` from Task 1; unchanged Heap Snapshot wrapper from Task 3.
- Produces: unchanged `renderMemoryReportMarkdown(base, head, options): string`, with five-column Backend/Heap Snapshot tables, no verdict semantics, and the preserved independent PSS warning rule.

- [ ] **Step 1: Rewrite Backend integration expectations before implementation**

In `packages-private/diagnostics-backend/test/render-md.test.ts`, keep the fixture helpers, golden test, and zero-base setup. Replace the five tests after the golden test with these exact blocks:

```ts
test('throws when filtering leaves fewer than two heap snapshots per side', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	for (const report of [base, head]) {
		for (const sample of report.samples.slice(0, -1)) {
			sample.phases.afterGc.heapSnapshot = null;
		}
	}

	expect(() => renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	})).toThrow('At least two samples per side are required');
});

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
	expect(row.split('|')).toHaveLength(7);
	expect(row).not.toMatch(/within noise|increase|decrease|inconclusive/);
	expect(row).not.toContain('\\color{orange}');
	expect(findMetricRow(markdown, 'USS')).not.toContain('\\color{orange}');
});

test('keeps the convergence warning without suppressing table colour or the PSS warning', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	base.samples[0].phases.afterGc.memoryStability.converged = false;

	const markdown = renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});
	const memorySection = markdown.slice(0, markdown.indexOf('### V8 Heap Snapshot Statistics'));

	expect(memorySection).not.toContain('inconclusive');
	expect(findMetricRow(markdown, 'PSS')).toContain('\\color{orange}');
	expect(markdown).toContain('⚠️ **Measurement warning**: 1 memory sample did not converge.');
	expect(markdown).not.toContain('results are marked inconclusive');
	expect(markdown).toContain('⚠️ **Warning**: Memory usage (PSS)');
});

test('throws for an undersampled memory comparison', async () => {
	const base = await loadFixture('base');
	const head = await loadFixture('head');
	base.samples = base.samples.slice(0, 1);
	head.samples = head.samples.slice(0, 1);

	expect(() => renderMemoryReportMarkdown(base, head, {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	})).toThrow('At least two samples per side are required');
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
	expect(markdown).toContain('| Metric | @ Base | @ Head | Δ | MAD |');
	expect(markdown).not.toContain('| Metric | @ Base | @ Head | Δ | MAD | Result |');
});
```

Remove the now-unused `findTotalRow` helper. The golden test remains first and continues to use `./__snapshots__/render-md.md`.

- [ ] **Step 2: Run the Backend test and verify RED**

Run:

```powershell
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts
```

Expected: FAIL because the Backend source still imports removed verdict types/options, still emits Result/inconclusive, and does not throw for undersampling.

- [ ] **Step 3: Replace Backend-local table formatting with shared row definitions**

At the top of `packages-private/diagnostics-backend/src/report/markdown.ts`, use these imports:

```ts
import { formatKiBAsMb } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { renderMetricComparisonTable } from 'diagnostics-shared/metric-table';
import {
	independentDeltaSummary,
	isOutsideObservedNoise,
	type IndependentDeltaSummary,
} from 'diagnostics-shared/stats';
```

Delete `percentColorThreshold`, `hasNonConvergedMemorySample`, `isDirectionalVerdict`, `formatMedianWithMad`, `formatMemoryDelta`, and `formatMemoryDeltaPercent`. Replace `summarizeMemoryMetric`, `getDeltaPercent`, and `renderMainTableForPhase` with:

```ts
function summarizeMemoryMetric(base: MemoryReport, head: MemoryReport, phase: MemoryPhase, metric: MemoryMetric) {
	return independentDeltaSummary(
		base.samples,
		head.samples,
		sample => getMemoryValueFromSample(sample, phase, metric),
	);
}

function getDeltaPercent(summary: IndependentDeltaSummary) {
	if (summary.baseMedian === 0) return null;
	return summary.delta * 100 / summary.baseMedian;
}

function renderMainTableForPhase(base: MemoryReport, head: MemoryReport, phase: MemoryPhase) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		memoryMetrics.map(metric => ({
			label: `**${formatMemoryMetricName(metric)}**`,
			getValue: sample => getMemoryValueFromSample(sample, phase, metric),
			formatValue: formatKiBAsMb,
			absoluteThreshold: memoryColorThresholdKiB,
		})),
	);
}
```

Do not pass convergence state into either summary or renderer. All four metrics remain visible because this consumer does not set `onlySignificantChanges`.

- [ ] **Step 4: Update Backend explanatory and warning text**

Within `renderMemoryReportMarkdown`, replace the metric note with:

```ts
lines.push(`_Values are median ± MAD (${base.samples.length} base / ${head.samples.length} head samples). Delta is Head - Base. Deltas are highlighted when their absolute value reaches the metric threshold and exceeds 3 × MAD._`);
```

Replace the non-convergence warning body with:

```ts
lines.push(`⚠️ **Measurement warning**: ${nonConvergedSamples} memory ${noun} did not converge.`);
```

Replace the PSS warning condition with:

```ts
if (
	warningSummary.delta > 0 &&
	warningDiffPercent != null &&
	warningDiffPercent > 5 &&
	isOutsideObservedNoise(warningSummary)
) {
	lines.push(`⚠️ **Warning**: Memory usage (${formatMemoryMetricName(warningMetric)}) has increased by more than 5% and exceeds the observed sample noise. Please verify this is not an unintended change.`);
	lines.push('');
}
```

The 5% literal exists only in this PSS warning rule; do not reintroduce a table percentage threshold.

- [ ] **Step 5: Run the Backend tests and update the intentional golden**

Run:

```powershell
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts
pnpm --filter diagnostics-backend exec vitest run test/render-md.test.ts -u
```

Expected: the first run fails only because `test/__snapshots__/render-md.md` still contains the old six-column output; the update run passes and rewrites that file. Inspect the golden diff and verify:

```powershell
git diff -- packages-private/diagnostics-backend/test/__snapshots__/render-md.md
```

Expected diff: both Backend and Heap Snapshot tables have five columns, no Result/verdict words remain, Heap Snapshot category labels no longer contain details/percentage arrows, and the explanatory text matches Step 4. Requests outside this report are absent from the diff.

- [ ] **Step 6: Run Backend package verification**

Run:

```powershell
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-backend lint
```

Expected: all Backend tests, typecheck, and eslint pass with zero failures.

- [ ] **Step 7: Review and commit the Backend migration**

Run:

```powershell
git diff --check
git diff -- packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-backend/test/render-md.test.ts packages-private/diagnostics-backend/test/__snapshots__/render-md.md
git add packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-backend/test/render-md.test.ts packages-private/diagnostics-backend/test/__snapshots__/render-md.md
git commit -m "refactor(diagnostics): use shared backend metric table"
```

Expected: only Backend renderer/tests/golden are committed and no workflow or report type changes are staged.

---

### Task 5: Frontend significant-only metrics migration

**Files:**
- Modify: `packages-private/diagnostics-frontend/test/report.test.ts`
- Modify: `packages-private/diagnostics-frontend/src/report.ts`
- Modify: `packages-private/diagnostics-frontend/test/__snapshots__/report.md`

**Interfaces:**
- Consumes: `renderMetricComparisonTable` from Task 2 and `renderHeapSnapshotTable` from Task 3.
- Produces: unchanged `renderFrontendDiagnosticsMarkdown(input): string`, with shared significant-only Browser metrics; resource-type HTML, Heap Snapshot wrapper, Bundle Stats, visualizer, and artifact links retain their existing interfaces.

- [ ] **Step 1: Update the Frontend integration tests that define the new contract**

In `packages-private/diagnostics-frontend/test/report.test.ts`, change the golden test to include explicit scope guards:

```ts
test('renders one frontend diagnostics markdown report from bundle and browser data', async () => {
	const markdown = await renderReport('https://example.invalid/html');

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/report.md');
	expect(markdown).toContain('| Metric | @ Base | @ Head | Δ | MAD |');
	expect(markdown).not.toContain('| Metric | @ Base | @ Head | Δ | MAD | Result |');
	expect(markdown).toContain('<summary>Requests by resource type</summary>');
	expect(markdown).toContain('## 📦 Bundle Stats');
});
```

Replace the independent-median test with:

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
	expect(row).toContain('| 0 |');
	expect(row.split('|')).toHaveLength(7);
	expect(row).not.toMatch(/increase|decrease|within noise|inconclusive/);
	expect(row).not.toContain('\\color{green}');
});
```

Replace the percentage-threshold test with:

```ts
test('colours absolute and relative deltas together when the row is significant', async () => {
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
	expect(row).toContain('$\\color{orange}{\\text{+20 KB}}$<br>$\\color{orange}{\\text{+0\\\\%}}$');
	expect(row).toContain('| 0 B |');
	expect(row.split('|')).toHaveLength(7);
});
```

Replace the zero-base and undersampled tests with:

```ts
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
	expect(row).not.toContain('increase');
});

test('throws for a metric with fewer than two samples on one side', async () => {
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

	await expect(renderReport(null, { base, head }))
		.rejects.toThrow('At least two samples per side are required');
});
```

Keep the existing tests for the details link, within-noise filtering, count threshold, byte threshold, and threshold equality. They already express the approved `onlySignificantChanges` behavior and should continue to pass after migration.

- [ ] **Step 2: Run the Frontend report test and verify RED**

Run:

```powershell
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts
```

Expected: FAIL because the old source still imports verdict fields, emits Result, leaves the rounded 0% delta uncolored, and hides rather than throws for an undersampled metric.

- [ ] **Step 3: Remove Frontend-local independent table formatting**

At the top of `packages-private/diagnostics-frontend/src/report.ts`, use these diagnostics imports:

```ts
import { formatBytes, formatColoredDelta, formatNumber } from 'diagnostics-shared/format';
import { renderHeapSnapshotTable, type HeapSnapshotReport } from 'diagnostics-shared/heap-snapshot';
import { renderMetricComparisonTable } from 'diagnostics-shared/metric-table';
```

Keep `formatColoredDelta` because the separate `renderResourceTypeTable` HTML renderer still uses it. Delete the `diagnostics-shared/stats` import, `percentColorThreshold`, `isDirectionalVerdict`, `formatOptionalMetricValue`, `formatMetricMedianWithMad`, `formatMetricDelta`, `formatMetricDeltaPercent`, and `renderMetricRow`.

- [ ] **Step 4: Replace the Browser summary with declarative row definitions**

Keep `resourceTypeSampleBytes` unchanged. Replace `renderBrowserSummaryTable` in full with:

```ts
function renderBrowserSummaryTable(base: BrowserMetricsReport, head: BrowserMetricsReport) {
	return renderMetricComparisonTable(
		base.samples,
		head.samples,
		[
			{
				label: '**Requests**',
				getValue: sample => sample.network.requestCount,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Encoded network**',
				getValue: sample => sample.network.totalEncodedBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Decoded body**',
				getValue: sample => sample.network.totalDecodedBodyBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Same-origin encoded**',
				getValue: sample => sample.network.sameOriginEncodedBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Third-party encoded**',
				getValue: sample => sample.network.thirdPartyEncodedBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Script encoded**',
				getValue: sample => resourceTypeSampleBytes(sample, ['Script']),
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Stylesheet encoded**',
				getValue: sample => resourceTypeSampleBytes(sample, ['Stylesheet']),
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Fetch/XHR encoded**',
				getValue: sample => resourceTypeSampleBytes(sample, ['Fetch', 'XHR']),
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Image encoded**',
				getValue: sample => resourceTypeSampleBytes(sample, ['Image']),
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Font encoded**',
				getValue: sample => resourceTypeSampleBytes(sample, ['Font']),
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**WebSocket connections**',
				getValue: sample => sample.network.webSocketConnectionCount,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**WebSocket sent**',
				getValue: sample => sample.network.webSocketSentBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**WebSocket received**',
				getValue: sample => sample.network.webSocketReceivedBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
			{
				label: '**Page errors**',
				getValue: sample => sample.diagnostics.pageErrorCount,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Console log**',
				getValue: sample => sample.diagnostics.console.log,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Console warnings**',
				getValue: sample => sample.diagnostics.console.warning,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Console errors**',
				getValue: sample => sample.diagnostics.console.error,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Console info**',
				getValue: sample => sample.diagnostics.console.info,
				formatValue: formatNumber,
				absoluteThreshold: 1,
			},
			{
				label: '**Page-attributed memory**',
				getValue: sample => sample.performance.tabMemory.totalBytes,
				formatValue: formatBytes,
				absoluteThreshold: 10_000,
			},
		],
		{ onlySignificantChanges: true },
	);
}
```

Delete the old commented `getMetric` helper and commented `renderMetricRow(...)` candidates in this function because they refer to the removed API. This is dead-comment cleanup only; the 19 active metrics above exactly preserve the current active row set and thresholds.

- [ ] **Step 5: Update the Frontend explanatory note**

In `renderFrontendDiagnosticsMarkdown`, replace the Browser metrics note with:

```ts
`_Values are median ± MAD (${browser.base.samples.length} base / ${browser.head.samples.length} head samples). Δ is Head - Base. Only changes whose absolute delta reaches the metric threshold and exceeds 3 × MAD are shown._`,
```

Do not change `renderResourceTypeTable`, `toHeapSnapshotReport`, Bundle Stats rendering, visualizer rendering, or artifact-link logic.

- [ ] **Step 6: Run the Frontend tests and update the intentional golden**

Run:

```powershell
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts
pnpm --filter diagnostics-frontend exec vitest run test/report.test.ts -u
```

Expected: the first run fails only on the old `test/__snapshots__/report.md`; the update run passes. Inspect:

```powershell
git diff -- packages-private/diagnostics-frontend/test/__snapshots__/report.md
```

Expected diff: Browser metrics and nested Heap Snapshot tables have five columns and no verdict text; Browser metrics still contain only significant rows; Heap category percentage/details markup disappears; Requests by resource type, Bundle Stats, visualizer summary, and links are byte-for-byte unchanged outside context lines.

- [ ] **Step 7: Run Frontend package verification**

Run:

```powershell
pnpm --filter diagnostics-frontend test
pnpm --filter diagnostics-frontend lint
```

Expected: all Frontend diagnostics tests, typecheck, and eslint pass with zero failures.

- [ ] **Step 8: Review and commit the Frontend migration**

Run:

```powershell
git diff --check
git diff -- packages-private/diagnostics-frontend/src/report.ts packages-private/diagnostics-frontend/test/report.test.ts packages-private/diagnostics-frontend/test/__snapshots__/report.md
git add packages-private/diagnostics-frontend/src/report.ts packages-private/diagnostics-frontend/test/report.test.ts packages-private/diagnostics-frontend/test/__snapshots__/report.md
git commit -m "refactor(diagnostics): use shared frontend metric table"
```

Expected: only Frontend diagnostics renderer/tests/golden are committed and no `packages/frontend` or locale file is staged.

---

### Task 6: Cross-package verification, scope audit, and temporary-doc cleanup

**Files:**
- Delete: `docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md`
- Delete: `docs/superpowers/plans/2026-07-21-shared-diagnostics-metric-table.md`
- Verify only: all files changed by Tasks 1–5.

**Interfaces:**
- Consumes: all final implementations and tests from Tasks 1–5.
- Produces: a clean, reviewable branch whose net diff contains only diagnostics code/tests/goldens/package export and no temporary planning artifacts.

- [ ] **Step 1: Run the three focused package suites together**

Run:

```powershell
pnpm --filter diagnostics-shared test
pnpm --filter diagnostics-backend test
pnpm --filter diagnostics-frontend test
pnpm --filter diagnostics-shared lint
pnpm --filter diagnostics-backend lint
pnpm --filter diagnostics-frontend lint
```

Expected: all six commands pass with zero test, typecheck, or eslint failures.

- [ ] **Step 2: Scan final diagnostics code for removed concepts and fixed layout**

Run:

```powershell
rg -n "IndependentDeltaVerdict|forceInconclusive|percentColorThreshold|summary\.verdict|Result \|" packages-private/diagnostics-shared/src packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-frontend/src/report.ts
rg -n "Result \||\| (increase|decrease|within noise|inconclusive) \|" packages-private/diagnostics-backend/test/__snapshots__/render-md.md packages-private/diagnostics-frontend/test/__snapshots__/report.md
rg -n "renderMetricComparisonTable" packages-private/diagnostics-shared/src/heap-snapshot/render.ts packages-private/diagnostics-backend/src/report/markdown.ts packages-private/diagnostics-frontend/src/report.ts
```

Expected: the first two commands return no matches and exit code 1 (normal for `rg` with no matches). The third command finds exactly the shared renderer import and call in each of the three consumer source files.

- [ ] **Step 3: Run repository-wide lint and classify only known baseline failures if they persist**

Run:

```powershell
pnpm lint
```

Expected on the current checkout: diagnostics-shared, diagnostics-backend, and diagnostics-frontend pass. The root command may still fail in the six pre-existing unrelated packages (`backend`, `frontend-builder`, `frontend-shared`, `sw`, `frontend`, `frontend-embed`) because generated `misskey-js`/i18n modules are unavailable and the local `oxc` diagnostics are duplicated. Record the exact output; do not change unrelated packages to make this refactor green. If those baseline issues are absent in the execution environment, expect the whole command to pass.

- [ ] **Step 4: Audit the implementation diff against the approved scope**

Use the commit immediately before the approved design (`a0d609fda1c3aa3cf6e1d97bc87b61ef14075664`) as the net-diff base:

```powershell
git diff --check a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD
git diff --name-status a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD
git diff --stat a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD
```

Before cleanup, expected changed implementation paths are exactly:

```text
packages-private/diagnostics-shared/package.json
packages-private/diagnostics-shared/src/stats.ts
packages-private/diagnostics-shared/src/metric-table.ts
packages-private/diagnostics-shared/src/heap-snapshot/render.ts
packages-private/diagnostics-shared/test/stats.test.ts
packages-private/diagnostics-shared/test/metric-table.test.ts
packages-private/diagnostics-shared/test/heap-snapshot-render.test.ts
packages-private/diagnostics-backend/src/report/markdown.ts
packages-private/diagnostics-backend/test/render-md.test.ts
packages-private/diagnostics-backend/test/__snapshots__/render-md.md
packages-private/diagnostics-frontend/src/report.ts
packages-private/diagnostics-frontend/test/report.test.ts
packages-private/diagnostics-frontend/test/__snapshots__/report.md
```

The two `docs/superpowers` files may also appear before Step 5. No workflow, report type, `packages/backend`, `packages/frontend`, locale, migration, misskey-js, dependency-version, or CHANGELOG path may appear.

- [ ] **Step 5: Delete the temporary design and plan using an explicit patch**

Apply this repository patch after all implementation instructions are no longer needed:

```diff
*** Begin Patch
*** Delete File: docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md
*** Delete File: docs/superpowers/plans/2026-07-21-shared-diagnostics-metric-table.md
*** End Patch
```

Verify both paths are absent:

```powershell
Test-Path -LiteralPath docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md
Test-Path -LiteralPath docs/superpowers/plans/2026-07-21-shared-diagnostics-metric-table.md
git diff --name-status a0d609fda1c3aa3cf6e1d97bc87b61ef14075664 -- docs/superpowers
```

Expected: both `Test-Path` commands print `False`. The working-tree-aware docs diff prints nothing because both additions have now been removed relative to the fixed base.

- [ ] **Step 6: Commit the temporary-doc cleanup**

Run:

```powershell
git add docs/superpowers/specs/2026-07-21-shared-diagnostics-metric-table-design.md docs/superpowers/plans/2026-07-21-shared-diagnostics-metric-table.md
git diff --cached --check
git commit -m "docs: remove temporary metric table plans"
```

Expected: one cleanup commit is created. Because both documents were added after the fixed base, their add/delete history cancels out of the final net diff.

- [ ] **Step 7: Perform the Misskey shipping check and final net-diff verification**

Invoke the repository's `shipping-misskey-change` skill, then run:

```powershell
git diff --check a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD
git diff --name-status a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD
git diff --name-status a0d609fda1c3aa3cf6e1d97bc87b61ef14075664..HEAD -- docs/superpowers .github/workflows packages/backend packages/frontend locales CHANGELOG.md
git status --short
```

Expected:

- `git diff --check` prints nothing and exits 0.
- The full name-status list contains exactly the 13 implementation/test paths from Step 4.
- The scoped forbidden-path diff prints nothing.
- `git status --short` prints nothing.
- SPDX applies to both new TypeScript files; no locale/migration/API/misskey-js/CHANGELOG action is required for this private diagnostics refactor.

- [ ] **Step 8: Hand off evidence without publishing externally**

Report the six package commands, root-lint outcome (including exact unrelated baseline failures if any), final 13-file net scope, commit list, and the fact that temporary docs were removed. Do not push, open a PR, comment on GitHub, merge, or alter remote state unless the user separately requests it.
