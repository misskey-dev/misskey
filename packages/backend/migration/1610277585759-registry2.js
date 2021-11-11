"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class registry21610277585759 {
    constructor() {
        this.name = 'registry21610277585759';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registry_item" ADD "value" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`COMMENT ON COLUMN "registry_item"."value" IS 'The value of the RegistryItem.'`);
    }
    async down(queryRunner) {
        await queryRunner.query(`COMMENT ON COLUMN "registry_item"."value" IS 'The value of the RegistryItem.'`);
        await queryRunner.query(`ALTER TABLE "registry_item" DROP COLUMN "value"`);
    }
}
exports.registry21610277585759 = registry21610277585759;
