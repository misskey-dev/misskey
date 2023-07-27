/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserListFavorites1683869758873 {
    name = 'UserListFavorites1683869758873'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_list_favorite" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "userListId" character varying(32) NOT NULL, CONSTRAINT "PK_c0974b21e18502a4c8178e09fe6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_016f613dc4feb807e03e3e7da9" ON "user_list_favorite" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d6765a8c2a4c17c33f9d7f948b" ON "user_list_favorite" ("userId", "userListId") `);
        await queryRunner.query(`ALTER TABLE "user_list_favorite" ADD CONSTRAINT "FK_016f613dc4feb807e03e3e7da92" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_list_favorite" ADD CONSTRAINT "FK_4d52b20bfe32c8552e7a61e80d2" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_list_favorite" DROP CONSTRAINT "FK_4d52b20bfe32c8552e7a61e80d2"`);
        await queryRunner.query(`ALTER TABLE "user_list_favorite" DROP CONSTRAINT "FK_016f613dc4feb807e03e3e7da92"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d6765a8c2a4c17c33f9d7f948b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_016f613dc4feb807e03e3e7da9"`);
        await queryRunner.query(`DROP TABLE "user_list_favorite"`);
    }
}
