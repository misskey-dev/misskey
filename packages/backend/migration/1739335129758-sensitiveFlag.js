export class SensitiveFlag1739335129758 {
    name = 'SensitiveFlag1739335129758'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "isSensitiveByModerator" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_e779d1afdfa44dc3d64213cd2e" ON "drive_file" ("isSensitiveByModerator") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_e779d1afdfa44dc3d64213cd2e"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "isSensitiveByModerator"`);
    }
}
