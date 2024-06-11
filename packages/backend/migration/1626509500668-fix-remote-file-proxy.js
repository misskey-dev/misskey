/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class fixRemoteFileProxy1626509500668 {
    constructor() {
        this.name = 'fixRemoteFileProxy1626509500668';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarUrl"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerUrl"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerBlurhash"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerBlurhash" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarBlurhash" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerUrl" character varying(512)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarUrl" character varying(512)`);
    }
}

