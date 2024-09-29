/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserScore1727491883993 {
    name = 'UserScore1727491883993'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "score" integer NOT NULL DEFAULT '0'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "score"`);
    }
}
