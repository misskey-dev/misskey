"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class useBigintForDriveUsage1613503367223 {
    constructor() {
        this.name = 'useBigintForDriveUsage1613503367223';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" ALTER COLUMN "driveUsage" TYPE bigint`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "instance" DROP COLUMN "driveUsage"`);
        await queryRunner.query(`ALTER TABLE "instance" ADD "driveUsage" integer NOT NULL DEFAULT 0`);
    }
}
exports.useBigintForDriveUsage1613503367223 = useBigintForDriveUsage1613503367223;
