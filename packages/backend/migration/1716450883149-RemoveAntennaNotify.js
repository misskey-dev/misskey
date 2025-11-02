/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoveAntennaNotify1716450883149 {
    name = 'RemoveAntennaNotify1716450883149'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "notify"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "notify" boolean NOT NULL`);
    }
}
