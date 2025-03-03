/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SystemAccounts21740129169650 {
    name = 'SystemAccounts21740129169650'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyAccountId"`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyAccountId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad" FOREIGN KEY ("proxyAccountId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }
}
