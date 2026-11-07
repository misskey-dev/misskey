/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleBadgesRemoteUsers1760607435831 {
    name = 'RoleBadgesRemoteUsers1760607435831'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "showRoleBadgesOfRemoteUsers" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "showRoleBadgesOfRemoteUsers"`);
    }
}
