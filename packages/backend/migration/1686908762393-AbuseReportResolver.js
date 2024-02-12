/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AbuseReportResolver1686908762393 {
    name = 'AbuseReportResolver1686908762393'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."abuse_report_resolver_expiresat_enum" AS ENUM('1hour', '12hours', '1day', '1week', '1month', '3months', '6months', '1year', 'indefinitely')`);
        await queryRunner.query(`CREATE TABLE "abuse_report_resolver" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(256) NOT NULL, "targetUserPattern" character varying(1024), "reporterPattern" character varying(1024), "reportContentPattern" character varying(1024), "expirationDate" TIMESTAMP WITH TIME ZONE, "expiresAt" "public"."abuse_report_resolver_expiresat_enum" NOT NULL, "forward" boolean NOT NULL, CONSTRAINT "PK_093500bf1bb38880d38b1bb41dc" PRIMARY KEY ("id")); COMMENT ON COLUMN "abuse_report_resolver"."createdAt" IS 'The created date of AbuseReportResolver'; COMMENT ON COLUMN "abuse_report_resolver"."updatedAt" IS 'The updated date of AbuseReportResolver'; COMMENT ON COLUMN "abuse_report_resolver"."expirationDate" IS 'The expiration date of AbuseReportResolver'`);
        await queryRunner.query(`CREATE INDEX "IDX_fdd74ab625ed0f6a30c47b00e0" ON "abuse_report_resolver" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d90c2c0e555b1eb2e4f19c9ad4" ON "abuse_report_resolver" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_e83a32a146021c72ba9bde6675" ON "abuse_report_resolver" ("expirationDate") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_e83a32a146021c72ba9bde6675"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d90c2c0e555b1eb2e4f19c9ad4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fdd74ab625ed0f6a30c47b00e0"`);
        await queryRunner.query(`DROP TABLE "abuse_report_resolver"`);
        await queryRunner.query(`DROP TYPE "public"."abuse_report_resolver_expiresat_enum"`);
    }
}
