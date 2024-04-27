/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RepositoryUrlFromSyuiloToMisskeyDev1708266695091 {
    name = 'RepositoryUrlFromSyuiloToMisskeyDev1708266695091'

    async up(queryRunner) {
        await queryRunner.query(`UPDATE "meta" SET "repositoryUrl" = 'https://github.com/misskey-dev/misskey' WHERE "repositoryUrl" = 'https://github.com/syuilo/misskey'`);
    }

    async down(queryRunner) {
        // no valid down migration
    }
}
