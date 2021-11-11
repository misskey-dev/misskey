"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class CustomEmojiCategory1571220798684 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "category" character varying(128)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "category"`, undefined);
    }
}
exports.CustomEmojiCategory1571220798684 = CustomEmojiCategory1571220798684;
