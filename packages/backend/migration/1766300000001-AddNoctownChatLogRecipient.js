/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// FR-029: チャットメッセージ受信者記録テーブル
// 50ブロック以内でメッセージを受信したプレイヤーを記録する中間テーブル

export class AddNoctownChatLogRecipient1766300000001 {
	name = 'AddNoctownChatLogRecipient1766300000001';

	async up(queryRunner) {
		// noctown_chat_log_recipient 中間テーブル作成
		await queryRunner.query(`
			CREATE TABLE "noctown_chat_log_recipient" (
				"id" varchar(32) NOT NULL,
				"chatLogId" varchar(32) NOT NULL,
				"recipientPlayerId" varchar(32) NOT NULL,
				"receivedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
				CONSTRAINT "PK_noctown_chat_log_recipient" PRIMARY KEY ("id")
			)
		`);

		// recipientPlayerId + receivedAt インデックス（履歴取得のため）
		await queryRunner.query(`CREATE INDEX "IDX_noctown_chat_log_recipient_recipient_receivedAt" ON "noctown_chat_log_recipient" ("recipientPlayerId", "receivedAt")`);

		// chatLogId インデックス（CASCADE削除のため）
		await queryRunner.query(`CREATE INDEX "IDX_noctown_chat_log_recipient_chatLogId" ON "noctown_chat_log_recipient" ("chatLogId")`);

		// 外部キー制約（noctown_chat_log への参照、CASCADE削除）
		await queryRunner.query(`
			ALTER TABLE "noctown_chat_log_recipient"
			ADD CONSTRAINT "FK_noctown_chat_log_recipient_chatLogId"
			FOREIGN KEY ("chatLogId") REFERENCES "noctown_chat_log"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);

		// 外部キー制約（noctown_player への参照、CASCADE削除）
		await queryRunner.query(`
			ALTER TABLE "noctown_chat_log_recipient"
			ADD CONSTRAINT "FK_noctown_chat_log_recipient_recipientPlayerId"
			FOREIGN KEY ("recipientPlayerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE ON UPDATE NO ACTION
		`);
	}

	async down(queryRunner) {
		// 外部キー制約削除
		await queryRunner.query(`ALTER TABLE "noctown_chat_log_recipient" DROP CONSTRAINT "FK_noctown_chat_log_recipient_recipientPlayerId"`);
		await queryRunner.query(`ALTER TABLE "noctown_chat_log_recipient" DROP CONSTRAINT "FK_noctown_chat_log_recipient_chatLogId"`);

		// インデックス削除
		await queryRunner.query(`DROP INDEX "IDX_noctown_chat_log_recipient_chatLogId"`);
		await queryRunner.query(`DROP INDEX "IDX_noctown_chat_log_recipient_recipient_receivedAt"`);

		// テーブル削除
		await queryRunner.query(`DROP TABLE "noctown_chat_log_recipient"`);
	}
}
