/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV51643966656277 {
    name = 'chartV51643966656277'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "unique_temp___local_users" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" ADD "unique_temp___remote_users" character varying array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__hashtag" DROP COLUMN "unique_temp___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__hashtag" DROP COLUMN "unique_temp___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__active_users" DROP COLUMN "unique_temp___local_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___remote_users"`);
        await queryRunner.query(`ALTER TABLE "__chart__active_users" DROP COLUMN "unique_temp___local_users"`);
    }
}
