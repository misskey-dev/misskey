/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddFanoutTimelineActive1780626317299 {
    name = 'AddFanoutTimelineActive1780626317299';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "meta" ADD "fanoutTimelineActive" boolean NOT NULL DEFAULT true');
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "meta" DROP COLUMN "fanoutTimelineActive"');
    }
};
