/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RetentionAggregation21671926422832 {
    name = 'RetentionAggregation21671926422832'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "retention_aggregation" ADD "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "retention_aggregation"."updatedAt" IS 'The updated date of the GalleryPost.'`);
        await queryRunner.query(`ALTER TABLE "retention_aggregation" ADD "usersCount" integer NOT NULL`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "retention_aggregation" DROP COLUMN "usersCount"`);
        await queryRunner.query(`COMMENT ON COLUMN "retention_aggregation"."updatedAt" IS 'The updated date of the GalleryPost.'`);
        await queryRunner.query(`ALTER TABLE "retention_aggregation" DROP COLUMN "updatedAt"`);
    }
}
