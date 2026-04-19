/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddCategoryToAvatarDecorations1766652173085 {
    name = 'AddCategoryToAvatarDecorations1766652173085';

    /**
     * @param {QueryRunner} queryRunner
     */
    async up(queryRunner) {
        await queryRunner.query('ALTER TABLE "avatar_decoration" ADD "category" character varying(128)');
    }

    /**
     * @param {QueryRunner} queryRunner
     */
    async down(queryRunner) {
        await queryRunner.query('ALTER TABLE "avatar_decoration" DROP COLUMN "category"');
    }
};
