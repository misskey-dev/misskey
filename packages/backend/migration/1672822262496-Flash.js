/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Flash1672822262496 {
    name = 'Flash1672822262496'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "flash" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(256) NOT NULL, "summary" character varying(1024) NOT NULL, "userId" character varying(32) NOT NULL, "script" character varying(16384) NOT NULL, "permissions" character varying(256) array NOT NULL DEFAULT '{}', "likedCount" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_0c01a2c1c5f2266942dd1b3fdbc" PRIMARY KEY ("id")); COMMENT ON COLUMN "flash"."createdAt" IS 'The created date of the Flash.'; COMMENT ON COLUMN "flash"."updatedAt" IS 'The updated date of the Flash.'; COMMENT ON COLUMN "flash"."userId" IS 'The ID of author.'`);
        await queryRunner.query(`CREATE INDEX "IDX_149d2e44785707548c82999b01" ON "flash" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_3aa8ea9a8f15214ad91638c0a7" ON "flash" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_9b88250fc2fd009b8f1b5623ed" ON "flash" ("userId") `);
        await queryRunner.query(`CREATE TABLE "flash_like" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "flashId" character varying(32) NOT NULL, CONSTRAINT "PK_d110109ee310588d63d6183b233" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_60c4af1c19a7a75f1592f93b28" ON "flash_like" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_cfbfeeccb0cbedcd660b17eb07" ON "flash_like" ("userId", "flashId") `);
        await queryRunner.query(`ALTER TABLE "flash" ADD CONSTRAINT "FK_9b88250fc2fd009b8f1b5623ed5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flash_like" ADD CONSTRAINT "FK_60c4af1c19a7a75f1592f93b287" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "flash_like" ADD CONSTRAINT "FK_6c16fe0e93b7a1951eca624b76a" FOREIGN KEY ("flashId") REFERENCES "flash"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "flash_like" DROP CONSTRAINT "FK_6c16fe0e93b7a1951eca624b76a"`);
        await queryRunner.query(`ALTER TABLE "flash_like" DROP CONSTRAINT "FK_60c4af1c19a7a75f1592f93b287"`);
        await queryRunner.query(`ALTER TABLE "flash" DROP CONSTRAINT "FK_9b88250fc2fd009b8f1b5623ed5"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_cfbfeeccb0cbedcd660b17eb07"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_60c4af1c19a7a75f1592f93b28"`);
        await queryRunner.query(`DROP TABLE "flash_like"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9b88250fc2fd009b8f1b5623ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3aa8ea9a8f15214ad91638c0a7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_149d2e44785707548c82999b01"`);
        await queryRunner.query(`DROP TABLE "flash"`);
    }
}
