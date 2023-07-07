export function isDuplicateKeyValueError(e: unknown | Error): boolean {
	return (
		(e as any).message &&
		((e as Error).message.startsWith("duplicate key value") ||
			(e as Error).message.startsWith("重複したキー値"))
	);
}
