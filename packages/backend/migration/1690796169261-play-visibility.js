/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PlayVisibility1689102832143 {
		name = 'PlayVisibility1690796169261'

		async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "public"."flash" ADD "visibility" character varying(512) DEFAULT 'public'`, undefined);
		}
		async down(queryRunner) {
			await queryRunner.query(`ALTER TABLE "public"."flash" DROP COLUMN "visibility"`, undefined);
		}
}
