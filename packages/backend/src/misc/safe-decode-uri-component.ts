/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

function isInRange(bytes: Uint8Array, i: number, lo = 0x80, hi = 0xBF): boolean {
	return i < bytes.length && bytes[i] >= lo && bytes[i] <= hi;
}

/**
 * bytes[i] から始まる有効なUTF-8シーケンスのバイト長を返す。不正な場合は0
 * (decodeURIComponent と同じく、冗長表現・サロゲート・U+10FFFF超は不正とする)
 */
function getUtf8SequenceLength(bytes: Uint8Array, i: number): number {
	const b0 = bytes[i];
	if (b0 <= 0x7F) return 1;
	if (b0 >= 0xC2 && b0 <= 0xDF) return isInRange(bytes, i + 1) ? 2 : 0;
	if (b0 === 0xE0) return isInRange(bytes, i + 1, 0xA0) && isInRange(bytes, i + 2) ? 3 : 0;
	if (b0 === 0xED) return isInRange(bytes, i + 1, 0x80, 0x9F) && isInRange(bytes, i + 2) ? 3 : 0;
	if (b0 >= 0xE1 && b0 <= 0xEF) return isInRange(bytes, i + 1) && isInRange(bytes, i + 2) ? 3 : 0;
	if (b0 === 0xF0) return isInRange(bytes, i + 1, 0x90) && isInRange(bytes, i + 2) && isInRange(bytes, i + 3) ? 4 : 0;
	if (b0 >= 0xF1 && b0 <= 0xF3) return isInRange(bytes, i + 1) && isInRange(bytes, i + 2) && isInRange(bytes, i + 3) ? 4 : 0;
	if (b0 === 0xF4) return isInRange(bytes, i + 1, 0x80, 0x8F) && isInRange(bytes, i + 2) && isInRange(bytes, i + 3) ? 4 : 0;
	return 0;
}

/**
 * パーセントデコードする。不正なエスケープはその部分だけ元の形のまま残し、有効なUTF-8として解釈できる部分はデコードする
 */
export function safeDecodeURIComponent(str: string): string {
	try {
		return decodeURIComponent(str);
	} catch {
		// 不正なエスケープを含む場合
		// UTF-8として有効な範囲を自前で判定し、有効な範囲だけをデコードする
	}

	return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (run) => {
		const bytes = new Uint8Array(run.length / 3);
		for (let k = 0; k < bytes.length; k++) {
			bytes[k] = parseInt(run.slice(k * 3 + 1, k * 3 + 3), 16);
		}

		let result = '';
		let validStart = 0;
		let i = 0;
		while (i < bytes.length) {
			const len = getUtf8SequenceLength(bytes, i);
			if (len > 0) {
				i += len;
				continue;
			}
			result += decodeURIComponent(run.slice(validStart * 3, i * 3)) + run.slice(i * 3, i * 3 + 3);
			i++;
			validStart = i;
		}
		return result + decodeURIComponent(run.slice(validStart * 3));
	});
}
