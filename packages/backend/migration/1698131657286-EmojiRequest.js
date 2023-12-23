export class EmojiRequest1698131657286 {
    name = 'EmojiRequest1698131657286'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "emoji_request" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE, "name" character varying(128) NOT NULL, "category" character varying(128), "originalUrl" character varying(512) NOT NULL, "publicUrl" character varying(512) NOT NULL DEFAULT '', "type" character varying(64), "aliases" character varying(128) array NOT NULL DEFAULT '{}', "license" character varying(1024), "fileId" character varying(1024) NOT NULL, "localOnly" boolean NOT NULL DEFAULT false, "isSensitive" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3c74521e048dc744f0c7eb65f4a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_ea1d771e867e9843300f09d02c" ON "emoji_request" ("name") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_ea1d771e867e9843300f09d02c"`);
        await queryRunner.query(`DROP TABLE "emoji_request"`);
    }
}
