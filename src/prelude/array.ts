export function countIf<T>(f: (x: T) => boolean, xs: T[]): number {
	return xs.filter(f).length;
}

export function count<T>(x: T, xs: T[]): number {
	return countIf(y => x === y, xs);
}

export function concat<T>(xss: T[][]): T[] {
	return ([] as T[]).concat(...xss);
}

export function intersperse<T>(sep: T, xs: T[]): T[] {
	return concat(xs.map(x => [sep, x])).slice(1);
}

export function erase<T>(x: T, xs: T[]): T[] {
	return xs.filter(y => x !== y);
}

export function setDifference<T>(xs: T[], ys: T[]): T[] {
	return xs.filter(x => !ys.includes(x));
}

export function unique<T>(xs: T[]): T[] {
	return [...new Set(xs)];
}

export function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

export function groupBy<T>(f: (x: T, y: T) => boolean, xs: T[]): T[][] {
	const groups = [] as T[][];
	for (const x of xs) {
		if (groups.length !== 0 && f(groups[groups.length - 1][0], x)) {
			groups[groups.length - 1].push(x);
		} else {
			groups.push([x]);
		}
	}
	return groups;
}

export function groupOn<T, S>(f: (x: T) => S, xs: T[]): T[][] {
	return groupBy((a, b) => f(a) === f(b), xs);
}
