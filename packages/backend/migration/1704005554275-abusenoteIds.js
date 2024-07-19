/*
 * SPDX-FileCopyrightText: syuilo and misskey-project , Type4ny-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AbusenoteId1704005554275 {
	name = 'AbusenoteId1704005554275';

	async up(queryRunner) {
		await queryRunner.query('ALTER TABLE "abuse_user_report" ADD "noteIds" jsonb NOT NULL DEFAULT \'[]\'');
	}

	async down(queryRunner) {
		await queryRunner.query('ALTER TABLE "abuse_user_report" DROP COLUMN "noteIds"');
	}
}
