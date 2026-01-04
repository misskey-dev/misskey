/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: noq_question テーブルに answeredAt カラムを追加

export class AddAnsweredAt1767000000002 {
	name = 'AddAnsweredAt1767000000002'

	async up(queryRunner) {
		// answeredAt カラムを追加
		await queryRunner.query(`ALTER TABLE "noq_question" ADD "answeredAt" TIMESTAMP WITH TIME ZONE`);
		await queryRunner.query(`COMMENT ON COLUMN "noq_question"."answeredAt" IS '回答日時'`);
	}

	async down(queryRunner) {
		// answeredAt カラムを削除
		await queryRunner.query(`ALTER TABLE "noq_question" DROP COLUMN "answeredAt"`);
	}
}
