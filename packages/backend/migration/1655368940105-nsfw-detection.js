/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class nsfwDetection1655368940105 {
    name = 'nsfwDetection1655368940105'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "forceIsSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "predictedIsSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."predictedIsSensitive" IS 'Whether the DriveFile is NSFW. (predict)'`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetection_enum" AS ENUM('none', 'all', 'local', 'remote')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveImageDetection" "public"."meta_sensitiveimagedetection_enum" NOT NULL DEFAULT 'none'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "forceIsSensitiveWhenPredicted" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "IDX_fc2d74a6d7d8b11292a851d8f8" ON "drive_file" ("predictedIsSensitive") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_fc2d74a6d7d8b11292a851d8f8"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "forceIsSensitiveWhenPredicted"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveImageDetection"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetection_enum"`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."predictedIsSensitive" IS 'Whether the DriveFile is NSFW. (predict)'`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "predictedIsSensitive"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "forceIsSensitive"`);
    }
}
