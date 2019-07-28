export function isBirthday(month: number, day: number) {
	const today = new Date();
	const tm = today.getMonth() + 1;
	const td = today.getDate();
	const y = today.getFullYear();
	const isLeapYear = y % 400 == 0 || (y % 4 == 0 && y % 100 != 0);

	if (is(month, day, 2, 29) && isLeapYear) {
		return is(tm, td, 2, 28);
	} else {
		return is(month, day, tm, td);
	}
}

function is(m1: number, d1: number, m2: number, d2: number) {
	return m1 === m2 && d1 === d2;
}
