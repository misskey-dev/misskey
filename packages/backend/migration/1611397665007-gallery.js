

export class gallery1611397665007 {
    constructor() {
        this.name = 'gallery1611397665007';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "gallery_post" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(256) NOT NULL, "description" character varying(2048), "userId" character varying(32) NOT NULL, "fileIds" character varying(32) array NOT NULL DEFAULT '{}'::varchar[], "isSensitive" boolean NOT NULL DEFAULT false, "likedCount" integer NOT NULL DEFAULT '0', "tags" character varying(128) array NOT NULL DEFAULT '{}'::varchar[], CONSTRAINT "PK_8e90d7b6015f2c4518881b14753" PRIMARY KEY ("id")); COMMENT ON COLUMN "gallery_post"."createdAt" IS 'The created date of the GalleryPost.'; COMMENT ON COLUMN "gallery_post"."updatedAt" IS 'The updated date of the GalleryPost.'; COMMENT ON COLUMN "gallery_post"."userId" IS 'The ID of author.'; COMMENT ON COLUMN "gallery_post"."isSensitive" IS 'Whether the post is sensitive.'`);
        await queryRunner.query(`CREATE INDEX "IDX_8f1a239bd077c8864a20c62c2c" ON "gallery_post" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_f631d37835adb04792e361807c" ON "gallery_post" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_985b836dddd8615e432d7043dd" ON "gallery_post" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_3ca50563facd913c425e7a89ee" ON "gallery_post" ("fileIds") `);
        await queryRunner.query(`CREATE INDEX "IDX_f2d744d9a14d0dfb8b96cb7fc5" ON "gallery_post" ("isSensitive") `);
        await queryRunner.query(`CREATE INDEX "IDX_1a165c68a49d08f11caffbd206" ON "gallery_post" ("likedCount") `);
        await queryRunner.query(`CREATE INDEX "IDX_05cca34b985d1b8edc1d1e28df" ON "gallery_post" ("tags") `);
        await queryRunner.query(`CREATE TABLE "gallery_like" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "postId" character varying(32) NOT NULL, CONSTRAINT "PK_853ab02be39b8de45cd720cc15f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8fd5215095473061855ceb948c" ON "gallery_like" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_df1b5f4099e99fb0bc5eae53b6" ON "gallery_like" ("userId", "postId") `);
        await queryRunner.query(`ALTER TABLE "gallery_post" ADD CONSTRAINT "FK_985b836dddd8615e432d7043ddb" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gallery_like" ADD CONSTRAINT "FK_8fd5215095473061855ceb948cf" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gallery_like" ADD CONSTRAINT "FK_b1cb568bfe569e47b7051699fc8" FOREIGN KEY ("postId") REFERENCES "gallery_post"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "gallery_like" DROP CONSTRAINT "FK_b1cb568bfe569e47b7051699fc8"`);
        await queryRunner.query(`ALTER TABLE "gallery_like" DROP CONSTRAINT "FK_8fd5215095473061855ceb948cf"`);
        await queryRunner.query(`ALTER TABLE "gallery_post" DROP CONSTRAINT "FK_985b836dddd8615e432d7043ddb"`);
        await queryRunner.query(`DROP INDEX "IDX_df1b5f4099e99fb0bc5eae53b6"`);
        await queryRunner.query(`DROP INDEX "IDX_8fd5215095473061855ceb948c"`);
        await queryRunner.query(`DROP TABLE "gallery_like"`);
        await queryRunner.query(`DROP INDEX "IDX_05cca34b985d1b8edc1d1e28df"`);
        await queryRunner.query(`DROP INDEX "IDX_1a165c68a49d08f11caffbd206"`);
        await queryRunner.query(`DROP INDEX "IDX_f2d744d9a14d0dfb8b96cb7fc5"`);
        await queryRunner.query(`DROP INDEX "IDX_3ca50563facd913c425e7a89ee"`);
        await queryRunner.query(`DROP INDEX "IDX_985b836dddd8615e432d7043dd"`);
        await queryRunner.query(`DROP INDEX "IDX_f631d37835adb04792e361807c"`);
        await queryRunner.query(`DROP INDEX "IDX_8f1a239bd077c8864a20c62c2c"`);
        await queryRunner.query(`DROP TABLE "gallery_post"`);
    }
}
