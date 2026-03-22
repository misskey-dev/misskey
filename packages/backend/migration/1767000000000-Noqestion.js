/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: Noqestion - 匿名質問箱機能
// noq_user_setting, noq_question, noq_muted_user, noq_reported_question テーブルを作成

export class Noqestion1767000000000 {
	name = 'Noqestion1767000000000'

	async up(queryRunner) {
		// 1. noq_user_setting テーブル作成
		await queryRunner.query(`
			CREATE TABLE "noq_user_setting" (
				"userId" character varying(32) NOT NULL,
				"isEnabled" boolean NOT NULL DEFAULT false,
				"requireUsernameDisclosure" boolean NOT NULL DEFAULT false,
				"hideSensitiveQuestions" boolean NOT NULL DEFAULT false,
				"notice" text,
				"ngWordList" character varying[] NOT NULL DEFAULT '{}',
				"e2ePublicKey" character varying(128),
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				"updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_noq_user_setting" PRIMARY KEY ("userId")
			)
		`);

		// noq_user_setting 外部キー
		await queryRunner.query(`ALTER TABLE "noq_user_setting" ADD CONSTRAINT "FK_noq_user_setting_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		// noq_user_setting コメント
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."userId" IS 'ユーザーID'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."isEnabled" IS '質問箱ON/OFF'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."requireUsernameDisclosure" IS 'username開示必須フラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."hideSensitiveQuestions" IS 'センシティブワード非表示フラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."notice" IS '質問前の注意事項'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."ngWordList" IS '個人NGワードリスト'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_user_setting"."e2ePublicKey" IS 'E2E暗号化公開鍵（ECDH P-256、Base64 URL-safe）'`);

		// 2. noq_question テーブル作成
		// senderId は nullable（ユーザー削除時に SET NULL で対応）
		await queryRunner.query(`
			CREATE TABLE "noq_question" (
				"id" character varying(32) NOT NULL,
				"senderId" character varying(32),
				"recipientId" character varying(32) NOT NULL,
				"text" text NOT NULL,
				"imageUrl" character varying(512),
				"isUsernameDisclosed" boolean NOT NULL DEFAULT false,
				"isNoReplyRequested" boolean NOT NULL DEFAULT false,
				"cardDesign" character varying(32) NOT NULL DEFAULT 'default',
				"status" character varying(16) NOT NULL DEFAULT 'pending',
				"isReported" boolean NOT NULL DEFAULT false,
				"isDisclosedByMod" boolean NOT NULL DEFAULT false,
				"isE2EEncrypted" boolean NOT NULL DEFAULT false,
				"encryptedAnswer" text,
				"answerNoteId" character varying(32),
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_noq_question" PRIMARY KEY ("id")
			)
		`);

		// noq_question インデックス
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_question_senderId" ON "noq_question" ("senderId")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_question_recipientId_status" ON "noq_question" ("recipientId", "status")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_question_createdAt" ON "noq_question" ("createdAt")`);

		// noq_question 外部キー
		await queryRunner.query(`ALTER TABLE "noq_question" ADD CONSTRAINT "FK_noq_question_senderId" FOREIGN KEY ("senderId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "noq_question" ADD CONSTRAINT "FK_noq_question_recipientId" FOREIGN KEY ("recipientId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "noq_question" ADD CONSTRAINT "FK_noq_question_answerNoteId" FOREIGN KEY ("answerNoteId") REFERENCES "note"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);

		// noq_question コメント
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."senderId" IS '質問者ID（ユーザー削除時はNULL）'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."recipientId" IS '回答者ID'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."text" IS '質問本文'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."imageUrl" IS '添付画像URL'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."isUsernameDisclosed" IS 'username開示フラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."isNoReplyRequested" IS '回答不要フラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."cardDesign" IS 'メッセージカードデザイン'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."status" IS '回答ステータス (pending/answered/deleted)'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."isReported" IS '通報済みフラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."isDisclosedByMod" IS 'モデレーターによる開示済みフラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."isE2EEncrypted" IS 'E2E暗号化フラグ'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."encryptedAnswer" IS '暗号化された回答文'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."answerNoteId" IS '回答ノートID'`);

		// 3. noq_muted_user テーブル作成
		await queryRunner.query(`
			CREATE TABLE "noq_muted_user" (
				"id" character varying(32) NOT NULL,
				"userId" character varying(32) NOT NULL,
				"mutedUserId" character varying(32) NOT NULL,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_noq_muted_user" PRIMARY KEY ("id")
			)
		`);

		// noq_muted_user インデックス
		await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_noq_muted_user_userId_mutedUserId" ON "noq_muted_user" ("userId", "mutedUserId")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_muted_user_userId" ON "noq_muted_user" ("userId")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_muted_user_mutedUserId" ON "noq_muted_user" ("mutedUserId")`);

		// noq_muted_user 外部キー
		await queryRunner.query(`ALTER TABLE "noq_muted_user" ADD CONSTRAINT "FK_noq_muted_user_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "noq_muted_user" ADD CONSTRAINT "FK_noq_muted_user_mutedUserId" FOREIGN KEY ("mutedUserId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		// noq_muted_user コメント
		await queryRunner.query(`COMMENT ON COLUMN "noq_muted_user"."userId" IS '設定者ID'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_muted_user"."mutedUserId" IS 'ミュート対象ユーザーID'`);

		// 4. noq_reported_question テーブル作成
		await queryRunner.query(`
			CREATE TABLE "noq_reported_question" (
				"id" character varying(32) NOT NULL,
				"questionId" character varying(32) NOT NULL,
				"reportId" character varying(32) NOT NULL,
				"createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
				CONSTRAINT "PK_noq_reported_question" PRIMARY KEY ("id")
			)
		`);

		// noq_reported_question インデックス
		await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_noq_reported_question_questionId_reportId" ON "noq_reported_question" ("questionId", "reportId")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_reported_question_questionId" ON "noq_reported_question" ("questionId")`);
		await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_noq_reported_question_reportId" ON "noq_reported_question" ("reportId")`);

		// noq_reported_question 外部キー
		await queryRunner.query(`ALTER TABLE "noq_reported_question" ADD CONSTRAINT "FK_noq_reported_question_questionId" FOREIGN KEY ("questionId") REFERENCES "noq_question"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "noq_reported_question" ADD CONSTRAINT "FK_noq_reported_question_reportId" FOREIGN KEY ("reportId") REFERENCES "abuse_user_report"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

		// noq_reported_question コメント
		await queryRunner.query(`COMMENT ON COLUMN "noq_reported_question"."questionId" IS '対象質問ID'`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_reported_question"."reportId" IS 'Misskey通報ID'`);
	}

