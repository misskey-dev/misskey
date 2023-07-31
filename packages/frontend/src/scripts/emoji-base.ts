/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const twemojiSvgBase = '/twemoji';
const fluentEmojiPngBase = '/fluent-emoji';

export function char2twemojiFilePath(char: string): string {
	let codes = Array.from(char, x => x.codePointAt(0)?.toString(16));
	if (!codes.includes('200d')) codes = codes.filter(x => x !== 'fe0f');
	codes = codes.filter(x => x && x.length);
	const fileName = codes.join('-');
	return `${twemojiSvgBase}/${fileName}.svg`;
}

export function char2fluentEmojiFilePath(char: string): string {
	let codes = Array.from(char, x => x.codePointAt(0)?.toString(16));
	// Fluent Emojiは国旗非対応 https://github.com/microsoft/fluentui-emoji/issues/25
	if (codes[0]?.startsWith('1f1')) return char2twemojiFilePath(char);
	if (!codes.includes('200d')) codes = codes.filter(x => x !== 'fe0f');
	codes = codes.filter(x => x && x.length);
	const fileName = codes.map(x => x!.padStart(4, '0')).join('-');
	return `${fluentEmojiPngBase}/${fileName}.png`;
}
