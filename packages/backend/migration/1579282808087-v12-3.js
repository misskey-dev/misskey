"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class v1231579282808087 {
    constructor() {
        this.name = 'v1231579282808087';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" ADD "updatedAt" TIMESTAMP WITH TIME ZONE`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "updatedAt"`, undefined);
    }
}
exports.v1231579282808087 = v1231579282808087;
