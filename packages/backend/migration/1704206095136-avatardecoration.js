export class Avatardecoration1704206095136 {
    name = 'Avatardecoration1704206095136'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" ADD "category" character varying(256) NOT NULL DEFAULT ''`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "avatar_decoration" DROP COLUMN "category"`);
    }
}
