/*
 * SPDX-FileCopyrightText: hazelnoot and other Sharkey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

/**
 * @typedef {import('typeorm').MigrationInterface} MigrationInterface
 */

/**
 * @class
 * @implements {MigrationInterface}
 */
export class AddInstanceForeignKeys1748128176881 {
	name = 'AddInstanceForeignKeys1748128176881'

	async up(queryRunner) {
		// Fix-up: Some older instances have users without a matching instance entry
		await queryRunner.query(`
			INSERT INTO "instance" ("id", "host", "firstRetrievedAt")
			SELECT
					MIN("id"),
					"host",
					COALESCE(MIN("lastFetchedAt"), CURRENT_TIMESTAMP)
			FROM "user"
			WHERE
					"host" IS NOT NULL AND
					NOT EXISTS (select 1 from "instance" where "instance"."host" = "user"."host")
			GROUP BY "host"
		`);

		await queryRunner.query(`ALTER TABLE "user" ADD CONSTRAINT "FK_user_host" FOREIGN KEY ("host") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_note_userHost" FOREIGN KEY ("userHost") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_note_replyUserHost" FOREIGN KEY ("replyUserHost") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "note" ADD CONSTRAINT "FK_note_renoteUserHost" FOREIGN KEY ("renoteUserHost") REFERENCES "instance"("host") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_note_renoteUserHost"`);
		await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_note_replyUserHost"`);
		await queryRunner.query(`ALTER TABLE "note" DROP CONSTRAINT "FK_note_userHost"`);
		await queryRunner.query(`ALTER TABLE "user" DROP CONSTRAINT "FK_user_host"`);
	}
}
