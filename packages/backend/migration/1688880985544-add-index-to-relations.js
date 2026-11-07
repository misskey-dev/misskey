/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class AddIndexToRelations1688880985544 {
    name = 'AddIndexToRelations1688880985544'

    async up(queryRunner) {
        await queryRunner.query(`CREATE INDEX "IDX_beba993576db0261a15364ea96" ON "registration_ticket" ("createdById") `);
        await queryRunner.query(`CREATE INDEX "IDX_b6f93f2f30bdbb9a5ebdc7c718" ON "registration_ticket" ("usedById") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_b6f93f2f30bdbb9a5ebdc7c718"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_beba993576db0261a15364ea96"`);
    }
}
