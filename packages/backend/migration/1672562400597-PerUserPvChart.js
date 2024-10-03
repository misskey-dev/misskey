/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PerUserPvChart1672562400597 {
    name = 'PerUserPvChart1672562400597'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "__chart__per_user_pv" ("id" SERIAL NOT NULL, "date" integer NOT NULL, "group" character varying(128) NOT NULL, "unique_temp___upv_user" character varying array NOT NULL DEFAULT '{}', "___upv_user" smallint NOT NULL DEFAULT '0', "___pv_user" smallint NOT NULL DEFAULT '0', "unique_temp___upv_visitor" character varying array NOT NULL DEFAULT '{}', "___upv_visitor" smallint NOT NULL DEFAULT '0', "___pv_visitor" smallint NOT NULL DEFAULT '0', CONSTRAINT "UQ_f2a56da57921ca8439f45c1d95f" UNIQUE ("date", "group"), CONSTRAINT "PK_3c938a24f0203b5bd13fab51059" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f2a56da57921ca8439f45c1d95" ON "__chart__per_user_pv" ("date", "group") `);
        await queryRunner.query(`CREATE TABLE "__chart_day__per_user_pv" ("id" SERIAL NOT NULL, "date" integer NOT NULL, "group" character varying(128) NOT NULL, "unique_temp___upv_user" character varying array NOT NULL DEFAULT '{}', "___upv_user" smallint NOT NULL DEFAULT '0', "___pv_user" smallint NOT NULL DEFAULT '0', "unique_temp___upv_visitor" character varying array NOT NULL DEFAULT '{}', "___upv_visitor" smallint NOT NULL DEFAULT '0', "___pv_visitor" smallint NOT NULL DEFAULT '0', CONSTRAINT "UQ_f221e45cfac5bea0ce0f3149fbb" UNIQUE ("date", "group"), CONSTRAINT "PK_0085d7542f6772e99b9dcfb0a9c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f221e45cfac5bea0ce0f3149fb" ON "__chart_day__per_user_pv" ("date", "group") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_f221e45cfac5bea0ce0f3149fb"`);
        await queryRunner.query(`DROP TABLE "__chart_day__per_user_pv"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f2a56da57921ca8439f45c1d95"`);
        await queryRunner.query(`DROP TABLE "__chart__per_user_pv"`);
    }
}
