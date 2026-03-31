/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ExternalWebsiteWarn1762172837314 {
    name = 'ExternalWebsiteWarn1762172837314'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "trustedLinkUrlPatterns" character varying(3072) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "trustedLinkUrlPatterns"`);
    }
}
