/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class NoteIdIndexForPinAndFavorite1780059833698 {
	name = 'NoteIdIndexForPinAndFavorite1780059833698';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		const concurrently = isConcurrentIndexMigrationEnabled ? 'CONCURRENTLY' : '';

		await queryRunner.query(`CREATE INDEX ${concurrently} IF NOT EXISTS "IDX_0e00498f180193423c992bc437" ON "note_favorite" ("noteId")`);
		await queryRunner.query(`CREATE INDEX ${concurrently} IF NOT EXISTS "IDX_68881008f7c3588ad7ecae471c" ON "user_note_pining" ("noteId")`);
	}

	async down(queryRunner) {
		const concurrently = isConcurrentIndexMigrationEnabled ? 'CONCURRENTLY' : '';

		await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "public"."IDX_68881008f7c3588ad7ecae471c"`);
		await queryRunner.query(`DROP INDEX ${concurrently} IF EXISTS "public"."IDX_0e00498f180193423c992bc437"`);
	}
}
