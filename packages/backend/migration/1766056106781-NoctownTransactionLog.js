/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: FR-034 アイテムトランザクションログシステム
// noctown_transaction_log テーブルを作成し、既存テーブルにversionカラムを追加

export class NoctownTransactionLog1766056106781 {
	name = 'NoctownTransactionLog1766056106781'

	async up(queryRunner) {
		// 1. noctown_transaction_log テーブル作成
		await queryRunner.query(`
			CREATE TABLE "noctown_transaction_log" (
				"id" character varying(32) NOT NULL,
				"playerId" character varying(32) NOT NULL,
				"type" character varying(32) NOT NULL,
				"targetId" character varying(32),
				"targetPlayerId" character varying(32),
				"amount" integer,
				"beforeState" jsonb,
				"afterState" jsonb,
				"metadata" jsonb,
				"isValid" boolean NOT NULL DEFAULT true,
				"invalidReason" character varying(256),
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_noctown_transaction_log" PRIMARY KEY ("id")
			)
		`);

		// 2. インデックス作成
		await queryRunner.query(`CREATE INDEX "IDX_noctown_transaction_log_playerId_createdAt" ON "noctown_transaction_log" ("playerId", "createdAt")`);
		await queryRunner.query(`CREATE INDEX "IDX_noctown_transaction_log_targetId_type" ON "noctown_transaction_log" ("targetId", "type")`);
		await queryRunner.query(`CREATE INDEX "IDX_noctown_transaction_log_isValid" ON "noctown_transaction_log" ("isValid")`);
		await queryRunner.query(`CREATE INDEX "IDX_noctown_transaction_log_playerId" ON "noctown_transaction_log" ("playerId")`);

		// 3. 外部キー制約
		await queryRunner.query(`ALTER TABLE "noctown_transaction_log" ADD CONSTRAINT "FK_noctown_transaction_log_playerId" FOREIGN KEY ("playerId") REFERENCES "noctown_player"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "noctown_transaction_log" ADD CONSTRAINT "FK_noctown_transaction_log_targetPlayerId" FOREIGN KEY ("targetPlayerId") REFERENCES "noctown_player"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

		// 4. カラムコメント
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."playerId" IS 'Player who executed the operation'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."type" IS 'Transaction type'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."targetId" IS 'Target ID (item/pet/trade)'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."targetPlayerId" IS 'Target player ID (for trades)'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."amount" IS 'Amount/quantity'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."beforeState" IS 'State before operation'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."afterState" IS 'State after operation'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."metadata" IS 'Additional metadata (position, etc.)'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."isValid" IS 'Whether operation is valid'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."invalidReason" IS 'Reason if operation is invalid'`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_transaction_log"."createdAt" IS 'Created timestamp'`);

		// 5. 楽観的ロック用のversionカラムを既存テーブルに追加
		// noctown_player_item (インベントリアイテム)
		await queryRunner.query(`ALTER TABLE "noctown_player_item" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_player_item"."version" IS 'Optimistic lock version'`);

		// noctown_player (ウォレットのバージョン)
		await queryRunner.query(`ALTER TABLE "noctown_player" ADD COLUMN IF NOT EXISTS "walletVersion" integer NOT NULL DEFAULT 1`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_player"."walletVersion" IS 'Optimistic lock version for wallet operations'`);

		// noctown_dropped_item (ドロップアイテム)
		await queryRunner.query(`ALTER TABLE "noctown_dropped_item" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_dropped_item"."version" IS 'Optimistic lock version'`);

		// noctown_placed_item (設置アイテム)
		await queryRunner.query(`ALTER TABLE "noctown_placed_item" ADD COLUMN IF NOT EXISTS "version" integer NOT NULL DEFAULT 1`);
		await queryRunner.query(`COMMENT ON COLUMN "noctown_placed_item"."version" IS 'Optimistic lock version'`);
	}

	async down(queryRunner) {
		// versionカラムを削除
		await queryRunner.query(`ALTER TABLE "noctown_placed_item" DROP COLUMN IF EXISTS "version"`);
		await queryRunner.query(`ALTER TABLE "noctown_dropped_item" DROP COLUMN IF EXISTS "version"`);
		await queryRunner.query(`ALTER TABLE "noctown_player" DROP COLUMN IF EXISTS "walletVersion"`);
		await queryRunner.query(`ALTER TABLE "noctown_player_item" DROP COLUMN IF EXISTS "version"`);

		// 外部キー制約を削除
		await queryRunner.query(`ALTER TABLE "noctown_transaction_log" DROP CONSTRAINT IF EXISTS "FK_noctown_transaction_log_targetPlayerId"`);
		await queryRunner.query(`ALTER TABLE "noctown_transaction_log" DROP CONSTRAINT IF EXISTS "FK_noctown_transaction_log_playerId"`);

		// インデックスを削除
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_transaction_log_playerId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_transaction_log_isValid"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_transaction_log_targetId_type"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noctown_transaction_log_playerId_createdAt"`);

		// テーブルを削除
		await queryRunner.query(`DROP TABLE IF EXISTS "noctown_transaction_log"`);
	}
}
