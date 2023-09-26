/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function nyaize(text: string): string {
	return text
		// ja-JP
		.replaceAll('な', 'にゃ').replaceAll('ナ', 'ニャ').replaceAll('ﾅ', 'ﾆｬ')
		// en-US
		.replace(/(?<=n)a/gi, x => x === 'A' ? 'YA' : 'ya')
		.replace(/(?<=morn)ing/gi, x => x === 'ING' ? 'YAN' : 'yan')
		.replace(/(?<=every)one/gi, x => x === 'ONE' ? 'NYAN' : 'nyan')
		// ko-KR
		.replace(/[나-낳]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0),
		))
		.replace(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm, '다냥')
		.replace(/(야(?=\?))|(야$)|(야(?= ))/gm, '냥');
}
