export class AbusenoteId1704005554275 {
    name = 'AbusenoteId1704005554275'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "noteIds" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "noteIds"`);
    }
}
