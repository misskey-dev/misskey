/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export function hms (ms: number, enableMs = false) {
	const res: string[] = [];

	// ミリ秒を秒に変換
	let seconds = Math.floor(ms / 1000);

	// 小数点以下の値（２位まで）
	const mili = ms - seconds * 1000;

	// 時間を計算
	const hours = Math.floor(seconds / 3600);
	if (hours > 0) res.push(format(hours));
	seconds %= 3600;

	// 分を計算
	const minutes = Math.floor(seconds / 60);
	res.push(format(minutes));
	seconds %= 60;

	// 残った秒数を取得
	seconds = seconds % 60;
	res.push(format(seconds));

	// 結果を返す
	return res.join(':') + (enableMs ? '.' + format(Math.floor(mili / 10)) : '');
}

function format(n: number) {
	return n.toString().padStart(2, '0');
}
