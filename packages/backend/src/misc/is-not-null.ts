export function isNotNull<T>(input: T | undefined | null): input is T {
	return input != null;
}
