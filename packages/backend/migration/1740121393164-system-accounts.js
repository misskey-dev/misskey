/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class SystemAccounts1740121393164 {
    name = 'SystemAccounts1740121393164'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "system_account" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "type" character varying(256) NOT NULL, CONSTRAINT "PK_edb56f4aaf9ddd50ee556da97ba" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_41a3c87a37aea616ee459369e1" ON "system_account" ("userId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_c362033aee0ea51011386a5a7e" ON "system_account" ("type") `);
        await queryRunner.query(`ALTER TABLE "system_account" ADD CONSTRAINT "FK_41a3c87a37aea616ee459369e12" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

				const instanceActor = await queryRunner.query(`SELECT "id" FROM "user" WHERE "username" = 'instance.actor'`);
				if (instanceActor.length > 0) {
					await queryRunner.query(`INSERT INTO "system_account" ("id", "userId", "type") VALUES ('${instanceActor[0].id}', '${instanceActor[0].id}', 'actor')`);
				}

				const relayActor = await queryRunner.query(`SELECT "id" FROM "user" WHERE "username" = 'relay.actor'`);
				if (relayActor.length > 0) {
					await queryRunner.query(`INSERT INTO "system_account" ("id", "userId", "type") VALUES ('${relayActor[0].id}', '${relayActor[0].id}', 'relay')`);
				}

				const meta = await queryRunner.query(`SELECT "proxyAccountId" FROM "meta" ORDER BY "id" DESC LIMIT 1`);
				if (!meta && meta.length >= 1 && meta[0].proxyAccountId) {
					await queryRunner.query(`INSERT INTO "system_account" ("id", "userId", "type") VALUES ('${meta[0].proxyAccountId}', '${meta[0].proxyAccountId}', 'proxy')`);
				}
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "system_account" DROP CONSTRAINT "FK_41a3c87a37aea616ee459369e12"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c362033aee0ea51011386a5a7e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_41a3c87a37aea616ee459369e1"`);
        await queryRunner.query(`DROP TABLE "system_account"`);
    }
}
