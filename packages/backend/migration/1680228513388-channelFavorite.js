/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class channelFavorite1680228513388 {
    name = 'channelFavorite1680228513388'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "channel_favorite" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "channelId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_59bddfd54d48689a298d41af00c" PRIMARY KEY ("id")); COMMENT ON COLUMN "channel_favorite"."createdAt" IS 'The created date of the ChannelFavorite.'`);
        await queryRunner.query(`CREATE INDEX "IDX_735a5544f9249d412255f47f95" ON "channel_favorite" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_d3ca0db011b75ac2a940a2337d" ON "channel_favorite" ("channelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8302bd27226605ece14842fb25" ON "channel_favorite" ("userId") `);
        await queryRunner.query(`ALTER TABLE "channel_favorite" ADD CONSTRAINT "FK_d3ca0db011b75ac2a940a2337d2" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_favorite" ADD CONSTRAINT "FK_8302bd27226605ece14842fb25a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_favorite" DROP CONSTRAINT "FK_8302bd27226605ece14842fb25a"`);
        await queryRunner.query(`ALTER TABLE "channel_favorite" DROP CONSTRAINT "FK_d3ca0db011b75ac2a940a2337d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8302bd27226605ece14842fb25"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d3ca0db011b75ac2a940a2337d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_735a5544f9249d412255f47f95"`);
        await queryRunner.query(`DROP TABLE "channel_favorite"`);
    }
}
