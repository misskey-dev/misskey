/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FollowingNotify1695288787870 {
    name = 'FollowingNotify1695288787870'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "following" ADD "notify" character varying(32)`);
        await queryRunner.query(`CREATE INDEX "IDX_5108098457488634a4768e1d12" ON "following" ("notify") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_5108098457488634a4768e1d12"`);
        await queryRunner.query(`ALTER TABLE "following" DROP COLUMN "notify"`);
    }
}
