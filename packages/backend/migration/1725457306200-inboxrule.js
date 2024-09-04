<!--
SPDX-FileCopyrightText: Type4ny-project
SPDX-License-Identifier: AGPL-3.0-only
-->

export class Inboxrule1725457306200 {
	name = 'Inboxrule1725457306200';

	async up(queryRunner) {
		await queryRunner.query('CREATE TABLE "inbox_rule" ("id" character varying(32) NOT NULL, "name" character varying(128) NOT NULL, "description" character varying(256) NOT NULL, "condFormula" jsonb NOT NULL DEFAULT \'{}\', "action" jsonb NOT NULL, CONSTRAINT "PK_cb50481ac6e8176c51f004c9456" PRIMARY KEY ("id"))');
	}

	async down(queryRunner) {
		await queryRunner.query('DROP TABLE "inbox_rule"');
	}
}
