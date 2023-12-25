/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class emojiUrl1642611822809 {
		name = 'emojiUrl1642611822809'

		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "emoji" RENAME COLUMN "url" TO "originalUrl"`);
			await queryRunner.query(`ALTER TABLE "emoji" ADD "publicUrl" character varying(512) NOT NULL DEFAULT ''`);
		}

		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "publicUrl"`);
			await queryRunner.query(`ALTER TABLE "emoji" RENAME COLUMN "originalUrl" TO "url"`);
		}
}
