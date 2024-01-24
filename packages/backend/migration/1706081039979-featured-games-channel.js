/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class FeaturedGamesChannel1706081039979 {
    name = 'FeaturedGamesChannel1706081039979'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "featuredGameChannels" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "featuredGameChannels"`);
    }
}
