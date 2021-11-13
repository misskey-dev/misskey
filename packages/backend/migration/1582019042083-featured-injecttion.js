"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class featuredInjecttion1582019042083 {
    constructor() {
        this.name = 'featuredInjecttion1582019042083';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "injectFeaturedNote" boolean NOT NULL DEFAULT true`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "injectFeaturedNote"`, undefined);
    }
}
exports.featuredInjecttion1582019042083 = featuredInjecttion1582019042083;
