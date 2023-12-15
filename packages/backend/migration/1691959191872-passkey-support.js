/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class PasskeySupport1691959191872 {
	name = 'PasskeySupport1691959191872'

	async up(queryRunner) {
			await queryRunner.query(`ALTER TABLE "user_security_key" ADD "counter" bigint NOT NULL DEFAULT '0'`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."counter" IS 'The number of times the UserSecurityKey was validated.'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" ADD "credentialDeviceType" character varying(32)`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."credentialDeviceType" IS 'The type of Backup Eligibility in authenticator data'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" ADD "credentialBackedUp" boolean`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."credentialBackedUp" IS 'Whether or not the credential has been backed up'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" ADD "transports" character varying(32) array`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."transports" IS 'The type of the credential returned by the browser'`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."publicKey" IS 'The public key of the UserSecurityKey, hex-encoded.'`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."lastUsed" IS 'Timestamp of the last time the UserSecurityKey was used.'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" ALTER COLUMN "lastUsed" SET DEFAULT now()`);
			await queryRunner.query(`UPDATE "user_security_key" SET "id" = REPLACE(REPLACE(REPLACE(REPLACE(ENCODE(DECODE("id", 'hex'), 'base64'), E'\\n', ''), '+', '-'), '/', '_'), '=', ''), "publicKey" = REPLACE(REPLACE(REPLACE(REPLACE(ENCODE(DECODE("publicKey", 'hex'), 'base64'), E'\\n', ''), '+', '-'), '/', '_'), '=', '')`);
			await queryRunner.query(`ALTER TABLE "attestation_challenge" DROP CONSTRAINT "FK_f1a461a618fa1755692d0e0d592"`);
			await queryRunner.query(`DROP INDEX "IDX_47efb914aed1f72dd39a306c7b"`);
			await queryRunner.query(`DROP INDEX "IDX_f1a461a618fa1755692d0e0d59"`);
			await queryRunner.query(`DROP TABLE "attestation_challenge"`);
	}

	async down(queryRunner) {
			await queryRunner.query(`CREATE TABLE "attestation_challenge" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "challenge" character varying(64) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "registrationChallenge" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d0ba6786e093f1bcb497572a6b5" PRIMARY KEY ("id", "userId"))`);
			await queryRunner.query(`CREATE INDEX "IDX_f1a461a618fa1755692d0e0d59" ON "attestation_challenge" ("userId") `);
			await queryRunner.query(`CREATE INDEX "IDX_47efb914aed1f72dd39a306c7b" ON "attestation_challenge" ("challenge") `);
			await queryRunner.query(`ALTER TABLE "attestation_challenge" ADD CONSTRAINT "FK_f1a461a618fa1755692d0e0d592" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
			await queryRunner.query(`COMMENT ON COLUMN "attestation_challenge"."challenge" IS 'Hex-encoded sha256 hash of the challenge.'`);
			await queryRunner.query(`COMMENT ON COLUMN "attestation_challenge"."createdAt" IS 'The date challenge was created for expiry purposes.'`);
			await queryRunner.query(`COMMENT ON COLUMN "attestation_challenge"."registrationChallenge" IS 'Indicates that the challenge is only for registration purposes if true to prevent the challenge for being used as authentication.'`);
			await queryRunner.query(`UPDATE "user_security_key" SET "id" = ENCODE(DECODE(REPLACE(REPLACE("id" || CASE WHEN LENGTH("id") % 4 = 2 THEN '==' WHEN LENGTH("id") % 4 = 3 THEN '=' ELSE '' END, '-', '+'), '_', '/'), 'base64'), 'hex'), "publicKey" = ENCODE(DECODE(REPLACE(REPLACE("publicKey" || CASE WHEN LENGTH("publicKey") % 4 = 2 THEN '==' WHEN LENGTH("publicKey") % 4 = 3 THEN '=' ELSE '' END, '-', '+'), '_', '/'), 'base64'), 'hex')`);
			await queryRunner.query(`ALTER TABLE "user_security_key" ALTER COLUMN "lastUsed" DROP DEFAULT`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."lastUsed" IS 'The date of the last time the UserSecurityKey was successfully validated.'`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."publicKey" IS 'Variable-length public key used to verify attestations (hex-encoded).'`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."transports" IS 'The type of the credential returned by the browser'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" DROP COLUMN "transports"`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."credentialBackedUp" IS 'Whether or not the credential has been backed up'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" DROP COLUMN "credentialBackedUp"`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."credentialDeviceType" IS 'The type of Backup Eligibility in authenticator data'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" DROP COLUMN "credentialDeviceType"`);
			await queryRunner.query(`COMMENT ON COLUMN "user_security_key"."counter" IS 'The number of times the UserSecurityKey was validated.'`);
			await queryRunner.query(`ALTER TABLE "user_security_key" DROP COLUMN "counter"`);
	}
}
