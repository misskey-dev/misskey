/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelArchive1683328299359 {
    name = 'ChannelArchive1683328299359'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "isArchived" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`CREATE INDEX "IDX_cc7c72974f1b2f385a8921f094" ON "channel" ("isArchived") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_cc7c72974f1b2f385a8921f094"`);
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "isArchived"`);
    }
}
