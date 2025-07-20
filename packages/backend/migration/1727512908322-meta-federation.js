/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MetaFederation1727512908322 {
    name = 'MetaFederation1727512908322'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "federation" character varying(128) NOT NULL DEFAULT 'all'`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "federationHosts" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "federationHosts"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "federation"`);
    }
}
