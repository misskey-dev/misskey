/*
 * SPDX-FileCopyrightText: syuilo and other misskey contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 */

export class userGroupInvitation1581526429287 {
    constructor() {
        this.name = 'userGroupInvitation1581526429287';
    }
    async up(queryRunner) {
        await queryRunner.query(`CREATE TABLE "user_group_invitation" ("id" character varying(32) NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL, "userId" character varying(32) NOT NULL, "userGroupId" character varying(32) NOT NULL, CONSTRAINT "PK_160c63ec02bf23f6a5c5e8140d6" PRIMARY KEY ("id"))`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_bfbc6305547539369fe73eb144" ON "user_group_invitation" ("userId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_5cc8c468090e129857e9fecce5" ON "user_group_invitation" ("userGroupId") `, undefined);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_e9793f65f504e5a31fbaedbf2f" ON "user_group_invitation" ("userId", "userGroupId") `, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD "userGroupInvitationId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`, undefined);
        await queryRunner.query(`CREATE TYPE "notification_type_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited')`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "notification_type_enum" USING "type"::"text"::"notification_type_enum"`, undefined);
        await queryRunner.query(`DROP TYPE "notification_type_enum_old"`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."type" IS 'The type of the Notification.'`, undefined);
        await queryRunner.query(`ALTER TABLE "user_group_invitation" ADD CONSTRAINT "FK_bfbc6305547539369fe73eb144a" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "user_group_invitation" ADD CONSTRAINT "FK_5cc8c468090e129857e9fecce5a" FOREIGN KEY ("userGroupId") REFERENCES "user_group"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_8fe87814e978053a53b1beb7e98" FOREIGN KEY ("userGroupInvitationId") REFERENCES "user_group_invitation"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_8fe87814e978053a53b1beb7e98"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_group_invitation" DROP CONSTRAINT "FK_5cc8c468090e129857e9fecce5a"`, undefined);
        await queryRunner.query(`ALTER TABLE "user_group_invitation" DROP CONSTRAINT "FK_bfbc6305547539369fe73eb144a"`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."type" IS ''`, undefined);
        await queryRunner.query(`CREATE TYPE "notification_type_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted')`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "notification_type_enum_old" USING "type"::"text"::"notification_type_enum_old"`, undefined);
        await queryRunner.query(`DROP TYPE "notification_type_enum"`, undefined);
        await queryRunner.query(`ALTER TYPE "notification_type_enum_old" RENAME TO  "notification_type_enum"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "userGroupInvitationId"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e9793f65f504e5a31fbaedbf2f"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_5cc8c468090e129857e9fecce5"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_bfbc6305547539369fe73eb144"`, undefined);
        await queryRunner.query(`DROP TABLE "user_group_invitation"`, undefined);
    }
}
