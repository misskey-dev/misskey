/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class HardMute1700383825690 {
    name = 'HardMute1700383825690'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "hardMutedWords" jsonb NOT NULL DEFAULT '[]'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "hardMutedWords"`);
    }
}
