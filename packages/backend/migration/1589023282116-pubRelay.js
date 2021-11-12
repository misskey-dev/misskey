"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class pubRelay1589023282116 {
    constructor() {
        this.name = 'pubRelay1589023282116';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "relay_status_enum" AS ENUM('requesting', 'accepted', 'rejected')`, undefined);
        await queryRunner.query(`CREATE TABLE "relay" ("id" character varying(32) NOT NULL, "inbox" character varying(512) NOT NULL, "status" "relay_status_enum" NOT NULL, CONSTRAINT "PK_78ebc9cfddf4292633b7ba57aee" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_0d9a1738f2cf7f3b1c3334dfab" ON "relay" ("inbox") `, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_0d9a1738f2cf7f3b1c3334dfab"`, undefined);
        await queryRunner.query(`DROP TABLE "relay"`, undefined);
        await queryRunner.query(`DROP TYPE "relay_status_enum"`, undefined);
    }
}
exports.pubRelay1589023282116 = pubRelay1589023282116;
