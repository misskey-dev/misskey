export class nsfwDetection31655388169582 {
    name = 'nsfwDetection31655388169582'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum" RENAME TO "meta_sensitiveimagedetectionsensitivity_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum" AS ENUM('medium', 'low', 'high', 'veryLow', 'veryHigh')`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum" USING "sensitiveImageDetectionSensitivity"::"text"::"public"."meta_sensitiveimagedetectionsensitivity_enum"`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" SET DEFAULT 'medium'`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum_old"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum_old" AS ENUM('medium', 'low', 'high')`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum_old" USING "sensitiveImageDetectionSensitivity"::"text"::"public"."meta_sensitiveimagedetectionsensitivity_enum_old"`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "sensitiveImageDetectionSensitivity" SET DEFAULT 'medium'`);
        await queryRunner.query(`DROP TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."meta_sensitiveimagedetectionsensitivity_enum_old" RENAME TO "meta_sensitiveimagedetectionsensitivity_enum"`);
    }
}
