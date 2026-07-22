/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { expect, test } from 'vitest';
import { pairedDeltaSummary } from 'diagnostics-shared/stats';
import { renderMemoryReportMarkdown } from '../src/report/markdown';
import type { MemoryReport } from '../src/types';

const fixturesDir = join(import.meta.dirname, 'fixtures');

async function loadFixture(name: string) {
	return JSON.parse(await readFile(join(fixturesDir, `${name}.json`), 'utf8')) as MemoryReport;
}

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
	const row = markdown.split('\n').find(line => line.startsWith(`| **${metric}**`));
	if (row === undefined) throw new Error(`expected memory report to contain a ${metric} row`);
	return row;
}

/**
 * 出力をゴールデンファイルで固定する。
 * 意図的に変更したときは `vitest -u` で更新し、__snapshots__ の差分もレビューすること。
 */
test('renders the backend memory report', async () => {
	const markdown = renderMemoryReportMarkdown(await loadFixture('base'), await loadFixture('head'), {
		baseHeapSnapshotUrl: 'https://example.invalid/base',
		headHeapSnapshotUrl: 'https://example.invalid/head',
	});

	await expect(markdown).toMatchFileSnapshot('./__snapshots__/render-md.md');
});

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
