const CHARS = '0123456789abcdef';

function getTime(time: number) {
	if (time < 0) time = 0;
	if (time === 0) {
		return CHARS[0];
	}

	time = Math.floor(time / 1000);

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

	for (let i = 0; i < 16; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}

	return str;
}

export function genObjectId(date: Date): string {
	return getTime(date.getTime()) + getRandom();
}
