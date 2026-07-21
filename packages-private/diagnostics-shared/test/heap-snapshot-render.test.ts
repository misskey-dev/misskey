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
