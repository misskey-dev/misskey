
export function isConcurrentIndexMigrationEnabled() {
	return process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';
}
