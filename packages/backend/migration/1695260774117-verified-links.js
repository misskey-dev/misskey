export class VerifiedLinks1695260774117 {
    name = 'VerifiedLinks1695260774117'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "verifiedLinks" character varying array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "verifiedLinks"`);
    }
}
