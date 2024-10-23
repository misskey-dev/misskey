/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MakeNotesHiddenBefore1729486255072 {
    name = 'MakeNotesHiddenBefore1729486255072'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" ADD "makeNotesFollowersOnlyBefore" integer`);
        await queryRunner.query(`ALTER TABLE "user" ADD "makeNotesHiddenBefore" integer`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "makeNotesHiddenBefore"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "makeNotesFollowersOnlyBefore"`);
    }
}
