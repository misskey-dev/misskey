/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class perNoteReactionAcceptance1678164627293 {
    name = 'perNoteReactionAcceptance1678164627293'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "reactionAcceptance" character varying(64)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "reactionAcceptance"`);
    }
}
