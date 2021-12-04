"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class wordMute1595771249699 {
    constructor() {
        this.name = 'wordMute1595771249699';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "muted_note" ("id" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, CONSTRAINT "PK_897e2eff1c0b9b64e55ca1418a4" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_70ab9786313d78e4201d81cdb8" ON "muted_note" ("noteId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d8e07aa18c2d64e86201601aec" ON "muted_note" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_a8c6bfd637d3f1d67a27c48e27" ON "muted_note" ("noteId", "userId") `);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "enableWordMute" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutedWords" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`CREATE INDEX "IDX_3befe6f999c86aff06eb0257b4" ON "user_profile" ("enableWordMute") `);
        await queryRunner.query(`ALTER TABLE "muted_note" ADD CONSTRAINT "FK_70ab9786313d78e4201d81cdb89" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "muted_note" ADD CONSTRAINT "FK_d8e07aa18c2d64e86201601aec1" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "muted_note" DROP CONSTRAINT "FK_d8e07aa18c2d64e86201601aec1"`);
        await queryRunner.query(`ALTER TABLE "muted_note" DROP CONSTRAINT "FK_70ab9786313d78e4201d81cdb89"`);
        await queryRunner.query(`DROP INDEX "IDX_3befe6f999c86aff06eb0257b4"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutedWords"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "enableWordMute"`);
        await queryRunner.query(`DROP INDEX "IDX_a8c6bfd637d3f1d67a27c48e27"`);
        await queryRunner.query(`DROP INDEX "IDX_d8e07aa18c2d64e86201601aec"`);
        await queryRunner.query(`DROP INDEX "IDX_70ab9786313d78e4201d81cdb8"`);
        await queryRunner.query(`DROP TABLE "muted_note"`);
    }
}
exports.wordMute1595771249699 = wordMute1595771249699;
