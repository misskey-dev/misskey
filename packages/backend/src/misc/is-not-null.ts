export function isNotNull<T extends {}>(input: T | undefined | null): input is T {
	return input != null;
}
