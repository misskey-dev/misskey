/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserAcct1772983353696 {
    name = 'UserAcct1772983353696'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "acct" character varying(512)`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."acct" IS 'The last retrieved webfinger subject of the User. It will be null if the origin of the user is local.'`);
        await queryRunner.query(`CREATE INDEX "IDX_0be9d7dcbac33e23aba1637a69" ON "user" ("acct") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_0be9d7dcbac33e23aba1637a69"`);
        await queryRunner.query(`COMMENT ON COLUMN "user"."acct" IS 'The last retrieved webfinger subject of the User. It will be null if the origin of the user is local.'`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "acct"`);
    }
}
