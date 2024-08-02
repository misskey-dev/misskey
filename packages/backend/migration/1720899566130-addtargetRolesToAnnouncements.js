/*
 * SPDX-License-Identifier: taichan and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddTargetRolesToAnnouncements1720899566130 {
	name = 'AddTargetRolesToAnnouncements1720899566130'

	async up(queryRunner) {
			await queryRunner.query(`CREATE TABLE "announcement_role" ("id" character varying(32) NOT NULL, "announcementId" character varying(32) NOT NULL, "roleId" character varying(32) NOT NULL, CONSTRAINT "PK_cb76dfa429c742b1a273ef18d71983ea" PRIMARY KEY ("announcementId", "roleId"))`);
			await queryRunner.query(`CREATE INDEX "IDX_56b0c35e2d1449e987b1c43a779b14ce" ON "announcement_role" ("announcementId") `);
			await queryRunner.query(`CREATE INDEX "IDX_53351cbca4544b04937d10f64f98f682" ON "announcement_role" ("roleId") `);
			await queryRunner.query(`CREATE UNIQUE INDEX "090a6806f09446228a3ddd501eb63270" ON "announcement_role" ("announcementId", "roleId") `);
			await queryRunner.query(`ALTER TABLE "announcement_role" ADD CONSTRAINT "FK_56b0c35e2d1449e987b1c43a779" FOREIGN KEY ("announcementId") REFERENCES "announcement"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
			await queryRunner.query(`ALTER TABLE "announcement_role" ADD CONSTRAINT "FK_53351cbca4544b04937d10f64f9" FOREIGN KEY ("roleId") REFERENCES "role"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

			await queryRunner.query(`ALTER TABLE "announcement" ADD "isRoleSpecified" boolean NOT NULL DEFAULT false`);
			await queryRunner.query(`CREATE INDEX "IDX_b2dbc3e04c3443eca1ff9c488e904660" ON "announcement" ("isRoleSpecified") `);
	}

	async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "announcement_role" DROP CONSTRAINT "FK_53351cbca4544b04937d10f64f9"`);
			await queryRunner.query(`ALTER TABLE "announcement_role" DROP CONSTRAINT "FK_56b0c35e2d1449e987b1c43a779"`);
			await queryRunner.query(`DROP INDEX "public"."090a6806f09446228a3ddd501eb63270"`);
			await queryRunner.query(`DROP INDEX "public"."IDX_53351cbca4544b04937d10f64f98f682"`);
			await queryRunner.query(`DROP INDEX "public"."IDX_56b0c35e2d1449e987b1c43a779b14ce"`);
			await queryRunner.query(`DROP TABLE "announcement_role"`);

			await queryRunner.query(`DROP INDEX "public"."IDX_b2dbc3e04c3443eca1ff9c488e904660"`);
			await queryRunner.query(`ALTER TABLE "announcement" DROP COLUMN "isRoleSpecified"`);
	}
}
