/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class instancePinnedPages1605585339718 {
    constructor() {
        this.name = 'instancePinnedPages1605585339718';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "pinnedPages" character varying(512) array NOT NULL DEFAULT '{"/featured", "/channels", "/explore", "/pages", "/about-misskey"}'::varchar[]`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "pinnedPages"`);
    }
}
