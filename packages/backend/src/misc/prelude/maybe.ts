export interface IMaybe<T> {
	isJust(): this is IJust<T>;
}

export interface IJust<T> extends IMaybe<T> {
	get(): T;
}

export function just<T>(value: T): IJust<T> {
	return {
		isJust: () => true,
		get: () => value,
	};
}

export function nothing<T>(): IMaybe<T> {
	return {
		isJust: () => false,
	};
}
