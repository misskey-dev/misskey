/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class blurhashForAvatarBanner1595077605646 {
    constructor() {
        this.name = 'blurhashForAvatarBanner1595077605646';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarColor"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerColor"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarBlurhash" character varying(128)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerBlurhash" character varying(128)`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "bannerBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "avatarBlurhash"`);
        await queryRunner.query(`ALTER TABLE "user" ADD "bannerColor" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "user" ADD "avatarColor" character varying(32)`);
    }
}
