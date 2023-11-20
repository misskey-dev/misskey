/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */


export class FollowRequestWithReplies1697441463087 {
    name = 'FollowRequestWithReplies1697441463087'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "follow_request" ADD "withReplies" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "follow_request" DROP COLUMN "withReplies"`);
    }
}
