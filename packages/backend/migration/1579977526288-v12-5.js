"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class v1251579977526288 {
    constructor() {
        this.name = 'v1251579977526288';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "clip" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "name" character varying(128) NOT NULL, "isPublic" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_f0685dac8d4dd056d7255670b75" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_2b5ec6c574d6802c94c80313fb" ON "clip" ("userId") `, undefined);
        await queryRunner.query(`CREATE TABLE "clip_note" ("id" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "clipId" character varying(32) NOT NULL, CONSTRAINT "PK_e94cda2f40a99b57e032a1a738b" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_a012eaf5c87c65da1deb5fdbfa" ON "clip_note" ("noteId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_ebe99317bbbe9968a0c6f579ad" ON "clip_note" ("clipId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_6fc0ec357d55a18646262fdfff" ON "clip_note" ("noteId", "clipId") `, undefined);
        await queryRunner.query(`CREATE TYPE "antenna_src_enum" AS ENUM('home', 'all', 'list')`, undefined);
        await queryRunner.query(`CREATE TABLE "antenna" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "name" character varying(128) NOT NULL, "src" "antenna_src_enum" NOT NULL, "userListId" character varying(32), "keywords" jsonb NOT NULL DEFAULT '[]', "withFile" boolean NOT NULL, "expression" character varying(2048), "notify" boolean NOT NULL, "hasNewNote" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_c170b99775e1dccca947c9f2d5f" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_6446c571a0e8d0f05f01c78909" ON "antenna" ("userId") `, undefined);
        await queryRunner.query(`CREATE TABLE "antenna_note" ("id" character varying(32) NOT NULL, "noteId" character varying(32) NOT NULL, "antennaId" character varying(32) NOT NULL, CONSTRAINT "PK_fb28d94d0989a3872df19fd6ef8" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_bd0397be22147e17210940e125" ON "antenna_note" ("noteId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_0d775946662d2575dfd2068a5f" ON "antenna_note" ("antennaId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_335a0bf3f904406f9ef3dd51c2" ON "antenna_note" ("noteId", "antennaId") `, undefined);
        await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "geo"`, undefined);
        await queryRunner.query(`ALTER TABLE "clip" ADD CONSTRAINT "FK_2b5ec6c574d6802c94c80313fb2" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "clip_note" ADD CONSTRAINT "FK_a012eaf5c87c65da1deb5fdbfa3" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "clip_note" ADD CONSTRAINT "FK_ebe99317bbbe9968a0c6f579adf" FOREIGN KEY ("clipId") REFERENCES "clip"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD CONSTRAINT "FK_6446c571a0e8d0f05f01c789096" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" ADD CONSTRAINT "FK_709d7d32053d0dd7620f678eeb9" FOREIGN KEY ("userListId") REFERENCES "user_list"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna_note" ADD CONSTRAINT "FK_bd0397be22147e17210940e125b" FOREIGN KEY ("noteId") REFERENCES "note"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna_note" ADD CONSTRAINT "FK_0d775946662d2575dfd2068a5f5" FOREIGN KEY ("antennaId") REFERENCES "antenna"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "antenna_note" DROP CONSTRAINT "FK_0d775946662d2575dfd2068a5f5"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna_note" DROP CONSTRAINT "FK_bd0397be22147e17210940e125b"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP CONSTRAINT "FK_709d7d32053d0dd7620f678eeb9"`, undefined);
        await queryRunner.query(`ALTER TABLE "antenna" DROP CONSTRAINT "FK_6446c571a0e8d0f05f01c789096"`, undefined);
        await queryRunner.query(`ALTER TABLE "clip_note" DROP CONSTRAINT "FK_ebe99317bbbe9968a0c6f579adf"`, undefined);
        await queryRunner.query(`ALTER TABLE "clip_note" DROP CONSTRAINT "FK_a012eaf5c87c65da1deb5fdbfa3"`, undefined);
        await queryRunner.query(`ALTER TABLE "clip" DROP CONSTRAINT "FK_2b5ec6c574d6802c94c80313fb2"`, undefined);
        await queryRunner.query(`ALTER TABLE "note" ADD "geo" jsonb`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_335a0bf3f904406f9ef3dd51c2"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_0d775946662d2575dfd2068a5f"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_bd0397be22147e17210940e125"`, undefined);
        await queryRunner.query(`DROP TABLE "antenna_note"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_6446c571a0e8d0f05f01c78909"`, undefined);
        await queryRunner.query(`DROP TABLE "antenna"`, undefined);
        await queryRunner.query(`DROP TYPE "antenna_src_enum"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_6fc0ec357d55a18646262fdfff"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_ebe99317bbbe9968a0c6f579ad"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_a012eaf5c87c65da1deb5fdbfa"`, undefined);
        await queryRunner.query(`DROP TABLE "clip_note"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_2b5ec6c574d6802c94c80313fb"`, undefined);
        await queryRunner.query(`DROP TABLE "clip"`, undefined);
    }
}
exports.v1251579977526288 = v1251579977526288;
