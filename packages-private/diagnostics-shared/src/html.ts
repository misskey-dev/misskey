/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

import { escapeHtml } from './format';

/**
 * エスケープ済み、あるいは意図的にエスケープしない生のHTML断片。
 *
 * ただの文字列と型で区別するためだけの存在ではなく、`html` が実行時に
 * 「この値はもうエスケープしなくてよい」と判定するためのマーカーでもある。
 * 型だけのブランドにすると実行時に判定できず、結局エスケープ漏れを防げない。
 */
export class Raw {
	constructor(private readonly value: string) {}

	toString() {
		return this.value;
	}
}

/**
 * 文字列をエスケープせずそのまま埋め込む。
 * 呼び出しが差分に残るので、レビューで「なぜ生で入れてよいのか」を確認できる。
 */
export function raw(value: string) {
	return new Raw(value);
}

function interpolate(value: unknown): string {
	if (value instanceof Raw) return value.toString();
	// 配列をそのまま文字列化するとカンマ区切りで潰れるので、要素ごとに処理する
	if (Array.isArray(value)) return value.map(interpolate).join('');
	if (value == null) return '';
	return escapeHtml(value);
}

/**
 * HTMLを組み立てるタグ付きテンプレート。補間値は既定でエスケープされる。
 * エスケープしたくない場合は `raw()` で包む必要があるため、
 * 「うっかり生のまま埋め込む」ことが起きない。
 */
export function html(strings: TemplateStringsArray, ...values: unknown[]) {
	let result = strings[0];
	for (let i = 0; i < values.length; i++) {
		result += interpolate(values[i]) + strings[i + 1];
	}
	return new Raw(result);
}

/**
 * 断片を指定の区切り文字で連結する。
 * `html` の配列補間は区切り無しで繋ぐので、改行などを挟みたいときはこちらを使う。
 */
export function joinHtml(parts: readonly Raw[], separator: string) {
	return new Raw(parts.map(part => part.toString()).join(separator));
}
