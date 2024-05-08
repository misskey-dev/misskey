/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class featuredInjecttion1582019042083 {
    constructor() {
        this.name = 'featuredInjecttion1582019042083';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "injectFeaturedNote" boolean NOT NULL DEFAULT true`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "injectFeaturedNote"`, undefined);
    }
}
