const dateTimeIntervals = {
	'day': 86400000,
	'hour': 3600000,
	'ms': 1,
};

export function dateUTC(time: number[]): Date {
	//@ts-ignore
	return new Date(Date.UTC(...time));
}

export function isTimeSame(a: Date, b: Date): boolean {
	return a.getTime() === b.getTime();
}

export function isTimeBefore(a: Date, b: Date): boolean {
	return (a.getTime() - b.getTime()) < 0;
}

export function isTimeAfter(a: Date, b: Date): boolean {
	return (a.getTime() - b.getTime()) > 0;
}

export function addTime(x: Date, value: number, span: keyof typeof dateTimeIntervals = 'ms'): Date {
	return new Date(x.getTime() + (value * dateTimeIntervals[span]));
}

export function subtractTime(x: Date, value: number, span: keyof typeof dateTimeIntervals = 'ms'): Date {
	return new Date(x.getTime() - (value * dateTimeIntervals[span]));
}
