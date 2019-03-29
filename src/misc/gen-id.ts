// Misskey ID
// 長さ8の[2000年1月1日からの経過ミリ秒をbase36でエンコードしたもの] + 長さ2の[ランダムな文字列]

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

function getRandom() {
	let str = '';

	for (let i = 0; i < 2; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genId(date?: Date): string {
	if (date && (date > new Date())) date = new Date();
	return getTime(date ? date.getTime() : Date.now()).padStart(8, CHARS[0]) + getRandom();
}
