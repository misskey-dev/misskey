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
 * Null, undefined, and empty arrays are supported, and duplicate values are ignored.
 * Result sets are de-duplicated, and will be empty if no data was added or removed (respectively).
 * The inputs are treated as un-ordered, so a re-ordering of the same data will NOT be considered a change.
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
			// delete operation removes duplicates to speed up the "after" loop
			if (!after.delete(host)) {
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

/**
 * Checks for any difference between two snapshots of data.
 * Null, undefined, and empty arrays are supported, and duplicate values are ignored.
 * The inputs are treated as un-ordered, so a re-ordering of the same data will NOT be considered a change.
 * @param dataBefore Array containing data before the change
 * @param dataAfter Array containing data after the change
 */
export function diffArraysSimple<T>(dataBefore: T[] | null | undefined, dataAfter: T[] | null | undefined): boolean {
	const before = dataBefore ? new Set(dataBefore) : null;
	const after = dataAfter ? new Set(dataAfter) : null;

	if (before?.size && after?.size) {
		// different size => changed
		if (before.size !== after.size) return true;

		// removed => changed
		for (const host of before) {
			// delete operation removes duplicates to speed up the "after" loop
			if (!after.delete(host)) {
				return true;
			}
		}

		// added => changed
		for (const host of after) {
			if (!before.has(host)) {
				return true;
			}
		}

		// identical values => no change
		return false;
	}

	// before and NOT after => change
	if (before?.size) return true;

	// after and NOT before => change
	if (after?.size) return true;

	// NEITHER before nor after => no change
	return false;
}
