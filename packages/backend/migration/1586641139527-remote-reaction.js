/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class remoteReaction1586641139527 {
    constructor() {
        this.name = 'remoteReaction1586641139527';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(260)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_reaction" ALTER COLUMN "reaction" TYPE character varying(130)`, undefined);
    }
}
