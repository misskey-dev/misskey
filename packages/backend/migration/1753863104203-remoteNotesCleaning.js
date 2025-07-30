/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RemoteNotesCleaning1753863104203 {
    name = 'RemoteNotesCleaning1753863104203'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableRemoteNotesCleaning" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "remoteNotesCleaningMaxDurationInMinutes" integer NOT NULL DEFAULT '60'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "remoteNotesCleaningMaxDurationInMinutes"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableRemoteNotesCleaning"`);
    }
}
