/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NotificationRecieveConfig1695944637565 {
    name = 'NotificationRecieveConfig1695944637565'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutingNotificationTypes"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "notificationRecieveConfig" jsonb NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "notificationRecieveConfig"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutingNotificationTypes" "public"."user_profile_notificationrecieveconfig_enum" array NOT NULL DEFAULT '{}'`);
    }
}
