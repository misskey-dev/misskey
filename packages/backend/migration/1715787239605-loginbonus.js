export class Loginbonus1715787239605 {
    name = 'Loginbonus1715787239605'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "getPoints" integer NOT NULL DEFAULT '0'`);    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "getPoints"`);    }
}
