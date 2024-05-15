export class Loginbonus11715791271605 {
    name = 'Loginbonus11715791271605'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "getPoints"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "getPoints" integer NOT NULL DEFAULT '0'`);
		}

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "getPoints"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "getPoints" integer NOT NULL DEFAULT '0'`);
    }
}
