/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SensitiveMediaDetectionExternalService1780488454126 {
	name = 'SensitiveMediaDetectionExternalService1780488454126'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionApiUrl" character varying(1024)`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionApiKey" character varying(1024)`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionTimeout" integer NOT NULL DEFAULT '60000'`);
		await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionMaxImagesPerRequest" integer NOT NULL DEFAULT '4'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionMaxImagesPerRequest"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionTimeout"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionApiKey"`);
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionApiUrl"`);
	}
}
