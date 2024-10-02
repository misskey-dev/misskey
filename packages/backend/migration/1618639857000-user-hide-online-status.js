/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class userHideOnlineStatus1618639857000 {
    constructor() {
        this.name = 'userHideOnlineStatus1618639857000';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "hideOnlineStatus" boolean NOT NULL DEFAULT true`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hideOnlineStatus"`);
    }
}
