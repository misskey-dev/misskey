/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const dateTimeIntervals = {
	'day': 86400000,
	'hour': 3600000,
	'ms': 1,
};

export function dateUTC(time: number[]): Date {
	const d =
		time.length === 2 ? Date.UTC(time[0], time[1])
		: time.length === 3 ? Date.UTC(time[0], time[1], time[2])
		: time.length === 4 ? Date.UTC(time[0], time[1], time[2], time[3])
		: time.length === 5 ? Date.UTC(time[0], time[1], time[2], time[3], time[4])
		: time.length === 6 ? Date.UTC(time[0], time[1], time[2], time[3], time[4], time[5])
		: time.length === 7 ? Date.UTC(time[0], time[1], time[2], time[3], time[4], time[5], time[6])
		: null;

	if (!d) throw new Error('wrong number of arguments');

	return new Date(d);
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
