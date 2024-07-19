/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ReactionMute1721320100254 {
	name = 'ReactionMute1721320100254';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" ADD "mutedReactions" jsonb NOT NULL DEFAULT \'[]\'');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" DROP COLUMN "mutedReactions"');
	}
}
