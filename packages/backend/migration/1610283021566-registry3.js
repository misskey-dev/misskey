"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class registry31610283021566 {
    constructor() {
        this.name = 'registry31610283021566';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "value" DROP NOT NULL`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registry_item" ALTER COLUMN "value" SET NOT NULL`);
    }
}
exports.registry31610283021566 = registry31610283021566;
