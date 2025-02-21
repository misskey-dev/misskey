/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class notesvisibility1702718871542 {
    constructor() {
        this.name = 'notesvisibility1702718871542';
    }

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."user_profile_notesVisibility_enum" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "notesVisibility" "public"."user_profile_notesVisibility_enum" NOT NULL DEFAULT 'private'`);
        await queryRunner.query(`UPDATE "user_profile" SET "notesVisibility" = 'private'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "notesVisibility"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_notesVisibility_enum"`);
    }
}

