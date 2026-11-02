/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddChannelMuting1761569941833 {
    name = 'AddChannelMuting1761569941833'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "channel_muting" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "channelId" character varying(32) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE, CONSTRAINT "PK_aec842e98f332ebd8e12f85bad6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_34415e3062ae7a94617496e81c" ON "channel_muting" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_4d534d7177fc59879d942e96d0" ON "channel_muting" ("channelId") `);
        await queryRunner.query(`CREATE INDEX "IDX_6dd314e96806b7df65ddadff72" ON "channel_muting" ("expiresAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_b96870ed326ccc7fa243970965" ON "channel_muting" ("userId", "channelId") `);
        await queryRunner.query(`ALTER TABLE "note" ADD "renoteChannelId" character varying(32)`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."renoteChannelId" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "channel_muting" ADD CONSTRAINT "FK_34415e3062ae7a94617496e81c5" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "channel_muting" ADD CONSTRAINT "FK_4d534d7177fc59879d942e96d03" FOREIGN KEY ("channelId") REFERENCES "channel"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel_muting" DROP CONSTRAINT "FK_4d534d7177fc59879d942e96d03"`);
        await queryRunner.query(`ALTER TABLE "channel_muting" DROP CONSTRAINT "FK_34415e3062ae7a94617496e81c5"`);
        await queryRunner.query(`COMMENT ON COLUMN "note"."renoteChannelId" IS '[Denormalized]'`);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "renoteChannelId"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b96870ed326ccc7fa243970965"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_6dd314e96806b7df65ddadff72"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4d534d7177fc59879d942e96d0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_34415e3062ae7a94617496e81c"`);
        await queryRunner.query(`DROP TABLE "channel_muting"`);
    }
}
