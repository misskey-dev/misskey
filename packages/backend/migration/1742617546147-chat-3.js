/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class Chat31742617546147 {
    name = 'Chat31742617546147'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "chat_approval" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "otherId" character varying(32) NOT NULL, CONSTRAINT "PK_fbbb95d60acf5c85388345b5f5d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_530257863e1381a7f2f1d3282f" ON "chat_approval" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_b1d46037f23d170da5c05fdf75" ON "chat_approval" ("otherId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_12c4768a2f706fc267f2078903" ON "chat_approval" ("userId", "otherId") `);
        await queryRunner.query(`ALTER TABLE "chat_approval" ADD CONSTRAINT "FK_530257863e1381a7f2f1d3282fe" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "chat_approval" ADD CONSTRAINT "FK_b1d46037f23d170da5c05fdf755" FOREIGN KEY ("otherId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "chat_approval" DROP CONSTRAINT "FK_b1d46037f23d170da5c05fdf755"`);
        await queryRunner.query(`ALTER TABLE "chat_approval" DROP CONSTRAINT "FK_530257863e1381a7f2f1d3282fe"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_12c4768a2f706fc267f2078903"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b1d46037f23d170da5c05fdf75"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_530257863e1381a7f2f1d3282f"`);
        await queryRunner.query(`DROP TABLE "chat_approval"`);
    }
}
