// AID
// 長さ8の[2000年1月1日からの経過ミリ秒をbase36でエンコードしたもの] + 長さ2の[ノイズ文字列]

import * as crypto from 'node:crypto';

const TIME2000 = 946684800000;
let counter = crypto.randomBytes(2).readUInt16LE(0);

function getTime(time: number) {
	time = time - TIME2000;
	if (time < 0) time = 0;

	return time.toString(36).padStart(8, '0');
}

function getNoise() {
	return counter.toString(36).padStart(2, '0').slice(-2);
}

export function genAid(date: Date): string {
	const t = date.getTime();
	if (isNaN(t)) throw 'Failed to create AID: Invalid Date';
	counter++;
	return getTime(t) + getNoise();
}
