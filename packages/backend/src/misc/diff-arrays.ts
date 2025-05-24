/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export interface DiffResult<T> {
	added: T[];
	removed: T[];
}

/**
 * Calculates the difference between two snapshots of data.
 * Null, undefined, and empty arrays are supported, and values do not have to be unique.
 * Result sets are de-duplicated, and will be empty if no data was added or removed (respectively).
 * @param dataBefore Array containing data before the change
 * @param dataAfter Array containing data after the change
 */
export function diffArrays<T>(dataBefore: T[] | null | undefined, dataAfter: T[] | null | undefined): DiffResult<T> {
	const before = dataBefore ? new Set(dataBefore) : null;
	const after = dataAfter ? new Set(dataAfter) : null;

	// data before AND after => changed
	if (before?.size && after?.size) {
		const added: T[] = [];
		const removed: T[] = [];

		for (const host of before) {
			// before and NOT after => removed
			if (!after.has(host)) {
				removed.push(host);
			}
		}

		for (const host of after) {
			// after and NOT before => added
			if (!before.has(host)) {
				added.push(host);
			}
		}

		return { added, removed };
	}

	// data ONLY before => all removed
	if (before?.size) {
		return { added: [], removed: Array.from(before) };
	}

	// data ONLY after => all added
	if (after?.size) {
		return { added: Array.from(after), removed: [] };
	}

	// data NEITHER before nor after => no change
	return { added: [], removed: [] };
}
