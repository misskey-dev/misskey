/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// T041-T045: トランザクションID管理（不正防止）
// 「交換OK」押下時にトランザクションIDを発行し、トレード実行時に両者のIDを検証

export class AddNoctownTradeTransactionId1766400000000 {
	name = 'AddNoctownTradeTransactionId1766400000000';

	async up(queryRunner) {
		// initiatorTransactionId カラム追加
		await queryRunner.query(`
			ALTER TABLE "noctown_trade"
			ADD COLUMN "initiatorTransactionId" varchar(128) NULL
		`);

		// targetTransactionId カラム追加
		await queryRunner.query(`
			ALTER TABLE "noctown_trade"
			ADD COLUMN "targetTransactionId" varchar(128) NULL
		`);

		// コメント追加
		await queryRunner.query(`COMMENT ON COLUMN "noctown_trade"."initiatorTransactionId" IS 'Initiator transaction ID hash (items + currency snapshot)'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_trade"."targetTransactionId" IS 'Target transaction ID hash (items + currency snapshot)'`);
	}

	async down(queryRunner) {
		// targetTransactionId カラム削除
		await queryRunner.query(`
			ALTER TABLE "noctown_trade"
			DROP COLUMN "targetTransactionId"
		`);

		// initiatorTransactionId カラム削除
		await queryRunner.query(`
			ALTER TABLE "noctown_trade"
			DROP COLUMN "initiatorTransactionId"
		`);
	}
}
