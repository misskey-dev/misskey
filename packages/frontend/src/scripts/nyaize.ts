/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const enRegex1 = /(?<=n)a/gi;
const enRegex2 = /(?<=morn)ing/gi;
const enRegex3 = /(?<=every)one/gi;
const koRegex1 = /[나-낳]/g;
const koRegex2 = /(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm;
const koRegex3 = /(야(?=\?))|(야$)|(야(?= ))/gm;

export function nyaize(text: string): string {
	return text
		// ja-JP
		.replaceAll('な', 'にゃ').replaceAll('ナ', 'ニャ').replaceAll('ﾅ', 'ﾆｬ')
		// en-US
		.replace(enRegex1, x => x === 'A' ? 'YA' : 'ya')
		.replace(enRegex2, x => x === 'ING' ? 'YAN' : 'yan')
		.replace(enRegex3, x => x === 'ONE' ? 'NYAN' : 'nyan')
		// ko-KR
		.replace(koRegex1, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0),
		))
		.replace(koRegex2, '다냥')
		.replace(koRegex3, '냥');
}
