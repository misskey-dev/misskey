/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV141644344266289 {
    name = 'chartV141644344266289'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___readWrite" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___read" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___read" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___write" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___write" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___readWrite" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___read" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___read" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___write" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___write" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___write"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___write"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___read"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___read"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___readWrite"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___write"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___write"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___read"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___read"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___readWrite"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___notedUsers" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___notedUsers" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___notedUsers" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___notedUsers" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___users" character varying array NOT NULL DEFAULT '{}'`);
    }
}
