/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: Meta テーブルに noqBotAccountId カラムを追加
// Noqestion（匿名質問箱）のDM通知用ボットアカウントIDを保持

export class AddNoqBotAccountId1767000000001 {
	name = 'AddNoqBotAccountId1767000000001'

	async up(queryRunner) {
		// noqBotAccountId カラム追加
		await queryRunner.query(`ALTER TABLE "meta" ADD "noqBotAccountId" character varying(32)`);

		// 外部キー制約追加
		await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_meta_noqBotAccountId" FOREIGN KEY ("noqBotAccountId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

		// コメント追加
		await queryRunner.query(`COMMENT ON COLUMN "meta"."noqBotAccountId" IS 'Noqestion用ボットアカウントID'`);
	}

	async down(queryRunner) {
		// 外部キー制約削除
		await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT IF EXISTS "FK_meta_noqBotAccountId"`);

		// カラム削除
		await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN IF EXISTS "noqBotAccountId"`);
	}
}
