export class EmojiDraft1697813507149 {
    name = 'EmojiDraft1697813507149'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "emoji_draft" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(128) NOT NULL, "category" character varying(128), "originalUrl" character varying(512) NOT NULL, "publicUrl" character varying(512) NOT NULL DEFAULT '', "type" character varying(64), "aliases" character varying(128) array NOT NULL DEFAULT '{}', "license" character varying(1024), "fileId" character varying(1024) NOT NULL, "localOnly" boolean NOT NULL DEFAULT false, "isSensitive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_6c7c36f693e1cb8ba1343e3336f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_aw4zqjtyvxcsh797kbpzxmca6x" ON "emoji_draft" ("name") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_aw4zqjtyvxcsh797kbpzxmca6x"`);
        await queryRunner.query(`DROP TABLE "emoji_draft"`);
    }
}
