const CHARS = '0123456789abcdef';

//  4bit Fixed hex value '7'
// 44bit UNIX Time ms in Hex
// 48bit Random value in Hex

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	return time.toString(16).padStart(11, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 12; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genMeid7(date: Date): string {
	return '7' + getTime(date.getTime()) + getRandom();
}
