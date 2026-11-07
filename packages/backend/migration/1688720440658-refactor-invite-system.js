/*
 * SPDX-FileCopyrightText: syuilo and misskey-project
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class RefactorInviteSystem1688720440658 {
    name = 'RefactorInviteSystem1688720440658'

    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "expiresAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedAt" TIMESTAMP WITH TIME ZONE`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "pendingUserId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "createdById" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD "usedById" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "UQ_b6f93f2f30bdbb9a5ebdc7c7189" UNIQUE ("usedById")`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "FK_beba993576db0261a15364ea96e" FOREIGN KEY ("createdById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" ADD CONSTRAINT "FK_b6f93f2f30bdbb9a5ebdc7c7189" FOREIGN KEY ("usedById") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "FK_b6f93f2f30bdbb9a5ebdc7c7189"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "FK_beba993576db0261a15364ea96e"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP CONSTRAINT "UQ_b6f93f2f30bdbb9a5ebdc7c7189"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedById"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "createdById"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "pendingUserId"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "registration_ticket" DROP COLUMN "expiresAt"`);
    }
}
