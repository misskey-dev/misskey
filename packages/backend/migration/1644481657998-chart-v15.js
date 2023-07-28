/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV151644481657998 {
    name = 'chartV151644481657998'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___instance_total"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___instance_inc"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___instance_dec"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___instance_total"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___instance_inc"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___instance_dec"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___sub" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___pub" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___sub" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___pub" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___pub"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___sub"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___pub"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___sub"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___instance_dec" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___instance_inc" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___instance_total" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___instance_dec" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___instance_inc" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___instance_total" integer NOT NULL DEFAULT '0'`);
    }
}
