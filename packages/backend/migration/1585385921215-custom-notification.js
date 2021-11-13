"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class customNotification1585385921215 {
    constructor() {
        this.name = 'customNotification1585385921215';
    }
    async up(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notification" ADD "customBody" character varying(2048)`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD "customHeader" character varying(256)`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD "customIcon" character varying(1024)`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD "appAccessTokenId" character varying(32)`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_3b4e96eec8d36a8bbb9d02aa710"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "notifierId" DROP NOT NULL`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."notifierId" IS 'The ID of sender user of the Notification.'`, undefined);
        await queryRunner.query(`ALTER TYPE "public"."notification_type_enum" RENAME TO "notification_type_enum_old"`, undefined);
        await queryRunner.query(`CREATE TYPE "notification_type_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "notification_type_enum" USING "type"::"text"::"notification_type_enum"`, undefined);
        await queryRunner.query(`DROP TYPE "notification_type_enum_old"`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."type" IS 'The type of the Notification.'`, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_3b4e96eec8d36a8bbb9d02aa71" ON "notification" ("notifierId") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_33f33cc8ef29d805a97ff4628b" ON "notification" ("type") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_080ab397c379af09b9d2169e5b" ON "notification" ("isRead") `, undefined);
        await queryRunner.query(`CREATE INDEX "IDX_e22bf6bda77b6adc1fd9e75c8c" ON "notification" ("appAccessTokenId") `, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_3b4e96eec8d36a8bbb9d02aa710" FOREIGN KEY ("notifierId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_e22bf6bda77b6adc1fd9e75c8c9" FOREIGN KEY ("appAccessTokenId") REFERENCES "access_token"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
    }
    async down(queryRunner) {
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_e22bf6bda77b6adc1fd9e75c8c9"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP CONSTRAINT "FK_3b4e96eec8d36a8bbb9d02aa710"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_e22bf6bda77b6adc1fd9e75c8c"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_080ab397c379af09b9d2169e5b"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_33f33cc8ef29d805a97ff4628b"`, undefined);
        await queryRunner.query(`DROP INDEX "IDX_3b4e96eec8d36a8bbb9d02aa71"`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."type" IS ''`, undefined);
        await queryRunner.query(`CREATE TYPE "notification_type_enum_old" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited')`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "type" TYPE "notification_type_enum_old" USING "type"::"text"::"notification_type_enum_old"`, undefined);
        await queryRunner.query(`DROP TYPE "notification_type_enum"`, undefined);
        await queryRunner.query(`ALTER TYPE "notification_type_enum_old" RENAME TO  "notification_type_enum"`, undefined);
        await queryRunner.query(`COMMENT ON COLUMN "notification"."notifierId" IS ''`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ALTER COLUMN "notifierId" SET NOT NULL`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" ADD CONSTRAINT "FK_3b4e96eec8d36a8bbb9d02aa710" FOREIGN KEY ("notifierId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "appAccessTokenId"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "customIcon"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "customHeader"`, undefined);
        await queryRunner.query(`ALTER TABLE "notification" DROP COLUMN "customBody"`, undefined);
    }
}
exports.customNotification1585385921215 = customNotification1585385921215;
