import {MigrationInterface, QueryRunner} from "typeorm";

export class IncludingNotificationTypes1597236229720 implements MigrationInterface {
    name = 'IncludingNotificationTypes1597236229720'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "user_profile_includingnotificationtypes_enum" AS ENUM('follow', 'mention', 'reply', 'renote', 'quote', 'reaction', 'pollVote', 'receiveFollowRequest', 'followRequestAccepted', 'groupInvited', 'app')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "includingNotificationTypes" "user_profile_includingnotificationtypes_enum" array`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "includingNotificationTypes"`);
        await queryRunner.query(`DROP TYPE "user_profile_includingnotificationtypes_enum"`);
    }

}
