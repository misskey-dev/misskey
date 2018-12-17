/**
 * Return the number of matched items from target array by condition
 * @param condition Condition to match
 * @param source Source array
 */
export function countIf<T>(condition: (x: T) => boolean, source: T[]): number {
	return source.filter(condition).length;
}

/**
 * Return the number of matched items from target array by value
 * @param value Value to match
 * @param source Source array
 */
export function count<T>(value: T, source: T[]): number {
	return countIf(y => value === y, source);
}

/**
 * Flatten 2d arrays
 * @param source Source array of array
 */
export function concat<T>(source: T[][]): T[] {
	return ([] as T[]).concat(...source);
}

/**
 * Return a new array with interspersed
 * @param source Source array
 */
export function intersperse<T>(sep: T, source: T[]): T[] {
	return concat(source.map(s => [sep, s])).slice(1);
}

/**
 * Return a new array with erasing matched item from source array
 * @param value Value to match
 * @param source Source array
 */
export function erase<T>(value: T, source: T[]): T[] {
	return source.filter(s => value !== s);
}

/**
 * Finds the array of all elements in the first array not contained in the second array.
 * The order of result values are determined by the first array.
 */

/**
 * Finds the array of all elements in the first array not contained in the second array.
 * The order of result values are determined by the first array.
 * @param includes First array
 * @param excludes Second array
 */
export function difference<T>(includes: T[], excludes: T[]): T[] {
	return includes.filter(x => !excludes.includes(x));
}

/**
 * Return a new array with uniqued
 * @param source Source array
 */
export function unique<T>(source: T[]): T[] {
	return [...new Set(source)];
}

/**
 * Get sum of array numbers
 * @param source Source array
 */
export function sum(source: number[]): number {
	return source.reduce((a, b) => a + b, 0);
}

/**
 * Get maximun number from array
 * @param source Source array
 */
export function maximum(source: number[]): number {
	return Math.max(...source);
}

/**
 * Grouping array values by condition
 * @param condition Condition to match
 * @param source Source array
 */
export function groupBy<T>(condition: (x: T, y: T) => boolean, source: T[]): T[][] {
	const groups = [] as T[][];
	for (const s of source) {
		if (groups.length !== 0 && condition(groups[groups.length - 1][0], s)) {
			groups[groups.length - 1].push(s);
		} else {
			groups.push([s]);
		}
	}
	return groups;
}

/**
 * Grouping array values by keySelecter
 * @param keySelecter Grouping key selector
 * @param source Source array
 */
export function groupOn<T, S>(keySelecter: (x: T) => S, source: T[]): T[][] {
	return groupBy((a, b) => keySelecter(a) === keySelecter(b), source);
}

/**
 * Compare values like version string
 * true if first item less than second one
 * @param xs First
 * @param ys Second
 */
export function lessThan(xs: number[], ys: number[]): boolean {
	for (let i = 0; i < Math.min(xs.length, ys.length); i++) {
		if (xs[i] < ys[i]) return true;
		if (xs[i] > ys[i]) return false;
	}
	return xs.length < ys.length;
}

/**
 * Return a new array with taking value from source array while condition match
 * @param condition Condition to match
 * @param source Source array
 */
export function takeWhile<T>(condition: (x: T) => boolean, source: T[]): T[] {
	const results = [];
	for (const s of source) {
		if (condition(s)) {
			results.push(s);
		} else {
			break;
		}
	}
	return results;
}
