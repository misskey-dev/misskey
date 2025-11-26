/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SensitiveMediaDetectionProxy1731916961000 {
    name = 'SensitiveMediaDetectionProxy1731916961000'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "sensitiveMediaDetectionProxyUrl" character varying(1024)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "sensitiveMediaDetectionProxyUrl"`);
    }
}
