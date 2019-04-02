// AID
// 長さ8の[2000年1月1日からの経過ミリ秒をbase36でエンコードしたもの] + 長さnの[ランダムな文字列]

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const TIME2000 = 946684800000;

function getTime(time: number) {
	time = time - TIME2000;
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	const n = CHARS.length;
	let s = '';

	while (time > 0) {
		s = CHARS[time % n] + s;
		time = Math.floor(time / n);
	}

	return s;
}

function getRandom(length: number) {
	let str = '';

	for (let i = 0; i < length; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genAid(date: Date, rand: number): string {
	return getTime(date.getTime()).padStart(8, CHARS[0]) + getRandom(rand);
}
