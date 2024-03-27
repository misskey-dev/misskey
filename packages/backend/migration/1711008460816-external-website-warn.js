/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ExternalWebsiteWarn1711008460816 {
    name = 'ExternalWebsiteWarn1711008460816'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "trustedLinkUrlPatterns" character varying(3072) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "trustedLinkUrlPatterns"`);
    }
}
