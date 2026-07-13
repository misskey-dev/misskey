/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AutoArchiveAnnouncements1783898601448 {
    name = 'AutoArchiveAnnouncements1783898601448';

    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "announcement" ADD "autoArchiveAt" TIMESTAMP WITH TIME ZONE');
    }

    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "announcement" DROP COLUMN "autoArchiveAt"');
    }
}
