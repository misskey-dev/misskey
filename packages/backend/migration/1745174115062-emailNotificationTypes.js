/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class emailNotificationTypes1745174115062 {
    constructor() {
        this.name = 'emailNotificationTypes1745174115062';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "emailNotificationTypes" jsonb NOT NULL DEFAULT '["login","follow","receiveFollowRequest","groupInvited"]'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "emailNotificationTypes"`);
    }
}
