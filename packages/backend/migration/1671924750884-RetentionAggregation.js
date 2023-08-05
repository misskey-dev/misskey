/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RetentionAggregation1671924750884 {
    name = 'RetentionAggregation1671924750884'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "retention_aggregation" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userIds" character varying(32) array NOT NULL, "data" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_22aad3e8640b15fb3b90ee02d18" PRIMARY KEY ("id")); COMMENT ON COLUMN "retention_aggregation"."createdAt" IS 'The created date of the Note.'`);
        await queryRunner.query(`CREATE INDEX "IDX_09f4e5b9e4a2f268d3e284e4b3" ON "retention_aggregation" ("createdAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_09f4e5b9e4a2f268d3e284e4b3"`);
        await queryRunner.query(`DROP TABLE "retention_aggregation"`);
    }
}
