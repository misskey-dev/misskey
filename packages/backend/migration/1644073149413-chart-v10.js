/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class chartV101644073149413 {
    name = 'chartV101644073149413'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "__chart__ap_request" ("id" SERIAL NOT NULL, "date" integer NOT NULL, "___deliverFailed" integer NOT NULL DEFAULT '0', "___deliverSucceeded" integer NOT NULL DEFAULT '0', "___inboxReceived" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_e56f4beac5746d44bc3e19c80d0" UNIQUE ("date"), CONSTRAINT "PK_56a25cd447c7ee08876b3baf8d8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e56f4beac5746d44bc3e19c80d" ON "__chart__ap_request" ("date") `);
        await queryRunner.query(`CREATE TABLE "__chart_day__ap_request" ("id" SERIAL NOT NULL, "date" integer NOT NULL, "___deliverFailed" integer NOT NULL DEFAULT '0', "___deliverSucceeded" integer NOT NULL DEFAULT '0', "___inboxReceived" integer NOT NULL DEFAULT '0', CONSTRAINT "UQ_a848f66d6cec11980a5dd595822" UNIQUE ("date"), CONSTRAINT "PK_9318b49daee320194e23f712e69" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a848f66d6cec11980a5dd59582" ON "__chart_day__ap_request" ("date") `);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "unique_temp___deliveredInstances" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___deliveredInstances" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "unique_temp___inboxInstances" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" ADD "___inboxInstances" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "unique_temp___deliveredInstances" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___deliveredInstances" smallint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "unique_temp___inboxInstances" character varying array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" ADD "___inboxInstances" smallint NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___inboxInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "unique_temp___inboxInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "___deliveredInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart_day__federation" DROP COLUMN "unique_temp___deliveredInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___inboxInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "unique_temp___inboxInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "___deliveredInstances"`);
        await queryRunner.query(`ALTER TABLE "__chart__federation" DROP COLUMN "unique_temp___deliveredInstances"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_a848f66d6cec11980a5dd59582"`);
        await queryRunner.query(`DROP TABLE "__chart_day__ap_request"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e56f4beac5746d44bc3e19c80d"`);
        await queryRunner.query(`DROP TABLE "__chart__ap_request"`);
    }
}
