/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ProhibitedWordsForNameOfUser1728634286056 {
		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "prohibitedWordsForNameOfUser" character varying(1024) array NOT NULL DEFAULT '{}'`);
		}

		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "prohibitedWordsForNameOfUser"`);
		}
}
