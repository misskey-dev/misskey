/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SensitiveReason1739257753979 {
    name = 'SensitiveReason1739257753979'

    async up(queryRunner) {
        await queryRunner.query(`
            CREATE TYPE "public"."drive_file_sensitivechangereason_enum" AS ENUM('user', 'moderator', 'auto', 'none')
        `);
        await queryRunner.query(`
            ALTER TABLE "drive_file"
            ADD "sensitiveChangeReason" "public"."drive_file_sensitivechangereason_enum" NOT NULL DEFAULT 'none'
        `);
    }

    async down(queryRunner) {
        await queryRunner.query(`
            ALTER TABLE "drive_file" DROP COLUMN "sensitiveChangeReason"
        `);
        await queryRunner.query(`
            DROP TYPE "public"."drive_file_sensitivechangereason_enum"
        `);
    }
}
