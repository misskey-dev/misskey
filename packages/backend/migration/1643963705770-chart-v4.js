/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV41643963705770 {
    name = 'chartV41643963705770'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__instance" DROP COLUMN "___drive_totalUsage"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" DROP COLUMN "___drive_totalUsage"`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" DROP COLUMN "___local_totalCount"`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" DROP COLUMN "___local_totalSize"`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" DROP COLUMN "___remote_totalCount"`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" DROP COLUMN "___remote_totalSize"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" DROP COLUMN "___local_totalCount"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" DROP COLUMN "___local_totalSize"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" DROP COLUMN "___remote_totalCount"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" DROP COLUMN "___remote_totalSize"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___local_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___remote_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___local_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___remote_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "___local_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "___remote_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "___local_users" bigint NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "___remote_users" bigint NOT NULL DEFAULT 0`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "___remote_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "___local_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "___remote_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "___local_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___remote_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "___local_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___remote_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "___local_users" character varying array NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" ADD "___remote_totalSize" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" ADD "___remote_totalCount" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" ADD "___local_totalSize" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__drive" ADD "___local_totalCount" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" ADD "___remote_totalSize" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" ADD "___remote_totalCount" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" ADD "___local_totalSize" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__drive" ADD "___local_totalCount" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart_day__instance" ADD "___drive_totalUsage" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "__chart__instance" ADD "___drive_totalUsage" bigint NOT NULL`);
    }
}
