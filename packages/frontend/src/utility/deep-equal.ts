/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

type JsonLike = string | number | boolean | null | undefined | JsonLike[] | { [key: string]: JsonLike } | Map<string, JsonLike>;

export function deepEqual(a: JsonLike, b: JsonLike): boolean {
	if (a === b) return true;
	if (typeof a !== typeof b) return false;

	if (a === null) return b === null;

	if (a === undefined) return b === undefined;

	if (Array.isArray(a) && Array.isArray(b)) {
		if (a.length !== b.length) return false;
		for (let i = 0; i < a.length; i++) {
			if (!deepEqual(a[i], b[i])) return false;
		}
		return true;
	} else if (a instanceof Map && b instanceof Map) {
		if (a.size !== b.size) return false;
		for (const [k, v] of a) {
			if (!deepEqual(v, b.get(k))) return false;
		}
		return true;
	} else if (((typeof a) === 'object') && ((typeof b) === 'object')) {
		const aks = Object.keys(a);
		const bks = Object.keys(b as { [key: string]: JsonLike });
		if (aks.length !== bks.length) return false;
		for (let i = 0; i < aks.length; i++) {
			const k = aks[i];
			if (!deepEqual((a as { [key: string]: JsonLike })[k], (b as { [key: string]: JsonLike })[k])) return false;
		}
		return true;
	}

	return false;
}
