/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class DefaultWithReplies1697430068149 {
    name = 'DefaultWithReplies1697430068149'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "defaultWithReplies" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."defaultWithReplies" IS 'Default value of withReplies for newly followed users'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."defaultWithReplies" IS 'Default value of withReplies for newly followed users'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "defaultWithReplies"`);
    }
}
