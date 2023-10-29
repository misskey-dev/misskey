/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ServerIconsAndManifest1694850832075 {
    name = 'ServerIconsAndManifest1694850832075'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "app192IconUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "app512IconUrl" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "manifestJsonOverride" character varying(8192) NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "manifestJsonOverride"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "app512IconUrl"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "app192IconUrl"`);
    }
}
