/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MfmType1736187385656e {
		name = 'MfmType1736187385656e'

		async up(queryRunner) {
				await queryRunner.query(`CREATE TYPE "note_mfmType_enum" AS ENUM('full', 'html')`);
				await queryRunner.query(`ALTER TABLE "note" ADD COLUMN "mfmType" "note_mfmType_enum" NOT NULL DEFAULT 'full'`);
		}

		async down(queryRunner) {
				await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "mfmType"`);
				await queryRunner.query(`DROP TYPE "note_mfmType_enum"`);
		}
}
