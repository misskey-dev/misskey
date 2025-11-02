/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowedMessage1723944246767 {
	name = 'FollowedMessage1723944246767';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" ADD "followedMessage" character varying(256)');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "user_profile" DROP COLUMN "followedMessage"');
	}
}
