/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SensitiveMediaHosts1704622962215 {
    name = 'SensitiveMediaHosts1704622962215'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaHosts" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaHosts"`);
    }
}
