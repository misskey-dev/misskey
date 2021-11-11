const CHARS = '0123456789abcdef';

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	time = Math.floor(time / 1000);

	return time.toString(16).padStart(8, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 16; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genObjectId(date: Date): string {
	return getTime(date.getTime()) + getRandom();
}
