"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class v12141580864313253 {
    constructor() {
        this.name = 'v12141580864313253';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "proxyAccount" TO "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyAccountId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad" FOREIGN KEY ("proxyAccountId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP CONSTRAINT "FK_ab1bc0c1e209daa77b8e8d212ad"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyAccountId"`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyAccountId" character varying(128)`, undefined);
        await queryRunner.query(`ALTER TABLE "meta" RENAME COLUMN "proxyAccountId" TO "proxyAccount"`, undefined);
    }
}
exports.v12141580864313253 = v12141580864313253;
