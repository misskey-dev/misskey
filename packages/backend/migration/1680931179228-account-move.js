/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AccountMove1680931179228 {
    name = 'AccountMove1680931179228'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "movedToUri" character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUri" IS 'The URI of the new account of the User'`);
        await queryRunner.query(`ALTER TABLE "user" ADD "alsoKnownAs" text`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."alsoKnownAs" IS 'URIs the user is known as too'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user"."alsoKnownAs" IS 'URIs the user is known as too'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alsoKnownAs"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."movedToUri" IS 'The URI of the new account of the User'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "movedToUri"`);
    }
}
