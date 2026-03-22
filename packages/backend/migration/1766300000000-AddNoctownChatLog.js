/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddNoctownChatLog1766300000000 {
	name = 'AddNoctownChatLog1766300000000';

	async up(queryRunner) {
		// noctown_chat_log テーブル作成
		// チャットメッセージを24時間保存するためのログテーブル
		await queryRunner.query(`
			CREATE TABLE "noctown_chat_log" (
				"id" varchar(32) NOT NULL,
				"playerId" varchar(32) NOT NULL,
				"content" text NOT NULL,
				"positionX" real NOT NULL,
				"positionZ" real NOT NULL,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT "PK_noctown_chat_log" PRIMARY KEY ("id")
			)
		`);

		// createdAt インデックス（24時間自動削除のため）
		await queryRunner.query(`CREATE INDEX "IDX_noctown_chat_log_createdAt" ON "noctown_chat_log" ("createdAt")`);

		// playerId インデックス（プレイヤー別クエリのため）
		await queryRunner.query(`CREATE INDEX "IDX_noctown_chat_log_playerId" ON "noctown_chat_log" ("playerId")`);

		// 外部キー制約（noctown_player への参照）
		await queryRunner.query(`
			ALTER TABLE "noctown_chat_log"
			ADD CONSTRAINT "FK_noctown_chat_log_playerId"
			FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);
	}

	async down(queryRunner) {
		// 外部キー制約削除
		await queryRunner.query(`ALTER TABLE "noctown_chat_log" DROP CONSTRAINT "FK_noctown_chat_log_playerId"`);

		// インデックス削除
		await queryRunner.query(`DROP INDEX "IDX_noctown_chat_log_playerId"`);
		await queryRunner.query(`DROP INDEX "IDX_noctown_chat_log_createdAt"`);

		// テーブル削除
		await queryRunner.query(`DROP TABLE "noctown_chat_log"`);
	}
}
