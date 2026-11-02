/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NonCascadingPageEyeCatching1756062689648 {
    name = 'NonCascadingPageEyeCatching1756062689648'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP CONSTRAINT "FK_a9ca79ad939bf06066b81c9d3aa"`);
        await queryRunner.query(`ALTER TABLE "page" ADD CONSTRAINT "FK_a9ca79ad939bf06066b81c9d3aa" FOREIGN KEY ("eyeCatchingImageId") REFERENCES "drive_file"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page" DROP CONSTRAINT "FK_a9ca79ad939bf06066b81c9d3aa"`);
        await queryRunner.query(`ALTER TABLE "page" ADD CONSTRAINT "FK_a9ca79ad939bf06066b81c9d3aa" FOREIGN KEY ("eyeCatchingImageId") REFERENCES "drive_file"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
