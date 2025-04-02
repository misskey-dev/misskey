/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleCopyOnMoveAccount1743558299182 {
    name = 'RoleCopyOnMoveAccount1743558299182'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "copyOnMoveAccount" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "role"."copyOnMoveAccount" IS 'If true, the role will be copied to moved to the new user on moving a user.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "role"."copyOnMoveAccount" IS 'If true, the role will be copied to moved to the new user on moving a user.'`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "copyOnMoveAccount"`);
    }
}
