/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RepositoryUrlVmimiRelayTimeline1716641282089 {
    name = 'RepositoryUrlVmimiRelayTimeline1716641282089'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "repositoryUrl" = 'https://github.com/anatawa12/misskey/tree/vmimi-relay-timeline-releases?tab=readme-ov-file#vmimi-relay-timeline'`);
        await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://github.com/anatawa12/misskey/tree/vmimi-relay-timeline-releases?tab=readme-ov-file#vmimi-relay-timeline'`);
    }

    async down(queryRunner) {
        // no valid down migration for repositoryUrl value
         await queryRunner.query(`ALTER TABLE "meta" ALTER COLUMN "repositoryUrl" SET DEFAULT 'https://github.com/misskey-dev/misskey'`);
    }
}
