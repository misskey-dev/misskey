/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: noteテーブルにisScheduledPostカラムを追加
// 予約投稿から作成されたノートを視覚的に区別するためのフラグ

export class AddIsScheduledPostToNote1769200000000 {
	name = 'AddIsScheduledPostToNote1769200000000'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "isScheduledPost" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "note"."isScheduledPost" IS '予約投稿フラグ'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "isScheduledPost"`);
	}
}
