"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class objectStorageSetPublicRead1597230137744 {
    constructor() {
        this.name = 'objectStorageSetPublicRead1597230137744';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "objectStorageSetPublicRead" boolean NOT NULL DEFAULT false`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "objectStorageSetPublicRead"`);
    }
}
exports.objectStorageSetPublicRead1597230137744 = objectStorageSetPublicRead1597230137744;
