/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class passwordReset1619942102890 {
    constructor() {
        this.name = 'passwordReset1619942102890';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "password_reset_request" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "token" character varying(256) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_fcf4b02eae1403a2edaf87fd074" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0b575fa9a4cfe638a925949285" ON "password_reset_request" ("token") `);
        await queryRunner.query(`CREATE INDEX "IDX_4bb7fd4a34492ae0e6cc8d30ac" ON "password_reset_request" ("userId") `);
        await queryRunner.query(`ALTER TABLE "password_reset_request" ADD CONSTRAINT "FK_4bb7fd4a34492ae0e6cc8d30ac8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "password_reset_request" DROP CONSTRAINT "FK_4bb7fd4a34492ae0e6cc8d30ac8"`);
        await queryRunner.query(`DROP INDEX "IDX_4bb7fd4a34492ae0e6cc8d30ac"`);
        await queryRunner.query(`DROP INDEX "IDX_0b575fa9a4cfe638a925949285"`);
        await queryRunner.query(`DROP TABLE "password_reset_request"`);
    }
}
