// AID(Cheep)
// 長さ6の[2000年1月1日からの経過秒をbase36でエンコードしたもの] + 長さ3の[ランダムな文字列]

const CHARS = '0123456789abcdefghijklmnopqrstuvwxyz';
const TIME2000 = 946684800000;

function getTime(time: number) {
	time = time - TIME2000;
	if (time < 0) time = 0;
	time = Math.floor(time / 1000);
	return time.toString(36);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 3; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genAidc(date: Date): string {
	return getTime(date.getTime()).padStart(6, CHARS[0]) + getRandom();
}
