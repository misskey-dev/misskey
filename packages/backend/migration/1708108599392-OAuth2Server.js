/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class OAuth2Server1708108599392 {
	constructor() {
			this.name = 'OAuth2Server1708108599392';
	}

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "oauth2_server" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "title" character varying(256) NOT NULL, "description" character varying(1024), "clientId" character varying(256), "clientSecret" character varying(256), "authorizeUrl" character varying(1024), "tokenUrl" character varying(1024), "signUpUrl" character varying(1024), "scope" character varying(256), "profileUrl" character varying(1024), "idPath" character varying(256), "namePath" character varying(256), "emailPath" character varying(256), "markEmailAsVerified" boolean NOT NULL DEFAULT false, "usernamePath" character varying(256), "allowSignUp" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_001d9b648e6f6fbd4cde98cdd7c" PRIMARY KEY ("id")); COMMENT ON COLUMN "oauth2_server"."updatedAt" IS 'The updated date of the OAuth2Client.'`);
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP TABLE "oauth2_server"`);
	}
}
