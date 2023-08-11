export class roleAssignmentExpiresAt1677570181236 {
    name = 'roleAssignmentExpiresAt1677570181236'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "role_assignment" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`CREATE INDEX "IDX_539b6c08c05067599743bb6389" ON "role_assignment" ("expiresAt") `);
    }

    async down(queryRunner) {
        await queryRunner.query(`DROP INDEX "public"."IDX_539b6c08c05067599743bb6389"`);
        await queryRunner.query(`ALTER TABLE "role_assignment" DROP COLUMN "expiresAt"`);
    }
}
