/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Notifytodiscord1716137989170 {
    name = 'Notifytodiscord1716137989170'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "discordWebhookUrl" varchar(1024) default null`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "discordWebhookUrl" SET DEFAULT true`);
    }
}
