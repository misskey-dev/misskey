

export class chartV131644331238153 {
    name = 'chartV131644331238153'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "unique_temp___stalled" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___stalled" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "unique_temp___stalled" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___stalled" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___stalled"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "unique_temp___stalled"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___stalled"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "unique_temp___stalled"`);
    }
}
