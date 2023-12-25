export class ShortName1695440131671 {
    name = 'ShortName1695440131671'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "shortName" character varying(64)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "shortName"`);
    }
}
