/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class WorldRoom1778744540138 {
    name = 'WorldRoom1778744540138'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "world_room" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(256) NOT NULL, "description" character varying(1024) NOT NULL, "userId" character varying(32) NOT NULL, "likedCount" integer NOT NULL DEFAULT '0', "visibility" character varying(128) NOT NULL DEFAULT 'public', "def" jsonb NOT NULL DEFAULT '{}', CONSTRAINT "PK_40cfacaf35b0b54bb2281c89767" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_88289375952050da4a7752a366" ON "world_room" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_f803a5efb4125c5fd8a414285e" ON "world_room" ("userId") `);
        await queryRunner.query(`ALTER TABLE "world_room" ADD CONSTRAINT "FK_f803a5efb4125c5fd8a414285ed" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "world_room" DROP CONSTRAINT "FK_f803a5efb4125c5fd8a414285ed"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f803a5efb4125c5fd8a414285e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_88289375952050da4a7752a366"`);
        await queryRunner.query(`DROP TABLE "world_room"`);
    }
}
