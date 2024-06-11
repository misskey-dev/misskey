/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class channelNotePining1680238118084 {
    name = 'channelNotePining1680238118084'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "pinnedNoteIds" character varying(128) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "pinnedNoteIds"`);
    }
}
