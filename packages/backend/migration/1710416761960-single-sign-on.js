export class SingleSignOn1710416761960 {
    name = 'SingleSignOn1710416761960'

    async up(queryRunner) {
        await queryRunner.query(`CREATE TYPE "public"."sso_service_provider_type_enum" AS ENUM('saml', 'jwt')`);
        await queryRunner.query(`CREATE TABLE "sso_service_provider" ("id" character varying(36) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "name" character varying(256), "type" "public"."sso_service_provider_type_enum" NOT NULL, "issuer" character varying(512) NOT NULL, "audience" character varying(512) array NOT NULL DEFAULT '{}', "acsUrl" character varying(512) NOT NULL, "publicKey" character varying(4096) NOT NULL, "privateKey" character varying(4096), "signatureAlgorithm" character varying(100) NOT NULL, "cipherAlgorithm" character varying(100), "wantAuthnRequestsSigned" boolean NOT NULL DEFAULT false, "wantAssertionsSigned" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_0e5fff64534026e48e1c248991a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_86eee7fa4ae68e4a558dc50961" ON "sso_service_provider" ("createdAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_86eee7fa4ae68e4a558dc50961"`);
        await queryRunner.query(`DROP TABLE "sso_service_provider"`);
        await queryRunner.query(`DROP TYPE "public"."sso_service_provider_type_enum"`);
    }
}
