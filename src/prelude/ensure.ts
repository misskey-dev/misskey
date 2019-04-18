/**
 * 値が null または undefined の場合はエラーを発生させ、そうでない場合は値をそのまま返します
 */
export function ensure<T>(x: T): NonNullable<T> {
	if (x == null) {
		throw new Error('ぬるぽ');
	} else {
		return x!;
	}
}
