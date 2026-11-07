/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// structredCloneが遅いため
// SEE: http://var.blog.jp/archives/86038606.html

type Cloneable = string | number | boolean | null | undefined | { [key: string]: Cloneable } | Cloneable[];

export function deepClone<T extends Cloneable>(x: T): T {
	if (typeof x === 'object') {
		if (x === null) return x;
		if (Array.isArray(x)) return x.map(deepClone) as T;
		const obj = {} as Record<string, Cloneable>;
		for (const [k, v] of Object.entries(x)) {
			obj[k] = v === undefined ? undefined : deepClone(v);
		}
		return obj as T;
	} else {
		return x;
	}
}
