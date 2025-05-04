/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ExcludeNotesInSensitiveChannel1744075766000 {
		name = 'ExcludeNotesInSensitiveChannel1744075766000'

		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "antenna" RENAME COLUMN "hideNotesInSensitiveChannel" TO "excludeNotesInSensitiveChannel"`);
		}

		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "antenna" RENAME COLUMN "excludeNotesInSensitiveChannel" TO "hideNotesInSensitiveChannel"`);
		}
}
