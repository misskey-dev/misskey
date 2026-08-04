/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleCopyOnMoveAccount1743558299182 {
    name = 'RoleCopyOnMoveAccount1743558299182'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "preserveAssignmentOnMoveAccount" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "preserveAssignmentOnMoveAccount"`);
    }
}
