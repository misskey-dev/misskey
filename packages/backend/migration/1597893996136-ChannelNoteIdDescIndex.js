/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelNoteIdDescIndex1597893996136 {
    constructor() {
        this.name = 'ChannelNoteIdDescIndex1597893996136';
    }
    async up(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_f22169eb10657bded6d875ac8f"`);
        await queryRunner.query(`CREATE INDEX "IDX_note_on_channelId_and_id_desc" ON "note" ("channelId", "id" desc)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_note_on_channelId_and_id_desc"`);
        await queryRunner.query(`CREATE INDEX "IDX_f22169eb10657bded6d875ac8f" ON "note" ("channelId") `);
    }
}
