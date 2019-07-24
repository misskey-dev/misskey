const dateTimeIntervals: {[span: string]: number} = {
	'day': 86400000,
	'hou': 3600000,
	'min': 60000,
	'sec': 1000
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

export function addTimespan(x: Date, value: number, span: string): Date {
	const s = span.substr(0, 3).toLowerCase();
	if (!dateTimeIntervals[s])
		throw new Error('Invalid timespan');

	return new Date(x.getTime() + (value * dateTimeIntervals[s]));
}

export function subtractTimespan(x: Date, value: number, span: string): Date {
	const s = span.substr(0, 3).toLowerCase();
	if (!dateTimeIntervals[s])
		throw new Error('Invalid timespan');

	return new Date(x.getTime() - (value * dateTimeIntervals[s]));
}
