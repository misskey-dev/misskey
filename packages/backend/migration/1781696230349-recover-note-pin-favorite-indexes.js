/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class RecoverNotePinFavoriteIndexes1781696230349 {
	name = 'RecoverNotePinFavoriteIndexes1781696230349';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		await this.ensureValidIndex(queryRunner, 'IDX_0e00498f180193423c992bc437', 'note_favorite', 'noteId');
		await this.ensureValidIndex(queryRunner, 'IDX_68881008f7c3588ad7ecae471c', 'user_note_pining', 'noteId');
	}

	async down(queryRunner) {
		// NoteIdIndexForPinAndFavorite1780059833698 で作成されるインデックスの補完なので、down でも存在する状態を維持する。
		// The previous migration owns these indexes, so reverting this repair keeps them present.
		await this.ensureValidIndex(queryRunner, 'IDX_0e00498f180193423c992bc437', 'note_favorite', 'noteId');
		await this.ensureValidIndex(queryRunner, 'IDX_68881008f7c3588ad7ecae471c', 'user_note_pining', 'noteId');
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
