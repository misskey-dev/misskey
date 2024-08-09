/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemotePublicReactionsSetFalse1723208290742 {
    name = 'RemotePublicReactionsSetFalse1723208290742'

    public async up(queryRunner) {
        await queryRunner.query(`UPDATE "user_profile" SET "publicReactions" = FALSE FROM "users" WHERE "user_profile"."userId" = "user"."id" AND "user"."host" IS NULL`);
    }

    public async down(queryRunner) {
        // no valid down migration
    }
}
