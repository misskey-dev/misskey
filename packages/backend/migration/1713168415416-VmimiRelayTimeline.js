/*
 * SPDX-FileCopyrightText: anatawa12 and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class VmimiRelayTimeline1713168415416 {
    name = 'VmimiRelayTimeline1713168415416'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "vmimiRelayTimelineCacheMax" integer NOT NULL DEFAULT '300'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "vmimiRelayTimelineCacheMax"`);
    }
}
