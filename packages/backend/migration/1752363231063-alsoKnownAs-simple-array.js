/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class alsoKnownAsSimpleArray1752363231063 {
	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "alsoKnownAs2" text[];`);
		await queryRunner.query(`UPDATE "user" SET "alsoKnownAs2"=string_to_array("alsoKnownAs", ',');`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alsoKnownAs";`);
		await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "alsoKnownAs2" TO "alsoKnownAs";`);
		await queryRunner.query(`COMMENT ON COLUMN "user"."alsoKnownAs" IS 'URIs the user is known as too';`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user" ADD "alsoKnownAs2" text;`);
		await queryRunner.query(`UPDATE "user" SET "alsoKnownAs2"=array_to_string("alsoKnownAs", ',', '');`);
		await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "alsoKnownAs";`);
		await queryRunner.query(`ALTER TABLE "user" RENAME COLUMN "alsoKnownAs2" TO "alsoKnownAs";`);
		await queryRunner.query(`COMMENT ON COLUMN "user"."alsoKnownAs" IS 'URIs the user is known as too';`);
	}
}
