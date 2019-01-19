/**
 * As an array
 */

export function arrayOf<T>(x: T | T[]): T[] {
	return Array.isArray(x) ? x : [x];
}

export function map<T, U>(x: T | T[], callbackfn: (value: T, index: number, array: T[]) => U): U | U[] {
	return Array.isArray(x) ? x.map(callbackfn) : callbackfn(x, 0, [x]);
}
