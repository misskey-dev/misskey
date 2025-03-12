/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function deepEqual(a: any, b: any): boolean {
	if (a === b) return true;

	if (a === null) return b === null;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	} else if (((typeof a) === 'object') && ((typeof b) === 'object')) {
		const aks = Object.keys(a);
		const bks = Object.keys(b);
		if (aks.length !== bks.length) return false;
		for (let i = 0; i < aks.length; i++) {
			const k = aks[i];
			if (!deepEqual(a[k], b[k])) return false;
		}
		return true;
	}

	return false;
}
