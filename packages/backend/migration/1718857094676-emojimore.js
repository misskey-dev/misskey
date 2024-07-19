/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Emojimore1718857094676 {
	name = 'Emojimore1718857094676';

	async up(queryRunner) {
		await queryRunner.query('DROP INDEX "IDX_ad0c221b25672daf2df320a817"');
		await queryRunner.query('CREATE INDEX "IDX_ad0c221b25672daf2df320a817" ON "note_reaction" ("userId", "noteId") ');
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_a7751b74317122d11575bff31c" ON "note_reaction" ("userId", "noteId", "reaction") ');
	}

	async down(queryRunner) {
			  await queryRunner.query('DROP INDEX "public"."IDX_a7751b74317122d11575bff31c"');
		await queryRunner.query('DROP INDEX "public"."IDX_ad0c221b25672daf2df320a817"');
		await queryRunner.query('CREATE UNIQUE INDEX "IDX_ad0c221b25672daf2df320a817" ON "note_reaction" ("userId", "noteId") ');
	}
}
