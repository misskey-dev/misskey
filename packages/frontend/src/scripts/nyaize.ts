/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

let enRegex1: RegExp;
let enRegex2: RegExp;
let enRegex3: RegExp;
let koRegex1: RegExp;
let koRegex2: RegExp;
let koRegex3: RegExp;
let fallback: boolean = true;

try {
	enRegex1 = new RegExp('(?<=n)a', 'gi');
	enRegex2 = new RegExp('(?<=morn)ing', 'gi');
	enRegex3 = new RegExp('(?<=every)one', 'gi');
	koRegex1 = new RegExp('[나-낳]', 'g');
	koRegex2 = new RegExp('(다$)|(다(?= ))|(다(?=!))|(다(?=\\?))|(다(?=\\.))', 'gm');
	koRegex3 = new RegExp('(야$)|(야(?= ))|(야(?=!))|(야(?=\\?))|(야(?=\\.))', 'gm');
	fallback = false;
} catch {
	enRegex1 = new RegExp('na', 'gi');
	enRegex2 = new RegExp('morning', 'gi');
	enRegex3 = new RegExp('everyone', 'gi');
	koRegex1 = new RegExp('[나-낳]', 'g');
	koRegex2 = new RegExp('다$', 'gm');
	koRegex3 = new RegExp('야$', 'gm');
}

function convertNormal(text: string): string {
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

function convertFallback(text: string): string {
	return text
		// ja-JP
		.replaceAll('な', 'にゃ').replaceAll('ナ', 'ニャ').replaceAll('ﾅ', 'ﾆｬ')
		// en-US
		.replace(enRegex1, x => x === 'NA' ? 'NYA' : 'nya')
		.replace(enRegex2, x => x === 'MORNING' ? 'MORNYAN' : 'mornyan')
		.replace(enRegex3, x => x === 'EVERYONE' ? 'EVERYNYAN' : 'everynyan')
		// ko-KR
		.replace(koRegex1, match => String.fromCharCode(
			match.charCodeAt(0)! + '냐'.charCodeAt(0) - '나'.charCodeAt(0),
		))
		.replace(koRegex2, '다냥').replaceAll('다 ', '다냥 ').replaceAll('다!', '다냥!').replaceAll('다?', '다냥?').replaceAll('다.', '다냥.')
		.replace(koRegex3, '냥').replaceAll('야 ', '냥 ').replaceAll('야!', '냥!').replaceAll('야?', '냥?').replaceAll('야.', '냥.');
}

export function nyaize(text: string): string {
	return !fallback ? convertNormal(text) : convertFallback(text);
}
