/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class NoteIdIndexForPinAndFavorite1780059833698 {
	name = 'NoteIdIndexForPinAndFavorite1780059833698';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		await this.ensureValidIndex(queryRunner, 'IDX_0e00498f180193423c992bc437', 'note_favorite', 'noteId');
		await this.ensureValidIndex(queryRunner, 'IDX_68881008f7c3588ad7ecae471c', 'user_note_pining', 'noteId');
	}

	async down(queryRunner) {
		const concurrently = isConcurrentIndexMigrationEnabled ? 'CONCURRENTLY' : '';

		await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "public"."IDX_68881008f7c3588ad7ecae471c"`);
		await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "public"."IDX_0e00498f180193423c992bc437"`);
	}

	async ensureValidIndex(queryRunner, indexName, tableName, columnName) {
		if (isConcurrentIndexMigrationEnabled) {
			const hasValidIndex = await queryRunner.query(`SELECT indisvalid FROM pg_index INNER JOIN pg_class ON pg_index.indexrelid = pg_class.oid WHERE pg_class.relname = '${indexName}'`);
			if (hasValidIndex.length === 0 || hasValidIndex[0].indisvalid !== true) {
				await queryRunner.query(`DROP INDEX IF EXISTS "${indexName}"`);
				await queryRunner.query(`CREATE INDEX CONCURRENTLY "${indexName}" ON "${tableName}" ("${columnName}")`);
			}
		} else {
			await queryRunner.query(`CREATE INDEX IF NOT EXISTS "${indexName}" ON "${tableName}" ("${columnName}")`);
		}
	}
}
