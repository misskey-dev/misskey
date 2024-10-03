/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class nsfwDetection61656408772602 {
    name = 'nsfwDetection61656408772602'

    async up(queryRunner) {
				await queryRunner.query(`ALTER TABLE "meta" ADD "enableSensitiveMediaDetectionForVideos" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableSensitiveMediaDetectionForVideos"`);
    }
}
