export function countIf<T>(f: (x: T) => boolean, xs: T[]): number {
	return xs.filter(f).length;
}

export function count<T>(x: T, xs: T[]): number {
	return countIf(y => x === y, xs);
}

export function intersperse<T>(sep: T, xs: T[]): T[] {
	return [].concat(...xs.map(x => [sep, x])).slice(1);
}
