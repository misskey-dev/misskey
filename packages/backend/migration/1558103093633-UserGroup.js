/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class UserGroup1558103093633 {
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_group" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "name" character varying(256) NOT NULL, "userId" character varying(32) NOT NULL, "isPrivate" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_3c29fba6fe013ec8724378ce7c9" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_20e30aa35180e317e133d75316" ON "user_group" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_3d6b372788ab01be58853003c9" ON "user_group" ("userId") `);
        await queryRunner.query(`CREATE TABLE "user_group_joining" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "userGroupId" character varying(32) NOT NULL, CONSTRAINT "PK_15f2425885253c5507e1599cfe7" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f3a1b4bd0c7cabba958a0c0b23" ON "user_group_joining" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_67dc758bc0566985d1b3d39986" ON "user_group_joining" ("userGroupId") `);
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD "groupId" character varying(32)`);
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD "reads" character varying(32) array NOT NULL DEFAULT '{}'::varchar[]`);
        await queryRunner.query(`ALTER TABLE "messaging_message" ALTER COLUMN "recipientId" DROP NOT NULL`);
        await queryRunner.query(`COMMENT ON COLUMN "messaging_message"."recipientId" IS 'The recipient user ID.'`);
        await queryRunner.query(`CREATE INDEX "IDX_2c4be03b446884f9e9c502135b" ON "messaging_message" ("groupId") `);
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD CONSTRAINT "FK_2c4be03b446884f9e9c502135be" FOREIGN KEY ("groupId") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group" ADD CONSTRAINT "FK_3d6b372788ab01be58853003c93" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group_joining" ADD CONSTRAINT "FK_f3a1b4bd0c7cabba958a0c0b231" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "user_group_joining" ADD CONSTRAINT "FK_67dc758bc0566985d1b3d399865" FOREIGN KEY ("userGroupId") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "user_group_joining" DROP CONSTRAINT "FK_67dc758bc0566985d1b3d399865"`);
        await queryRunner.query(`ALTER TABLE "user_group_joining" DROP CONSTRAINT "FK_f3a1b4bd0c7cabba958a0c0b231"`);
        await queryRunner.query(`ALTER TABLE "user_group" DROP CONSTRAINT "FK_3d6b372788ab01be58853003c93"`);
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP CONSTRAINT "FK_2c4be03b446884f9e9c502135be"`);
        await queryRunner.query(`DROP INDEX "IDX_2c4be03b446884f9e9c502135b"`);
        await queryRunner.query(`COMMENT ON COLUMN "messaging_message"."recipientId" IS ''`);
        await queryRunner.query(`ALTER TABLE "messaging_message" ALTER COLUMN "recipientId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP COLUMN "reads"`);
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP COLUMN "groupId"`);
        await queryRunner.query(`DROP INDEX "IDX_67dc758bc0566985d1b3d39986"`);
        await queryRunner.query(`DROP INDEX "IDX_f3a1b4bd0c7cabba958a0c0b23"`);
        await queryRunner.query(`DROP TABLE "user_group_joining"`);
        await queryRunner.query(`DROP INDEX "IDX_3d6b372788ab01be58853003c9"`);
        await queryRunner.query(`DROP INDEX "IDX_20e30aa35180e317e133d75316"`);
        await queryRunner.query(`DROP TABLE "user_group"`);
    }
}
