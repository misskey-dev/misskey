/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleColor1673515526953 {
    name = 'RoleColor1673515526953'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" ADD "color" character varying(256)`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "color"`);
    }
}
