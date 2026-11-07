/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ChannelColor1682985520254 {
    name = 'ChannelColor1682985520254'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" ADD "color" character varying(16) NOT NULL DEFAULT '#86b300'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "channel" DROP COLUMN "color"`);
    }
}
