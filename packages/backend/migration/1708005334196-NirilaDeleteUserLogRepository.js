/*
 * SPDX-FileCopyrightText: anatawa12
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class NirilaDeleteUserLogRepository1708005334196 {
	constructor() {
		this.name = 'NirilaDeleteUserLogRepository1708005334196'
	}

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "nirila_delete_user_log" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "username" character varying(128) NOT NULL, "email" character varying(128), "info" jsonb NOT NULL, CONSTRAINT "PK_34be175a3f407ea9f0dd42da572" PRIMARY KEY ("id")); COMMENT ON COLUMN "nirila_delete_user_log"."username" IS 'The username of the deleted User.'; COMMENT ON COLUMN "nirila_delete_user_log"."email" IS 'The email adddress of the deleted User.'`);
		await queryRunner.query(`CREATE INDEX "IDX_343c0efea0f002a2bf34960bd1" ON "nirila_delete_user_log" ("userId") `);
		await queryRunner.query(`CREATE INDEX "IDX_940ffb8ea315bef184208780f8" ON "nirila_delete_user_log" ("username") `);
		await queryRunner.query(`CREATE INDEX "IDX_da5751593e765f39d09303f768" ON "nirila_delete_user_log" ("email") `);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX "public"."IDX_da5751593e765f39d09303f768"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_940ffb8ea315bef184208780f8"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_343c0efea0f002a2bf34960bd1"`);
		await queryRunner.query(`DROP TABLE "nirila_delete_user_log"`);
	}
}
