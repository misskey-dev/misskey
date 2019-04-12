export function ensure<T>(x: T): NonNullable<T> {
	if (x == null) {
		throw 'ぬるぽ';
	} else {
		return x!;
	}
}
