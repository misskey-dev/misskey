"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class antennaExclude1582210532752 {
    constructor() {
        this.name = 'antennaExclude1582210532752';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" ADD "excludeKeywords" jsonb NOT NULL DEFAULT '[]'`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna" DROP COLUMN "excludeKeywords"`, undefined);
    }
}
exports.antennaExclude1582210532752 = antennaExclude1582210532752;
