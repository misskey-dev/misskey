/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CustomEmojiCategory1571220798684 {
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" ADD "category" character varying(128)`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "emoji" DROP COLUMN "category"`, undefined);
    }
}
