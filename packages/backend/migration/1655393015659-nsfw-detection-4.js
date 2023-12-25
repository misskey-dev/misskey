/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class nsfwDetection41655393015659 {
    name = 'nsfwDetection41655393015659'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveImageDetection"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetection_enum"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveImageDetectionSensitivity"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitivemediadetection_enum" AS ENUM('none', 'all', 'local', 'remote')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetection" "public"."meta_sensitivemediadetection_enum" NOT NULL DEFAULT 'none'`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitivemediadetectionsensitivity_enum" AS ENUM('medium', 'low', 'high', 'veryLow', 'veryHigh')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionSensitivity" "public"."meta_sensitivemediadetectionsensitivity_enum" NOT NULL DEFAULT 'medium'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionSensitivity"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitivemediadetectionsensitivity_enum"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetection"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitivemediadetection_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum" AS ENUM('medium', 'low', 'high', 'veryLow', 'veryHigh')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveImageDetectionSensitivity" "public"."meta_sensitiveimagedetectionsensitivity_enum" NOT NULL DEFAULT 'medium'`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetection_enum" AS ENUM('none', 'all', 'local', 'remote')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveImageDetection" "public"."meta_sensitiveimagedetection_enum" NOT NULL DEFAULT 'none'`);
    }
}
