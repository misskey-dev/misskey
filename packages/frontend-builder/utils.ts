
export function assertNever(x: never): never {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	throw new Error(`Unexpected type: ${(x as any)?.type ?? x}`);
}

export function assertType<T>(node: unknown): asserts node is T {
}
