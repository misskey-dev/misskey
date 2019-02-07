export interface Maybe<T> {
	isJust(): this is Just<T>;
}

export type Just<T> = Maybe<T> & {
	get(): T
};

export function just<T>(value: T): Just<T> {
	return {
		isJust: () => true,
		get: () => value
	};
}

export function nothing<T>(): Maybe<T> {
	return {
		isJust: () => false,
	};
}
