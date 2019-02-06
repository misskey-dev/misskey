export interface Maybe<T> {
	isJust(): this is Just<T>;
	map<S>(f: (x: T) => S): Maybe<S>;
	getOrElse(x: T): T;
}

export type Just<T> = Maybe<T> & {
	get(): T
};

export function just<T>(value: T): Just<T> {
	return {
		isJust: () => true,
		getOrElse: (_: T) => value,
		map: <S>(f: (x: T) => S) => just(f(value)),
		get: () => value
	};
}

export function nothing<T>(): Maybe<T> {
	return {
		isJust: () => false,
		getOrElse: (value: T) => value,
		map: <S>(_: (x: T) => S) => nothing<S>()
	};
}

export function fromNullable<T>(value: T): Maybe<T> {
	return value == null ? nothing() : just(value);
}
