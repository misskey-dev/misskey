/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class VisibleUserGeneratedContentsForNonLoggedInVisitors1746330901644 {
    name = 'VisibleUserGeneratedContentsForNonLoggedInVisitors1746330901644'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "ugcVisibilityForVisitor" character varying(128) NOT NULL DEFAULT 'local'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "ugcVisibilityForVisitor"`);
    }
}
