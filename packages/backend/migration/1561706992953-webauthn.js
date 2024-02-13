/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class webauthn1561706992953 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "attestation_challenge" ("id" character varying(32) NOT NULL, "userId" character varying(32) NOT NULL, "challenge" character varying(64) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "registrationChallenge" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d0ba6786e093f1bcb497572a6b5" PRIMARY KEY ("id", "userId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f1a461a618fa1755692d0e0d59" ON "attestation_challenge" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_47efb914aed1f72dd39a306c7b" ON "attestation_challenge" ("challenge") `);
        await queryRunner.query(`CREATE TABLE "user_security_key" ("id" character varying NOT NULL, "userId" character varying(32) NOT NULL, "publicKey" character varying NOT NULL, "lastUsed" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(30) NOT NULL, CONSTRAINT "PK_3e508571121ab39c5f85d10c166" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ff9ca3b5f3ee3d0681367a9b44" ON "user_security_key" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_0d7718e562dcedd0aa5cf2c9f7" ON "user_security_key" ("publicKey") `);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "securityKeysAvailable" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "attestation_challenge" ADD CONSTRAINT "FK_f1a461a618fa1755692d0e0d592" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_security_key" ADD CONSTRAINT "FK_ff9ca3b5f3ee3d0681367a9b447" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_security_key" DROP CONSTRAINT "FK_ff9ca3b5f3ee3d0681367a9b447"`);
        await queryRunner.query(`ALTER TABLE "attestation_challenge" DROP CONSTRAINT "FK_f1a461a618fa1755692d0e0d592"`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "securityKeysAvailable"`);
        await queryRunner.query(`DROP INDEX "IDX_0d7718e562dcedd0aa5cf2c9f7"`);
        await queryRunner.query(`DROP INDEX "IDX_ff9ca3b5f3ee3d0681367a9b44"`);
        await queryRunner.query(`DROP TABLE "user_security_key"`);
        await queryRunner.query(`DROP INDEX "IDX_47efb914aed1f72dd39a306c7b"`);
        await queryRunner.query(`DROP INDEX "IDX_f1a461a618fa1755692d0e0d59"`);
        await queryRunner.query(`DROP TABLE "attestation_challenge"`);
    }
}
