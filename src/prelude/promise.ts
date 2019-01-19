export function error(reason: string): never {
	throw reason;
}

export function errorWhen<T>(predicate: boolean, reason: string, x?: T): Promise<T> {
	return predicate ? Promise.reject(reason) : Promise.resolve(x);
}
