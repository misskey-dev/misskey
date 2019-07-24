const dateTimeIntervals = {
	'days': 86400000,
	'hours': 3600000,
};

export function DateUTC(time: number[]): Date {
	const r = new Date(0);
	r.setUTCFullYear(time[0], time[1], time[2]);
	if (time[3]) r.setUTCHours(time[3], ...time.slice(4));
	return r;
}

export function isTimeSame(a: Date, b: Date): boolean {
	return (a.getTime() - b.getTime()) === 0;
}

export function isTimeBefore(a: Date, b: Date): boolean {
	return (a.getTime() - b.getTime()) < 0;
}

export function isTimeAfter(a: Date, b: Date): boolean {
	return (a.getTime() - b.getTime()) > 0;
}

export function addTimespan(x: Date, value: number, span: keyof typeof dateTimeIntervals): Date {
	return new Date(x.getTime() + (value * dateTimeIntervals[span]));
}

export function subtractTimespan(x: Date, value: number, span: keyof typeof dateTimeIntervals): Date {
	return new Date(x.getTime() - (value * dateTimeIntervals[span]));
}
