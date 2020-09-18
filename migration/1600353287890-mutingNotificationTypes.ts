import {MigrationInterface, QueryRunner} from "typeorm";

export class mutingNotificationTypes1600353287890 implements MigrationInterface {
    name = 'mutingNotificationTypes1600353287890'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "includingNotificationTypes"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_includingnotificationtypes_enum"`);
        await queryRunner.query(`CREATE TYPE "user_profile_mutingnotificationtypes_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "mutingNotificationTypes" "user_profile_mutingnotificationtypes_enum" array NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "mutingNotificationTypes"`);
        await queryRunner.query(`DROP TYPE "user_profile_mutingnotificationtypes_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."user_profile_includingnotificationtypes_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "includingNotificationTypes" "user_profile_includingnotificationtypes_enum" array`);
    }

}
