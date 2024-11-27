/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SigninRequiredForShowContents1729333924409 {
    name = 'SigninRequiredForShowContents1729333924409'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "requireSigninToViewContents" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "requireSigninToViewContents"`);
    }
}
