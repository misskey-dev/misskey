

export class chartV121644328606241 {
    name = 'chartV121644328606241'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__notes" ADD "___local_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__notes" ADD "___remote_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__notes" ADD "___local_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__notes" ADD "___remote_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ADD "___notes_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ADD "___notes_diffs_withFile" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__per_user_notes" ADD "___diffs_withFile" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__per_user_notes" ADD "___diffs_withFile" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__per_user_notes" DROP COLUMN "___diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart__per_user_notes" DROP COLUMN "___diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" DROP COLUMN "___notes_diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" DROP COLUMN "___notes_diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__notes" DROP COLUMN "___remote_diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__notes" DROP COLUMN "___local_diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart__notes" DROP COLUMN "___remote_diffs_withFile"`);
        await queryRunner.query(`ALTER TABLE "__chart__notes" DROP COLUMN "___local_diffs_withFile"`);
    }
}
