"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class AddObjectStorageUseProxy1586624197029 {
    constructor() {
        this.name = 'AddObjectStorageUseProxy1586624197029';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageUseProxy" boolean NOT NULL DEFAULT true`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageUseProxy"`, undefined);
    }
}
exports.AddObjectStorageUseProxy1586624197029 = AddObjectStorageUseProxy1586624197029;
