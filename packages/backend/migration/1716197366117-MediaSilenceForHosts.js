/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class MediaSilenceForHosts1716197366117 {
    name = 'MediaSilenceForHosts1716197366117'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "mediaSilencedHosts" character varying(1024) array NOT NULL DEFAULT '{}'`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "mediaSilencedHosts"`);
    }
}
