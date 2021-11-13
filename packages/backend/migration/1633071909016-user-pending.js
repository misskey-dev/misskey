"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class userPending1633071909016 {
    constructor() {
        this.name = 'userPending1633071909016';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_pending" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "code" character varying(128) NOT NULL, "username" character varying(128) NOT NULL, "email" character varying(128) NOT NULL, "password" character varying(128) NOT NULL, CONSTRAINT "PK_d4c84e013c98ec02d19b8fbbafa" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_4e5c4c99175638ec0761714ab0" ON "user_pending" ("code") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_4e5c4c99175638ec0761714ab0"`);
        await queryRunner.query(`DROP TABLE "user_pending"`);
    }
}
exports.userPending1633071909016 = userPending1633071909016;
