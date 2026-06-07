/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoteRenoteLock1780190369217 {
	name = 'NoteRenoteLock1780190369217'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "userRenoteLock" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`ALTER TABLE "note" ADD "moderationRenoteLock" boolean NOT NULL DEFAULT false`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "moderationRenoteLock"`);
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "userRenoteLock"`);
	}
}
