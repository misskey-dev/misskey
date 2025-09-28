/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoteScheduled1759048540292 {
    name = 'NoteScheduled1759048540292'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "scheduled" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "scheduled"`);
    }
}
