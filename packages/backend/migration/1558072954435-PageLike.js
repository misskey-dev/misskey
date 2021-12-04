"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PageLike1558072954435 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "page_like" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "pageId" character varying(32) NOT NULL, CONSTRAINT "PK_813f034843af992d3ae0f43c64c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0e61efab7f88dbb79c9166dbb4" ON "page_like" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4ce6fb9c70529b4c8ac46c9bfa" ON "page_like" ("userId", "pageId") `);
        await queryRunner.query(`ALTER TABLE "page" ADD "likedCount" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "page_like" ADD CONSTRAINT "FK_0e61efab7f88dbb79c9166dbb48" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "page_like" ADD CONSTRAINT "FK_cf8782626dced3176038176a847" FOREIGN KEY ("pageId") REFERENCES "page"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "page_like" DROP CONSTRAINT "FK_cf8782626dced3176038176a847"`);
        await queryRunner.query(`ALTER TABLE "page_like" DROP CONSTRAINT "FK_0e61efab7f88dbb79c9166dbb48"`);
        await queryRunner.query(`ALTER TABLE "page" DROP COLUMN "likedCount"`);
        await queryRunner.query(`DROP INDEX "IDX_4ce6fb9c70529b4c8ac46c9bfa"`);
        await queryRunner.query(`DROP INDEX "IDX_0e61efab7f88dbb79c9166dbb4"`);
        await queryRunner.query(`DROP TABLE "page_like"`);
    }
}
exports.PageLike1558072954435 = PageLike1558072954435;
