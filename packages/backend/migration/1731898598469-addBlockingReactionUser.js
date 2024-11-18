/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddBlockingReactionUser1731898598469 {
    name = 'AddBlockingReactionUser1731898598469'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "blocking" ADD "isReactionBlock" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "blocking"."isReactionBlock" IS 'Whether the blockee is a reaction block.'`);
        await queryRunner.query(`CREATE INDEX "IDX_7b0698c38d27a5554bed4858bd" ON "blocking" ("isReactionBlock") `);
    }

    async down(queryRunner) {
				await queryRunner.query(`DELETE FROM blocking WHERE "isReactionBlock" = 'true'`);　// blockingテーブルのisReactionBlockカラムがtrueの行を削除する
				await queryRunner.query(`DROP INDEX "IDX_7b0698c38d27a5554bed4858bd"`);
        await queryRunner.query(`ALTER TABLE "blocking" DROP COLUMN "isReactionBlock"`);
    }
}
