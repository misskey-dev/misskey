/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NirilaBlockMentionsFromUnfamiliarRemoteUsers1719663422807 {
    name = 'NirilaBlockMentionsFromUnfamiliarRemoteUsers1719663422807'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "nirilaBlockMentionsFromUnfamiliarRemoteUsers" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "nirilaBlockMentionsFromUnfamiliarRemoteUsers"`);
    }
}
