export class chartFederationActive1646633030285 {
    name = 'chartFederationActive1646633030285'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___active" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___active" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___active"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___active"`);
    }
}
