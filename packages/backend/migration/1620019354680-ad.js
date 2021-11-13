"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class ad1620019354680 {
    constructor() {
        this.name = 'ad1620019354680';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "ad" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "place" character varying(32) NOT NULL, "priority" character varying(32) NOT NULL, "url" character varying(1024) NOT NULL, "imageUrl" character varying(1024) NOT NULL, "memo" character varying(8192) NOT NULL, CONSTRAINT "PK_0193d5ef09746e88e9ea92c634d" PRIMARY KEY ("id")); COMMENT ON COLUMN "ad"."createdAt" IS 'The created date of the Ad.'; COMMENT ON COLUMN "ad"."expiresAt" IS 'The expired date of the Ad.'`);
        await queryRunner.query(`CREATE INDEX "IDX_1129c2ef687fc272df040bafaa" ON "ad" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_2da24ce20ad209f1d9dc032457" ON "ad" ("expiresAt") `);
    }
    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "IDX_2da24ce20ad209f1d9dc032457"`);
        await queryRunner.query(`DROP INDEX "IDX_1129c2ef687fc272df040bafaa"`);
        await queryRunner.query(`DROP TABLE "ad"`);
    }
}
exports.ad1620019354680 = ad1620019354680;
