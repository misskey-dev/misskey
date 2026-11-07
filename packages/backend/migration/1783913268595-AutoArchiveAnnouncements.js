/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AutoArchiveAnnouncements1783913268595 {
    name = 'AutoArchiveAnnouncements1783913268595';

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "autoArchiveAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`COMMENT ON COLUMN "announcement"."autoArchiveAt" IS 'The date after which the Announcement is automatically archived.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "announcement"."autoArchiveAt" IS 'The date after which the Announcement is automatically archived.'`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "autoArchiveAt"`);
    }
}
