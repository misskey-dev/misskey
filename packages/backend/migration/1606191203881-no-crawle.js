"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class noCrawle1606191203881 {
    constructor() {
        this.name = 'noCrawle1606191203881';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "noCrawle" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "user_profile"."noCrawle" IS 'Whether reject index by crawler.'`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "noCrawle"`);
    }
}
exports.noCrawle1606191203881 = noCrawle1606191203881;
