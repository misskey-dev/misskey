/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoteEditHistory1696044626209 {
	name = 'NoteEditHistory1696044626209'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "noteEditHistory" varchar(3000) array DEFAULT '{}'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP "noteEditHistory"`);
	}
}
