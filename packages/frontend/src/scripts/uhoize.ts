/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function uhoize(text) {
	const gorillaNoises = ['ウホ', 'ウホホ', 'ウホッ'];
	let result = '';
	let noiseIndex = 0;
	for (let i = 0; i < text.length; i++) {
		if (!(/[、。.,\/#!$%\^&\*;:{}=\-_`~()]/.test(text[i]))) {
			if (/[^\x00-\x7F]/.test(text[i])) {
				noiseIndex =  Math.floor(Math.random() * 3);
				const japaneseNoises = ['ウホ', 'ウホホ', 'ウホッ'];
				result += japaneseNoises[noiseIndex];
			} else {
				noiseIndex = Math.floor(Math.random() * 2);
				const englishNoises = ['uho', 'uhoho'];
				result += englishNoises[noiseIndex];
			}
		}else{
			result += text[i];
		}
		if (text.length*1.3 < result.length) return result

	}
	return result;
}
