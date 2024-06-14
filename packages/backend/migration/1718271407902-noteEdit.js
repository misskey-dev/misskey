/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NoteEdit1718271407902 {
    name = 'NoteEdit1718271407902'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."updatedAt" IS 'The updated date of the Note.'`);
        await queryRunner.query(`CREATE TABLE "note_history" ("id" character varying(32) NOT NULL, "targetId" character varying(32) NOT NULL, "text" text, "name" character varying(256), "cw" character varying(512), "fileIds" character varying(32) array NOT NULL DEFAULT '{}'::varchar[], "attachedFileTypes" character varying(256) array NOT NULL DEFAULT '{}'::varchar[], "mentions" character varying(32) array NOT NULL DEFAULT '{}'::varchar[], "mentionedRemoteUsers" text NOT NULL DEFAULT '[]', "emojis" character varying(128) array NOT NULL DEFAULT '{}'::varchar[], "tags" character varying(128) array NOT NULL DEFAULT '{}'::varchar[], "hasPoll" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_96d34172acfba2f6b1bc2ed43058" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f23ad074619d2afe0f69da9a95" ON "note_history" ("targetId") `);
        await queryRunner.query(`ALTER TABLE "note_history" ADD CONSTRAINT "FK_aacf2074601e204e0f69da9a954" FOREIGN KEY ("targetId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		}

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "note"."updatedAt" IS 'The updated date of the Note.'`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "note_history" DROP CONSTRAINT "FK_aacf2074601e204e0f69da9a954"`);
        await queryRunner.query(`DROP INDEX "IDX_f23ad074619d2afe0f69da9a95"`);
        await queryRunner.query(`DROP TABLE "note_history"`);
    }
}
