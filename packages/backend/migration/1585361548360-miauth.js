/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class miauth1585361548360 {
    constructor() {
        this.name = 'miauth1585361548360';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "access_token" ADD "lastUsedAt" TIMESTAMP WITH TIME ZONE DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "session" character varying(128) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "name" character varying(128) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "description" character varying(512) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "iconUrl" character varying(512) DEFAULT null`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "permission" character varying(64) array NOT NULL DEFAULT '{}'::varchar[]`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD "fetched" boolean NOT NULL DEFAULT false`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP CONSTRAINT "FK_a3ff16c90cc87a82a0b5959e560"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "appId" DROP NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "appId" SET DEFAULT null`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_bf3a053c07d9fb5d87317c56ee" ON "access_token" ("session") `, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD CONSTRAINT "FK_a3ff16c90cc87a82a0b5959e560" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "access_token" DROP CONSTRAINT "FK_a3ff16c90cc87a82a0b5959e560"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_bf3a053c07d9fb5d87317c56ee"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "appId" DROP DEFAULT`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ALTER COLUMN "appId" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" ADD CONSTRAINT "FK_a3ff16c90cc87a82a0b5959e560" FOREIGN KEY ("appId") REFERENCES "app"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "fetched"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "permission"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "iconUrl"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "description"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "name"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "session"`, undefined);
        await queryRunner.query(`ALTER TABLE "access_token" DROP COLUMN "lastUsedAt"`, undefined);
    }
}
