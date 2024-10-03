/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FixTypo1683789676867 {
    name = 'FixTypo1683789676867'

    async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "user_profile" RENAME COLUMN "preventAiLarning" TO "preventAiLearning"`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user_profile" RENAME COLUMN "preventAiLearning" TO "preventAiLarning"`);
    }
}
