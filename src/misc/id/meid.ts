const CHARS = '0123456789abcdef';

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	return time.toString(16).padStart(16, CHARS[0]);
}

function getRandom() {
	let str = '';

	for (let i = 0; i < 7; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genMeid(date: Date): string {
	return 'f' + getTime(date.getTime()) + getRandom();
}
