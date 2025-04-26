/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CompositeNoteIndex1745378064470 {
	name = 'CompositeNoteIndex1745378064470';

	async up(queryRunner) {
		await queryRunner.query(`CREATE INDEX "IDX_724b311e6f883751f261ebe378" ON "note" ("userId", "id" DESC)`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_5b87d9d19127bd5d92026017a7"`);
		// Flush all cached Linear Scan Plans and redo statistics for composite index
		// this is important for Postgres to learn that even in highly complex queries, using this index first can reduce the result set significantly
		await queryRunner.query(`ANALYZE "user", "note"`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_724b311e6f883751f261ebe378"`);
		await queryRunner.query(`CREATE INDEX "IDX_5b87d9d19127bd5d92026017a7" ON "note" ("userId")`);
	}
}
