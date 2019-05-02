export function isDuplicateKeyValueError(e: Error): boolean {
	return e.message.startsWith('duplicate key value');
}
