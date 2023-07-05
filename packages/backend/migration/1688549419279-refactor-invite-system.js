export class RefactorInviteSystem1688549419279 {
    name = 'RefactorInviteSystem1688549419279'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "meta" ADD "inviteCodeExpirationTime" integer`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "inviteCodeCreateLimit" integer`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "inviteCodeCreateLimitResetCycle" integer NOT NULL DEFAULT '604800000'`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "pendingUserId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "createdById" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedById" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "UQ_b6f93f2f30bdbb9a5ebdc7c7189" UNIQUE ("usedById")`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "UQ_b6f93f2f30bdbb9a5ebdc7c7189"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedById"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "pendingUserId"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "expiresAt"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "inviteCodeCreateLimitResetCycle"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "inviteCodeCreateLimit"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "inviteCodeExpirationTime"`);
    }
}
