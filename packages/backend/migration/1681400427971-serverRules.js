export class ServerRules1681400427971 {
    name = 'ServerRules1681400427971'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "serverRules" character varying(280) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "serverRules"`);
    }
}