	async down(queryRunner) {
		// noq_reported_question 削除
		await queryRunner.query(`ALTER TABLE "noq_reported_question" DROP CONSTRAINT IF EXISTS "FK_noq_reported_question_reportId"`);
		await queryRunner.query(`ALTER TABLE "noq_reported_question" DROP CONSTRAINT IF EXISTS "FK_noq_reported_question_questionId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_reported_question_reportId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_reported_question_questionId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_reported_question_questionId_reportId"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "noq_reported_question"`);

		// noq_muted_user 削除
		await queryRunner.query(`ALTER TABLE "noq_muted_user" DROP CONSTRAINT IF EXISTS "FK_noq_muted_user_mutedUserId"`);
		await queryRunner.query(`ALTER TABLE "noq_muted_user" DROP CONSTRAINT IF EXISTS "FK_noq_muted_user_userId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_muted_user_mutedUserId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_muted_user_userId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_muted_user_userId_mutedUserId"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "noq_muted_user"`);

		// noq_question 削除
		await queryRunner.query(`ALTER TABLE "noq_question" DROP CONSTRAINT IF EXISTS "FK_noq_question_answerNoteId"`);
		await queryRunner.query(`ALTER TABLE "noq_question" DROP CONSTRAINT IF EXISTS "FK_noq_question_recipientId"`);
		await queryRunner.query(`ALTER TABLE "noq_question" DROP CONSTRAINT IF EXISTS "FK_noq_question_senderId"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_question_createdAt"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_question_recipientId_status"`);
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_noq_question_senderId"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "noq_question"`);

		// noq_user_setting 削除
		await queryRunner.query(`ALTER TABLE "noq_user_setting" DROP CONSTRAINT IF EXISTS "FK_noq_user_setting_userId"`);
		await queryRunner.query(`DROP TABLE IF EXISTS "noq_user_setting"`);
	}
}
