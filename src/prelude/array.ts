/**
 * Count the number of elements that satisfy the predicate
 */
export function countIf<T>(f: (x: T) => boolean, xs: T[]): number {
	return xs.filter(f).length;
}

/**
 * Count the number of elements that is equal to the element
 */
export function count<T>(x: T, xs: T[]): number {
	return countIf(y => x === y, xs);
}

/**
 * Concatenate an array of arrays
 */
export function concat<T>(xss: T[][]): T[] {
	return ([] as T[]).concat(...xss);
}

/**
 * Intersperse the element between the elements of the array
 * @param sep The element to be interspersed
 */
export function intersperse<T>(sep: T, xs: T[]): T[] {
	return concat(xs.map(x => [sep, x])).slice(1);
}

/**
 * Returns the array of elements that is not equal to the element
 */
export function erase<T>(x: T, xs: T[]): T[] {
	return xs.filter(y => x !== y);
}

/**
 * Finds the array of all elements in the first array not contained in the second array.
 * The order of result values are determined by the first array.
 */
export function difference<T>(xs: T[], ys: T[]): T[] {
	return xs.filter(x => !ys.includes(x));
}

/**
 * Remove all but the first element from every group of equivalent elements
 */
export function unique<T>(xs: T[]): T[] {
	return [...new Set(xs)];
}

export function sum(xs: number[]): number {
	return xs.reduce((a, b) => a + b, 0);
}

export function maximum(xs: number[]): number {
	return Math.max(...xs);
}

/**
 * Splits an array based on the equivalence relation.
 * The concatenation of the result equals to the argument.
 */
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

/**
 * Splits an array based on the equivalence relation induced by the function.
 * The concatenation of the result equals to the argument.
 */
export function groupOn<T, S>(f: (x: T) => S, xs: T[]): T[][] {
	return groupBy((a, b) => f(a) === f(b), xs);
}

/**
 * Compare two arrays by lexicographical order
 */
export function lessThan(xs: number[], ys: number[]): boolean {
	for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
		if (xs[i] < ys[i]) return true;
		if (xs[i] > ys[i]) return false;
	}
	return xs.length < ys.length;
}

/**
 * Returns the longest prefix of elements that satisfy the predicate
 */
export function takeWhile<T>(f: (x: T) => boolean, xs: T[]): T[] {
	const ys = [];
	for (const x of xs) {
		if (f(x)) {
			ys.push(x);
		} else {
			break;
		}
	}
	return ys;
}
