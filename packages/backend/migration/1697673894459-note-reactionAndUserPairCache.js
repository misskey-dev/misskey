/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */


export class NoteReactionAndUserPairCache1697673894459 {
    name = 'NoteReactionAndUserPairCache1697673894459'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "reactionAndUserPairCache" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "reactionAndUserPairCache"`);
    }
}
