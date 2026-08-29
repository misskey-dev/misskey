/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

const isConcurrentIndexMigrationEnabled = process.env.MISSKEY_MIGRATION_CREATE_INDEX_CONCURRENTLY === '1';

export class NoteQuoteAuthorization1787985291487 {
	name = 'NoteQuoteAuthorization1787985291487';
	transaction = isConcurrentIndexMigrationEnabled ? false : undefined;

	async up(queryRunner) {
		await queryRunner.query(`ALTER TABLE "note" ADD "quoteAuthorizationUri" character varying(1024)`);
		await queryRunner.query(`COMMENT ON COLUMN "note"."quoteAuthorizationUri" IS 'FEP-044f QuoteAuthorization URI attached to this quote note. null when not stamped.'`);
		await queryRunner.query(`ALTER TABLE "note" ADD "quoteRejected" boolean NOT NULL DEFAULT false`);
		await queryRunner.query(`COMMENT ON COLUMN "note"."quoteRejected" IS 'Whether the quote of this note was rejected or revoked by the quoted note author.'`);

		if (isConcurrentIndexMigrationEnabled) {
			await queryRunner.query(`DROP INDEX IF EXISTS "IDX_NOTE_QUOTE_AUTHORIZATION_URI"`);
			await queryRunner.query(`CREATE INDEX CONCURRENTLY "IDX_NOTE_QUOTE_AUTHORIZATION_URI" ON "note" ("quoteAuthorizationUri") WHERE "quoteAuthorizationUri" IS NOT NULL`);
		} else {
			await queryRunner.query(`CREATE INDEX "IDX_NOTE_QUOTE_AUTHORIZATION_URI" ON "note" ("quoteAuthorizationUri") WHERE "quoteAuthorizationUri" IS NOT NULL`);
		}
	}

	async down(queryRunner) {
		await queryRunner.query(`DROP INDEX IF EXISTS "IDX_NOTE_QUOTE_AUTHORIZATION_URI"`);
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "quoteRejected"`);
		await queryRunner.query(`ALTER TABLE "note" DROP COLUMN "quoteAuthorizationUri"`);
	}
}
