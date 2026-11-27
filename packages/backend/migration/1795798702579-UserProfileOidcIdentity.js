/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserProfileOidcIdentity1795798702579 {
    name = 'UserProfileOidcIdentity1795798702579'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "oidcIdentity" character varying(43)`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_user_profile_oidc_identity" ON "user_profile" ("oidcIdentity")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_user_profile_oidc_identity"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "oidcIdentity"`);
    }
}
