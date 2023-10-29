/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function nyaize(text: string): string {
	return text
		// ja-JP
		.replaceAll('な', 'にゃ').replaceAll('ナ', 'ニャ').replaceAll('ﾅ', 'ﾆｬ')
		// en-US
		.replace(/(na|NA)(?=[^a-z])/g, (match) => match === 'NA' ? 'NYA' : 'nya')
		.replace(/(morn)(ing)(?=[^a-z])/gi, (match, p1, p2) => p2 === 'ING' ? `${p1}YAN` : `${p1.toLowerCase()}yan`)
		.replace(/(every)(one)(?=[^a-z])/gi, (match, p1, p2) => p2 === 'ONE' ? `${p1}NYAN` : `${p1.toLowerCase()}nyan`)
		// ko-KR
		.replace(/[나-낳]/g, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0),
		))
		.replace(/(다$)|(다(?=\.))|(다(?= ))|(다(?=!))|(다(?=\?))/gm, '다냥')
		.replace(/(야(?=\?))|(야$)|(야(?= ))/gm, '냥');
}
