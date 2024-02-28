export class UserIntegration1708668747168 {
	constructor() {
		this.name = 'UserIntegration1708668747168'
	}

	async up(queryRunner) {
		await queryRunner.query(`CREATE TABLE "user_integration" ("id" character varying(32) NOT NULL, "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "serverId" character varying(32) NOT NULL, CONSTRAINT "PK_40932041bfccddf1ed92667864b" PRIMARY KEY ("id")); COMMENT ON COLUMN "user_integration"."updatedAt" IS 'The updated date of the OAuth2Client.'`);
		await queryRunner.query(`CREATE INDEX "IDX_f65f2e8ad23133abd53e72d9ca" ON "user_integration" ("userId") `);
		await queryRunner.query(`CREATE INDEX "IDX_303c02c0bad7cd31562f057f6e" ON "user_integration" ("serverId") `);
		await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fb5c197a22d9dffed0be41b603" ON "user_integration" ("userId", "serverId") `);
		await queryRunner.query(`ALTER TABLE "user_integration" ADD CONSTRAINT "FK_f65f2e8ad23133abd53e72d9ca0" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
		await queryRunner.query(`ALTER TABLE "user_integration" ADD CONSTRAINT "FK_303c02c0bad7cd31562f057f6ef" FOREIGN KEY ("serverId") REFERENCES "oauth2_server"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
	}

	async down(queryRunner) {
		await queryRunner.query(`ALTER TABLE "user_integration" DROP CONSTRAINT "FK_303c02c0bad7cd31562f057f6ef"`);
		await queryRunner.query(`ALTER TABLE "user_integration" DROP CONSTRAINT "FK_f65f2e8ad23133abd53e72d9ca0"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_fb5c197a22d9dffed0be41b603"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_303c02c0bad7cd31562f057f6e"`);
		await queryRunner.query(`DROP INDEX "public"."IDX_f65f2e8ad23133abd53e72d9ca"`);
		await queryRunner.query(`DROP TABLE "user_integration"`);
	}
}
