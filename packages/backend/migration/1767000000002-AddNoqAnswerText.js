/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * マイグレーション: noq_questionテーブルにanswerTextカラムを追加
 * 回答テキストを直接保存することで、回答ノート削除後も回答内容を保持
 */
export class AddNoqAnswerText1767000000002 {
	name = 'AddNoqAnswerText1767000000002';

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "noq_question" ADD "answerText" text`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."answerText" IS '回答テキスト（ノート削除時も保持）'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "noq_question" DROP COLUMN "answerText"`);
	}
}
