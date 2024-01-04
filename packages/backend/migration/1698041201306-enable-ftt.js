/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EnableFtt1698041201306 {
    name = 'EnableFtt1698041201306'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableFanoutTimeline" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableFanoutTimeline"`);
    }
}
