/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelIdDenormalizedForMiPoll1716129964060 {
    name = 'ChannelIdDenormalizedForMiPoll1716129964060'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "poll" ADD "channelId" character varying(32)`);
        await queryRunner.query(`COMMENT ON COLUMN "poll"."channelId" IS '[Denormalized]'`);
        await queryRunner.query(`CREATE INDEX "IDX_c1240fcc9675946ea5d6c2860e" ON "poll" ("channelId") `);
        await queryRunner.query(`UPDATE "poll" SET "channelId" = "note"."channelId" FROM "note" WHERE "poll"."noteId" = "note"."id"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_c1240fcc9675946ea5d6c2860e"`);
        await queryRunner.query(`COMMENT ON COLUMN "poll"."channelId" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "poll" DROP COLUMN "channelId"`);
    }
}
