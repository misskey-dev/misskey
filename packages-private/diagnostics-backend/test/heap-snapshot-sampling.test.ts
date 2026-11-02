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
