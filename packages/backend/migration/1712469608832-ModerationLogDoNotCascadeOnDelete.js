/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ModerationLogDoNotCascadeOnDelete1712469608832 {

		name = 'ModerationLogDoNotCascadeOnDelete1712469608832'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "moderation_log" DROP CONSTRAINT "FK_a08ad074601d204e0f69da9a954"`)
        await queryRunner.query(`ALTER TABLE "moderation_log" ADD CONSTRAINT "FK_a08ad074601d204e0f69da9a954" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "moderation_log" DROP CONSTRAINT "FK_a08ad074601d204e0f69da9a954"`)
			await queryRunner.query(`ALTER TABLE "moderation_log" ADD CONSTRAINT "FK_a08ad074601d204e0f69da9a954" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
