/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SupportMicropub1706599230317 {
    name = 'SupportMicropub1706599230317'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "downloadedFrom" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "createdByMicropub" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_aa00d9f0d9c8c99c5dd17ecca8" ON "drive_file" ("createdByMicropub") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_aa00d9f0d9c8c99c5dd17ecca8"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "createdByMicropub"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "downloadedFrom"`);
    }
}
