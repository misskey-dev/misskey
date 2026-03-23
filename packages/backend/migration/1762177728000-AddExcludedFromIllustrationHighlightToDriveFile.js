/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddExcludedFromIllustrationHighlightToDriveFile1762177728000 {
    name = 'AddExcludedFromIllustrationHighlightToDriveFile1762177728000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "drive_file" ADD "excludedFromIllustrationHighlight" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_drive_file_excludedFromIllustrationHighlight" ON "drive_file" ("excludedFromIllustrationHighlight")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_drive_file_excludedFromIllustrationHighlight"`);
        await queryRunner.query(`ALTER TABLE "drive_file" DROP COLUMN "excludedFromIllustrationHighlight"`);
    }

}
