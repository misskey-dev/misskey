/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class retentionDateKey1678869617549 {
    name = 'retentionDateKey1678869617549'

    async up(queryRunner) {
			await queryRunner.query(`TRUNCATE TABLE "retention_aggregation"`, undefined);
        await queryRunner.query(`ALTER TABLE "retention_aggregation" ADD "dateKey" character varying(512) NOT NULL`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_f7c3576b37bd2eec966ae24477" ON "retention_aggregation" ("dateKey") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_f7c3576b37bd2eec966ae24477"`);
        await queryRunner.query(`ALTER TABLE "retention_aggregation" DROP COLUMN "dateKey"`);
    }
}
