/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AbuseUserReportCategory1703250468098 {
    name = 'AbuseUserReportCategory1703250468098'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "abuse_user_report" ADD "category" character varying(20) NOT NULL DEFAULT 'other'`);
			await queryRunner.query(`CREATE INDEX "IDX_5b9acc09094daeb8683e362778" ON "abuse_user_report" ("category") `);
	}

	async down(queryRunner) {
			await queryRunner.query(`DROP INDEX "public"."IDX_5b9acc09094daeb8683e362778"`);
			await queryRunner.query(`ALTER TABLE "abuse_user_report" DROP COLUMN "category"`);
	}
}
