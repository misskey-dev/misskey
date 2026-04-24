/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * idとオブジェクトを分離する
 * @param input idまたはオブジェクトの配列
 * @returns idの配列とオブジェクトの配列
 */
export function splitIdAndObjects<T extends { id: string }>(input: (T | string)[]): { ids: string[]; objects: T[] } {
	const ids: string[] = [];
	const objects : T[] = [];

	for (const item of input) {
		if (typeof item === 'string') {
			ids.push(item);
		} else {
			objects.push(item);
		}
	}

	return {
		ids,
		objects,
	};
}
