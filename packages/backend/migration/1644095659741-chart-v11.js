/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV111644095659741 {
    name = 'chartV111644095659741'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___notedUsers" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___notedUsers" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredWithinWeek" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredWithinWeek" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredWithinMonth" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredWithinMonth" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredWithinYear" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredWithinYear" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredOutsideWeek" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredOutsideWeek" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredOutsideMonth" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredOutsideMonth" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___registeredOutsideYear" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___registeredOutsideYear" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___notedUsers" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___notedUsers" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredWithinWeek" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredWithinWeek" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredWithinMonth" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredWithinMonth" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredWithinYear" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredWithinYear" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredOutsideWeek" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredOutsideWeek" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredOutsideMonth" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredOutsideMonth" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___registeredOutsideYear" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___registeredOutsideYear" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredOutsideYear"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredOutsideYear"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredOutsideMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredOutsideMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredOutsideWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredOutsideWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredWithinYear"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredWithinYear"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredWithinMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredWithinMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___registeredWithinWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___registeredWithinWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredOutsideYear"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredOutsideYear"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredOutsideMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredOutsideMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredOutsideWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredOutsideWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredWithinYear"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredWithinYear"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredWithinMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredWithinMonth"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___registeredWithinWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___registeredWithinWeek"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___notedUsers"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___remote_users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___local_users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___remote_users" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___local_users" integer NOT NULL DEFAULT '0'`);
    }
}
