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
		// Fix-up: Sharkey versions in early-mid 2025 could federate with HTTP URLs, which would produce a user with no matching instance.
		// These users are fundamentally broken and can just be removed, which ensures that the FK can create without conflicts.
		// But we must also *preserve* those with a matching registered instance, as FireFish allowed federation over HTTP and some older instances may have fully-populated users.
		await queryRunner.query(`DELETE FROM "user" WHERE "uri" LIKE 'http:%' AND NOT EXISTS (select 1 from "instance" where "instance"."host" = "user"."host")`);

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
