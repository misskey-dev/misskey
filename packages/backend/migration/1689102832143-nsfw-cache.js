/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NsfwCache1689102832143 {
	name = 'NsfwCache1689102832143'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" ADD "cacheRemoteSensitiveFiles" boolean NOT NULL DEFAULT true`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "cacheRemoteSensitiveFiles"`);
	}
}
