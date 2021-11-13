"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class promo1581979837262 {
    constructor() {
        this.name = 'promo1581979837262';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "promo_note" ("noteId" character varying(32) NOT NULL, "expiresAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "REL_e263909ca4fe5d57f8d4230dd5" UNIQUE ("noteId"), CONSTRAINT "PK_e263909ca4fe5d57f8d4230dd5c" PRIMARY KEY ("noteId"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_83f0862e9bae44af52ced7099e" ON "promo_note" ("userId") `, undefined);
        await queryRunner.query(`CREATE TABLE "promo_read" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, CONSTRAINT "PK_61917c1541002422b703318b7c9" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_9657d55550c3d37bfafaf7d4b0" ON "promo_read" ("userId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_2882b8a1a07c7d281a98b6db16" ON "promo_read" ("userId", "noteId") `, undefined);
        await queryRunner.query(`ALTER TABLE "promo_note" ADD CONSTRAINT "FK_e263909ca4fe5d57f8d4230dd5c" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "promo_read" ADD CONSTRAINT "FK_9657d55550c3d37bfafaf7d4b05" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "promo_read" ADD CONSTRAINT "FK_a46a1a603ecee695d7db26da5f4" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "promo_read" DROP CONSTRAINT "FK_a46a1a603ecee695d7db26da5f4"`, undefined);
        await queryRunner.query(`ALTER TABLE "promo_read" DROP CONSTRAINT "FK_9657d55550c3d37bfafaf7d4b05"`, undefined);
        await queryRunner.query(`ALTER TABLE "promo_note" DROP CONSTRAINT "FK_e263909ca4fe5d57f8d4230dd5c"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2882b8a1a07c7d281a98b6db16"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_9657d55550c3d37bfafaf7d4b0"`, undefined);
        await queryRunner.query(`DROP TABLE "promo_read"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_83f0862e9bae44af52ced7099e"`, undefined);
        await queryRunner.query(`DROP TABLE "promo_note"`, undefined);
    }
}
exports.promo1581979837262 = promo1581979837262;
