/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class channelUnread1597459042300 {
    constructor() {
        this.name = 'channelUnread1597459042300';
    }
    async up(queryRunner) {
        await queryRunner.query(`TRUNCATE TABLE "note_unread"`, undefined);
        await queryRunner.query(`ALTER TABLE "channel_following" DROP COLUMN "readCursor"`);
        await queryRunner.query(`ALTER TABLE "note_unread" ADD "isMentioned" boolean NOT NULL`);
        await queryRunner.query(`ALTER TABLE "note_unread" ADD "noteChannelId" character varying(32)`);
        await queryRunner.query(`CREATE INDEX "IDX_25b1dd384bec391b07b74b861c" ON "note_unread" ("isMentioned") `);
        await queryRunner.query(`CREATE INDEX "IDX_89a29c9237b8c3b6b3cbb4cb30" ON "note_unread" ("isSpecified") `);
        await queryRunner.query(`CREATE INDEX "IDX_29e8c1d579af54d4232939f994" ON "note_unread" ("noteUserId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6a57f051d82c6d4036c141e107" ON "note_unread" ("noteChannelId") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_6a57f051d82c6d4036c141e107"`);
        await queryRunner.query(`DROP INDEX "IDX_29e8c1d579af54d4232939f994"`);
        await queryRunner.query(`DROP INDEX "IDX_89a29c9237b8c3b6b3cbb4cb30"`);
        await queryRunner.query(`DROP INDEX "IDX_25b1dd384bec391b07b74b861c"`);
        await queryRunner.query(`ALTER TABLE "note_unread" DROP COLUMN "noteChannelId"`);
        await queryRunner.query(`ALTER TABLE "note_unread" DROP COLUMN "isMentioned"`);
        await queryRunner.query(`ALTER TABLE "channel_following" ADD "readCursor" TIMESTAMP WITH TIME ZONE NOT NULL`);
    }
}
