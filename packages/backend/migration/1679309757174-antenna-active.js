/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class antennaActive1679309757174 {
    name = 'antennaActive1679309757174'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT 'now'`);
        await queryRunner.query(`ALTER TABLE "antenna" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`CREATE INDEX "IDX_084c2abb8948ef59a37dce6ac1" ON "antenna" ("lastUsedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_36ef5192a1ce55ed0e40aa4db5" ON "antenna" ("isActive") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_36ef5192a1ce55ed0e40aa4db5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_084c2abb8948ef59a37dce6ac1"`);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "lastUsedAt"`);
    }
}
