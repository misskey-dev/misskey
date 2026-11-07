/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class v121579267006611 {
    constructor() {
        this.name = 'v121579267006611';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "announcement" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "text" character varying(8192) NOT NULL, "title" character varying(256) NOT NULL, "imageUrl" character varying(1024), CONSTRAINT "PK_e0ef0550174fd1099a308fd18a0" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_118ec703e596086fc4515acb39" ON "announcement" ("createdAt") `, undefined);
        await queryRunner.query(`CREATE TABLE "announcement_read" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "announcementId" character varying(32) NOT NULL, CONSTRAINT "PK_4b90ad1f42681d97b2683890c5e" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_8288151386172b8109f7239ab2" ON "announcement_read" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_603a7b1e7aa0533c6c88e9bfaf" ON "announcement_read" ("announcementId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_924fa71815cfa3941d003702a0" ON "announcement_read" ("userId", "announcementId") `, undefined);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isVerified"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "announcements"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableEmojiReaction"`, undefined);
        await queryRunner.query(`ALTER TABLE "announcement_read" ADD CONSTRAINT "FK_8288151386172b8109f7239ab28" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "announcement_read" ADD CONSTRAINT "FK_603a7b1e7aa0533c6c88e9bfafe" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement_read" DROP CONSTRAINT "FK_603a7b1e7aa0533c6c88e9bfafe"`, undefined);
        await queryRunner.query(`ALTER TABLE "announcement_read" DROP CONSTRAINT "FK_8288151386172b8109f7239ab28"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableEmojiReaction" boolean NOT NULL DEFAULT true`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "announcements" jsonb NOT NULL DEFAULT '[]'`, undefined);
        await queryRunner.query(`ALTER TABLE "user" ADD "isVerified" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_924fa71815cfa3941d003702a0"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_603a7b1e7aa0533c6c88e9bfaf"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_8288151386172b8109f7239ab2"`, undefined);
        await queryRunner.query(`DROP TABLE "announcement_read"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_118ec703e596086fc4515acb39"`, undefined);
        await queryRunner.query(`DROP TABLE "announcement"`, undefined);
    }
}
