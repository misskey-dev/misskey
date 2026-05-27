/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class WorldAvatar1779921322355 {
    name = 'WorldAvatar1779921322355'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "world_avatar" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(256) NOT NULL, "userId" character varying(32) NOT NULL, "def" jsonb NOT NULL DEFAULT '{}', "active" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_e7a27262285cc2c27114871f866" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_0f1d0bdfaca455cc2f13defabe" ON "world_avatar" ("updatedAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_4eba43c8e2540a92e99dd7f5a9" ON "world_avatar" ("userId") `);
        await queryRunner.query(`ALTER TABLE "world_room" ADD "accessCount" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "world_avatar" ADD CONSTRAINT "FK_4eba43c8e2540a92e99dd7f5a9a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "world_avatar" DROP CONSTRAINT "FK_4eba43c8e2540a92e99dd7f5a9a"`);
        await queryRunner.query(`ALTER TABLE "world_room" DROP COLUMN "accessCount"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4eba43c8e2540a92e99dd7f5a9"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_0f1d0bdfaca455cc2f13defabe"`);
        await queryRunner.query(`DROP TABLE "world_avatar"`);
    }
}
