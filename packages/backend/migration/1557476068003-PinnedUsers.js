"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class PinnedUsers1557476068003 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "pinnedUsers" character varying(256) array NOT NULL DEFAULT '{}'::varchar[]`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "pinnedUsers"`);
    }
}
exports.PinnedUsers1557476068003 = PinnedUsers1557476068003;
