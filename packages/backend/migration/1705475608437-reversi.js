/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Reversi1705475608437 {
    name = 'Reversi1705475608437'

    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_b46ec40746efceac604142be1c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b604d92d6c7aec38627f6eaf16"`);
        await queryRunner.query(`ALTER TABLE "reversi_game" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "reversi_matching" DROP COLUMN "createdAt"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "reversi_matching" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`ALTER TABLE "reversi_game" ADD "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_b604d92d6c7aec38627f6eaf16" ON "reversi_matching" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b46ec40746efceac604142be1c" ON "reversi_game" ("createdAt") `);
    }
}
