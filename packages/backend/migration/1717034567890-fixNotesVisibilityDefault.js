/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class fixNotesVisibilityDefault1717034567890 {
		constructor() {
				this.name = 'fixNotesVisibilityDefault1717034567890';
		}

		async up(queryRunner) {
				// デフォルト値を'private'に修正
				await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "notesVisibility" SET DEFAULT 'private'`);
		}

		async down(queryRunner) {
				// ロールバック時は'public'に戻す
				await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "notesVisibility" SET DEFAULT 'public'`);
		}
}
