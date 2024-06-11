/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AnnouncementSilence1699141698112 {
    name = 'AnnouncementSilence1699141698112'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "silence" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_7b8d9225168e962f94ea517e00" ON "announcement" ("silence") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_7b8d9225168e962f94ea517e00"`);
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "silence"`);
    }
}
