/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class EnableFanoutTimelineDbFallback1700096812223 {
    name = 'EnableFanoutTimelineDbFallback1700096812223'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableFanoutTimelineDbFallback" boolean NOT NULL DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableFanoutTimelineDbFallback"`);
    }
}
