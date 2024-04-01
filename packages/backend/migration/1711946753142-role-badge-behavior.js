export class RoleBadgeBehavior1711946753142 {
    name = 'RoleBadgeBehavior1711946753142'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "badgeBehavior" character varying(256)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "badgeBehavior"`);
    }
}
