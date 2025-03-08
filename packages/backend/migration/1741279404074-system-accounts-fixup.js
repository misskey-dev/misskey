/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SystemAccounts1741279404074 {
    name = 'SystemAccounts1741279404074'

    async up(queryRunner) {
        const instanceActor = await queryRunner.query(`SELECT "id" FROM "user" WHERE "username" = 'instance.actor' AND "host" IS NULL AND "id" NOT IN (SELECT "userId" FROM "system_account" WHERE "type" = 'actor')`);
        if (instanceActor.length > 0) {
            console.warn('instance.actor was incorrect, updating...');
            await queryRunner.query(`UPDATE "system_account" SET "id" = '${instanceActor[0].id}', "userId" = '${instanceActor[0].id}' WHERE "type" = 'actor'`);
        }

        const relayActor = await queryRunner.query(`SELECT "id" FROM "user" WHERE "username" = 'relay.actor' AND "host" IS NULL AND "id" NOT IN (SELECT "userId" FROM "system_account" WHERE "type" = 'relay')`);
        if (relayActor.length > 0) {
            console.warn('relay.actor was incorrect, updating...');
            await queryRunner.query(`UPDATE "system_account" SET "id" = '${relayActor[0].id}', "userId" = '${relayActor[0].id}' WHERE "type" = 'relay'`);
        }
    }

    async down(queryRunner) {
        // fixup migration, no down migration
    }
}
