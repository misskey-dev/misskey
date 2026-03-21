/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

// 仕様: page テーブルの visibility enum に 'url-only' を追加
// ページ表示権限機能で URL限定公開 を実現するための値

export class PageVisibilityUrlOnly1767100000000 {
	name = 'PageVisibilityUrlOnly1767100000000'

	async up(queryRunner) {
		await queryRunner.query(`ALTER TYPE "page_visibility_enum" ADD VALUE IF NOT EXISTS 'url-only'`);
	}

	async down(queryRunner) {
		// PostgreSQL の enum から値を削除するには型の再作成が必要
		// url-only を使用しているレコードを先に public に戻す
		await queryRunner.query(`UPDATE "page" SET "visibility" = 'public' WHERE "visibility" = 'url-only'`);

		await queryRunner.query(`ALTER TYPE "page_visibility_enum" RENAME TO "page_visibility_enum_old"`);
		await queryRunner.query(`CREATE TYPE "page_visibility_enum" AS ENUM('public', 'followers', 'specified')`);
		await queryRunner.query(`ALTER TABLE "page" ALTER COLUMN "visibility" TYPE "page_visibility_enum" USING "visibility"::text::"page_visibility_enum"`);
		await queryRunner.query(`DROP TYPE "page_visibility_enum_old"`);
	}
}
