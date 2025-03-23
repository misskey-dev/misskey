/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoteMuting1739882320354 {
	name = 'NoteMuting1739882320354'

	async up(queryRunner) {
		await queryRunner.query(`
			CREATE TABLE "note_muting" (
				"id" varchar(32) NOT NULL,
				"userId" varchar(32) NOT NULL,
				"noteId" varchar(32) NOT NULL,
				"expiresAt" TIMESTAMP WITH TIME ZONE,
				CONSTRAINT "PK_note_muting_id" PRIMARY KEY ("id"),
				CONSTRAINT "FK_note_muting_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION,
				CONSTRAINT "FK_note_muting_noteId" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION
			);
			CREATE INDEX "IDX_note_muting_userId" ON "note_muting" ("userId");
			CREATE INDEX "IDX_note_muting_noteId" ON "note_muting" ("noteId");
			CREATE INDEX "IDX_note_muting_expiresAt" ON "note_muting" ("expiresAt");
			CREATE UNIQUE INDEX "IDX_note_muting_userId_noteId_unique" ON note_muting ("userId", "noteId");
		`);
	}

	async down(queryRunner) {
		await queryRunner.query(`
			DROP INDEX "IDX_note_muting_userId_noteId_unique";
			DROP INDEX "IDX_note_muting_expiresAt";
			DROP INDEX "IDX_note_muting_noteId";
			DROP INDEX "IDX_note_muting_userId";
			DROP TABLE "note_muting";
		`);
	}
}
