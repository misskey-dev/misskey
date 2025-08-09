/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoActionOnDraftRelation1752502434151 {
    name = 'NoActionOnDraftRelation1752502434151'

    async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_CHANNEL_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_USER_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_RENOTE_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_NOTE_DRAFT_REPLY_ID"`);
			await queryRunner.query(`ALTER TABLE "note_draft" ADD CONSTRAINT "FK_e4983f28b4b18b03491536052f5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "note_draft" DROP CONSTRAINT "FK_e4983f28b4b18b03491536052f5"`);
			await queryRunner.query(`ALTER TABLE "note_draft" ADD CONSTRAINT "FK_NOTE_DRAFT_REPLY_ID" FOREIGN KEY ("replyId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
			await queryRunner.query(`ALTER TABLE "note_draft" ADD CONSTRAINT "FK_NOTE_DRAFT_RENOTE_ID" FOREIGN KEY ("renoteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
			await queryRunner.query(`ALTER TABLE "note_draft" ADD CONSTRAINT "FK_NOTE_DRAFT_USER_ID" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
			await queryRunner.query(`ALTER TABLE "note_draft" ADD CONSTRAINT "FK_NOTE_DRAFT_CHANNEL_ID" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
}
