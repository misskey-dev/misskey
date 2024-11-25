/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddEnableAllowedEmailDomainOnly1732538997055 {
    name = 'AddEnableAllowedEmailDomainOnly1732538997055'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableAllowedEmailDomainsOnly" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableAllowedEmailDomainsOnly"`);
    }
}
