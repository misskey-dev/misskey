/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RoleDisplayVisibility1779035944722 {
    name = 'RoleDisplayVisibility1779035944722';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "hiddenRoleIds" character varying(32) array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "role" ADD "isPublicDisplayRequired" boolean NOT NULL DEFAULT false`);
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role" DROP COLUMN "isPublicDisplayRequired"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "hiddenRoleIds"`);
    }
}
