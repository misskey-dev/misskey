/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ffVisibility1702718871541 {
	constructor() {
			this.name = 'ffVisibility1702718871541';
	}
	async up(queryRunner) {
		await queryRunner.query(`CREATE TYPE "public"."user_profile_followingvisibility_enum" AS ENUM('public', 'followers', 'private')`);
		await queryRunner.query(`CREATE CAST ("public"."user_profile_ffvisibility_enum" AS "public"."user_profile_followingvisibility_enum") WITH INOUT AS ASSIGNMENT`);
		await queryRunner.query(`CREATE TYPE "public"."user_profile_followersVisibility_enum" AS ENUM('public', 'followers', 'private')`);
		await queryRunner.query(`CREATE CAST ("public"."user_profile_ffvisibility_enum" AS "public"."user_profile_followersVisibility_enum") WITH INOUT AS ASSIGNMENT`);
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "followingVisibility" "public"."user_profile_followingvisibility_enum" NOT NULL DEFAULT 'public'`);
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "followersVisibility" "public"."user_profile_followersVisibility_enum" NOT NULL DEFAULT 'public'`);
		await queryRunner.query(`UPDATE "user_profile" SET "followingVisibility" = "ffVisibility"`);
		await queryRunner.query(`UPDATE "user_profile" SET "followersVisibility" = "ffVisibility"`);
		await queryRunner.query(`DROP CAST ("public"."user_profile_ffvisibility_enum" AS "public"."user_profile_followersVisibility_enum")`);
		await queryRunner.query(`DROP CAST ("public"."user_profile_ffvisibility_enum" AS "public"."user_profile_followingvisibility_enum")`);
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "ffVisibility"`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_ffvisibility_enum"`);
	}
	async down(queryRunner) {
		await queryRunner.query(`CREATE TYPE "public"."user_profile_ffvisibility_enum" AS ENUM('public', 'followers', 'private')`);
		await queryRunner.query(`ALTER TABLE "user_profile" ADD "ffVisibility" "public"."user_profile_ffvisibility_enum" NOT NULL DEFAULT 'public'`);
		await queryRunner.query(`CREATE CAST ("public"."user_profile_followingvisibility_enum" AS "public"."user_profile_ffvisibility_enum") WITH INOUT AS ASSIGNMENT`);
		await queryRunner.query(`UPDATE "user_profile" SET ffVisibility = "user_profile"."followingVisibility"`);
		await queryRunner.query(`DROP CAST ("public"."user_profile_followingvisibility_enum" AS "public"."user_profile_ffvisibility_enum")`);
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "followersVisibility"`);
		await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "followingVisibility"`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_followersVisibility_enum"`);
		await queryRunner.query(`DROP TYPE "public"."user_profile_followingvisibility_enum"`);
	}
}
