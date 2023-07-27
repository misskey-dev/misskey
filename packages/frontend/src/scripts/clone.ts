/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// structredCloneが遅いため
// SEE: http://var.blog.jp/archives/86038606.html
// あと、Vue RefをIndexedDBに保存しようとしてstructredCloneを使ったらエラーになった
// https://github.com/misskey-dev/misskey/pull/8098#issuecomment-1114144045

type Cloneable = string | number | boolean | null | { [key: string]: Cloneable } | Cloneable[];

export function deepClone<T extends Cloneable>(x: T): T {
	if (typeof x === 'object') {
		if (x === null) return x;
		if (Array.isArray(x)) return x.map(deepClone) as T;
		const obj = {} as Record<string, Cloneable>;
		for (const [k, v] of Object.entries(x)) {
			obj[k] = deepClone(v);
		}
		return obj as T;
	} else {
		return x;
	}
}
