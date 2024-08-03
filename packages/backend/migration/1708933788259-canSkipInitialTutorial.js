/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CanSkipInitialTutorial1708933788259 {
		name = 'CanSkipInitialTutorial1708933788259'

		async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" ADD "canSkipInitialTutorial" boolean NOT NULL DEFAULT true`);
		}

		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "canSkipInitialTutorial"`);
		}
}
