/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class whetherPushNotifyToSendReadMessage1669138716634 {
    name = 'whetherPushNotifyToSendReadMessage1669138716634'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sw_subscription" ADD "sendReadMessage" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "sw_subscription" DROP COLUMN "sendReadMessage"`);
    }
}
