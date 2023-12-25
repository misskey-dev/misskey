/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class webhook1648548247382 {
    name = 'webhook1648548247382'

    async up(queryRunner) {
			await queryRunner.query(`CREATE TABLE "webhook" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "name" character varying(128) NOT NULL, "on" character varying(128) array NOT NULL DEFAULT '{}', "url" character varying(1024) NOT NULL, "secret" character varying(1024) NOT NULL, "active" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_e6765510c2d078db49632b59020" PRIMARY KEY ("id")); COMMENT ON COLUMN "webhook"."createdAt" IS 'The created date of the Antenna.'; COMMENT ON COLUMN "webhook"."userId" IS 'The owner ID.'; COMMENT ON COLUMN "webhook"."name" IS 'The name of the Antenna.'`);
			await queryRunner.query(`CREATE INDEX "IDX_f272c8c8805969e6a6449c77b3" ON "webhook" ("userId") `);
			await queryRunner.query(`CREATE INDEX "IDX_8063a0586ed1dfbe86e982d961" ON "webhook" ("on") `);
			await queryRunner.query(`CREATE INDEX "IDX_5a056076f76b2efe08216ba655" ON "webhook" ("active") `);
			await queryRunner.query(`ALTER TABLE "webhook" ADD CONSTRAINT "FK_f272c8c8805969e6a6449c77b3c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "webhook" DROP CONSTRAINT "FK_f272c8c8805969e6a6449c77b3c"`);
			await queryRunner.query(`DROP INDEX "public"."IDX_5a056076f76b2efe08216ba655"`);
			await queryRunner.query(`DROP INDEX "public"."IDX_8063a0586ed1dfbe86e982d961"`);
			await queryRunner.query(`DROP INDEX "public"."IDX_f272c8c8805969e6a6449c77b3"`);
			await queryRunner.query(`DROP TABLE "webhook"`);
	}
}
