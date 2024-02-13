/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleIroiro1673522856499 {
    name = 'RoleIroiro1673522856499'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isSilenced"`);
        await queryRunner.query(`ALTER TABLE "role" ADD "canEditMembersByModerator" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "canEditMembersByModerator"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "isSilenced" boolean NOT NULL DEFAULT false`);
    }
}
