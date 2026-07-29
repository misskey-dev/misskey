/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class CompositeNoteIndex1745378064470 {
	name = 'CompositeNoteIndex1745378064470';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		const concurrently = isConcurrentIndexMigrationEnabled;

		if (concurrently) {
			const hasValidIndex = await queryRunner.query(`SELECT indisvalid FROM pg_index INNER JOIN pg_class ON pg_index.indexrelid = pg_class.oid WHERE pg_class.relname = 'IDX_724b311e6f883751f261ebe378'`);
			if (hasValidIndex.length === 0 || hasValidIndex[0].indisvalid !== true) {
				await queryRunner.query(`DROP INDEX IF EXISTS "IDX_724b311e6f883751f261ebe378"`);
				await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_724b311e6f883751f261ebe378" ON "note" ("userId", "id" DESC)`);
			}
		} else {
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_724b311e6f883751f261ebe378" ON "note" ("userId", "id" DESC)`);
		}

		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_5b87d9d19127bd5d92026017a7"`);
		// Flush all cached Linear Scan Plans and redo statistics for composite index
		// this is important for Postgres to learn that even in highly complex queries, using this index first can reduce the result set significantly
		await queryRunner.query(`ANALYZE "user", "note"`);
	}

	async down(queryRunner) {
		const mayConcurrently = isConcurrentIndexMigrationEnabled ? 'CONCURRENTLY' : '';
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_724b311e6f883751f261ebe378"`);
		await queryRunner.query(`CREATE INDEX ${mayConcurrently} "IDX_5b87d9d19127bd5d92026017a7" ON "note" ("userId")`);
	}
}
