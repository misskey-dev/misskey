/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MovedAt1682190963894 {
    name = 'MovedAt1682190963894'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "movedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedAt" IS 'When the user moved to another account'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedAt" IS 'When the user moved to another account'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedAt"`);
    }
}
