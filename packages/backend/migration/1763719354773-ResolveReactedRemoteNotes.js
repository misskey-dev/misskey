/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class ResolveReactedRemoteNotes1763719354773 {
    name = 'ResolveReactedRemoteNotes1763719354773'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "resolveRemoteReactedNotes" boolean NOT NULL DEFAULT false`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "resolveRemoteReactedNotes"`);
    }
}
