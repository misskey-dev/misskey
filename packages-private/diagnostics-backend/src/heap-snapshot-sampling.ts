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

/**
 * 中央値に最も近いラウンドを代表として選ぶ。外れ値のスナップショットを成果物にしないため。
 */
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
