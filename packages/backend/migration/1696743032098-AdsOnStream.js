/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AdsOnStream1696743032098 {
    name = 'AdsOnStream1696743032098'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "notesPerOneAd" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "notesPerOneAd"`);
    }
}
