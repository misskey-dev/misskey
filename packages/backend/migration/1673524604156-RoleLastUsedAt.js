/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleLastUsedAt1673524604156 {
    name = 'RoleLastUsedAt1673524604156'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "lastUsedAt" TIMESTAMP WITH TIME ZONE NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "role"."lastUsedAt" IS 'The last used date of the Role.'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "role"."lastUsedAt" IS 'The last used date of the Role.'`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "lastUsedAt"`);
    }
}
