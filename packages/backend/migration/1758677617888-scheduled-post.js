/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ScheduledPost1758677617888 {
    name = 'ScheduledPost1758677617888'

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_draft" ADD "scheduledAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "note_draft" ADD "isActuallyScheduled" boolean NOT NULL DEFAULT false`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "note_draft" DROP COLUMN "isActuallyScheduled"`);
        await queryRunner.query(`ALTER TABLE "note_draft" DROP COLUMN "scheduledAt"`);
    }
}
