// we are using {} as "any non-nullish value" as expected
// eslint-disable-next-line @typescript-eslint/ban-types
export function isNotNull<T extends {}>(input: T | undefined | null): input is T {
	return input != null;
}
