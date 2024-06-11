/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PublicReactionsDefaultTrue1683683083083 {
    name = 'PublicReactionsDefaultTrue1683683083083'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "publicReactions" SET DEFAULT true`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ALTER COLUMN "publicReactions" SET DEFAULT false`);
    }
}
