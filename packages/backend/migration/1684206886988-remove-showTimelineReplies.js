/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoveShowTimelineReplies1684206886988 {
    name = 'RemoveShowTimelineReplies1684206886988'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "showTimelineReplies"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "showTimelineReplies" boolean NOT NULL DEFAULT false`);
    }
}
