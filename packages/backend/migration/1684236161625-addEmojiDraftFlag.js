/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddEmojiDraftFlag1684236161625 {
	name = 'AddEmojiDraftFlag1684236161625';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "emoji" ADD "draft" boolean NOT NULL DEFAULT false');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "emoji" DROP COLUMN "draft"');
	}
}
