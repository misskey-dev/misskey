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
	const summary = summarizeHeapSnapshotDataSamples(samples, sample => sample.data);
	if (summary == null) throw new Error('expected heap snapshot samples to produce a summary');

	return {
		summary,
		samples,
	};
}

function totalRow(markdown: string) {
	const row = markdown.split('\n').find(line => line.includes('**Total**'));
	if (row === undefined) throw new Error('expected heap snapshot table to contain a Total row');
	return row;
}

describe('renderHeapSnapshotTable', () => {
	test('leaves a threshold-sized delta uncoloured when it is within observed noise', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_100_000, 1_200_000]),
			report([1_100_000, 1_200_000, 1_300_000]),
		));

		expect(row).toContain('$\\text{+100\u00A0KB}$');
		expect(row).not.toContain('within noise');
		expect(row).not.toContain('\\color{orange}');
	});

	test('colours both delta lines for a clear increase at or above the absolute threshold', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_200_000, 1_200_000, 1_200_000]),
		));

		expect(row).toContain('$\\color{orange}{\\text{+200\u00A0KB}}$');
		expect(row).toContain('$\\color{orange}{\\text{+20\\\\%}}$');
		expect(row).not.toContain('increase');
	});

	test('leaves both delta lines uncoloured below the absolute threshold', () => {
		const row = totalRow(renderHeapSnapshotTable(
			report([1_000_000, 1_000_000, 1_000_000]),
			report([1_050_000, 1_050_000, 1_050_000]),
		));

		expect(row).toContain('$\\text{+50\u00A0KB}$<br>$\\text{+5\\\\%}$');
		expect(row.split('|')[4]).not.toContain('\\color{');
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
			'| Metric | @&nbsp;Base | @&nbsp;Head | Δ | MAD |',
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
