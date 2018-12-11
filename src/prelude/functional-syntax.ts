export function switchMap<T, TResult>(source: T, fallback: TResult, ...cases: [T, TResult][]): TResult {
	const result = cases.find(([x, ]: [T, TResult]) => source === x);
	return result ? result[1] : fallback;
}
