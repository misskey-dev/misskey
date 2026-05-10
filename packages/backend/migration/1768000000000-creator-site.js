/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class CreatorSite1768000000000 {
	name = 'CreatorSite1768000000000'

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "creator_site" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "title" character varying(256), "catchphrase" character varying(1024), "commissionStatus" character varying(128), "collabStatus" character varying(128), "fanartStatus" character varying(128), "guidelineUrl" character varying(1024), "guidelineText" character varying(2048), "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_creator_site_id" PRIMARY KEY ("id"))`);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_creator_site_userId" ON "creator_site" ("userId")`);
		await queryRunner.query(`ALTER TABLE "creator_site" ADD CONSTRAINT "FK_creator_site_userId" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "creator_site" DROP CONSTRAINT "FK_creator_site_userId"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_creator_site_userId"`);
		await queryRunner.query(`DROP TABLE "creator_site"`);
	}
}
