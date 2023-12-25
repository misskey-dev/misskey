/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleConditional1673570377815 {
    name = 'RoleConditional1673570377815'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."role_target_enum" AS ENUM('manual', 'conditional')`);
        await queryRunner.query(`ALTER TABLE "role" ADD "target" "public"."role_target_enum" NOT NULL DEFAULT 'manual'`);
        await queryRunner.query(`ALTER TABLE "role" ADD "condFormula" jsonb NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "condFormula"`);
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "target"`);
        await queryRunner.query(`DROP TYPE "public"."role_target_enum"`);
    }
}
