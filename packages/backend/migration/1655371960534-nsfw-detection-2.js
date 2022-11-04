export class nsfwDetection21655371960534 {
    name = 'nsfwDetection21655371960534'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum" AS ENUM('medium', 'low', 'high')`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveImageDetectionSensitivity" "public"."meta_sensitiveimagedetectionsensitivity_enum" NOT NULL DEFAULT 'medium'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "disallowUploadWhenPredictedAsPorn" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "disallowUploadWhenPredictedAsPorn"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveImageDetectionSensitivity"`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum"`);
    }
}
