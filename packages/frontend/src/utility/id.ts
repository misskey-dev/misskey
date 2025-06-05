/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// ランダムな文字列が生成できればなんでも良い(時系列でソートできるなら尚良)が、とりあえずaidの実装を拝借

const TIME2000 = 946684800000;
let counter = Math.floor(Math.random() * 10000);

function getTime(time: number): string {
	time = time - TIME2000;
	if (time < 0) time = 0;

	return time.toString(36).padStart(8, '0');
}

function getNoise(): string {
	return counter.toString(36).padStart(2, '0').slice(-2);
}

export function genId(): string {
	counter++;
	return getTime(Date.now()) + getNoise();
}
