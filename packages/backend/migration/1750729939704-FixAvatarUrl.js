/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */
export class FixAvatarUrl1750729939704 {
    name = 'FixAvatarUrl1750729939704'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "avatarUrl" TYPE character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "avatarUrl" TYPE character varying(512)`);
    }
}
