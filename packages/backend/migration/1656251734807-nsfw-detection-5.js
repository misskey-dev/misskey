export class nsfwDetection51656251734807 {
    name = 'nsfwDetection51656251734807'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_fc2d74a6d7d8b11292a851d8f8"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "forceIsSensitive"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "predictedIsSensitive"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "forceIsSensitiveWhenPredicted"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disallowUploadWhenPredictedAsPorn"`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "maybeSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."maybeSensitive" IS 'Whether the DriveFile is NSFW. (predict)'`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "maybePorn" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "setSensitiveFlagAutomatically" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "autoSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_3b33dff77bb64b23c88151d23e" ON "drive_file" ("maybeSensitive") `);
        await queryRunner.query(`CREATE INDEX "IDX_8bdcd3dd2bddb78014999a16ce" ON "drive_file" ("maybePorn") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_8bdcd3dd2bddb78014999a16ce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3b33dff77bb64b23c88151d23e"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "autoSensitive"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "setSensitiveFlagAutomatically"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "maybePorn"`);
        await queryRunner.query(`COMMENT ON COLUMN "drive_file"."maybeSensitive" IS 'Whether the DriveFile is NSFW. (predict)'`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "maybeSensitive"`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "disallowUploadWhenPredictedAsPorn" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "forceIsSensitiveWhenPredicted" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "predictedIsSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "forceIsSensitive" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_fc2d74a6d7d8b11292a851d8f8" ON "drive_file" ("predictedIsSensitive") `);
    }
}
