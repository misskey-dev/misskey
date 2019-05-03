import {MigrationInterface, QueryRunner} from "typeorm";

export class UserProfile1556746559567 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "user_profile" SET github = FALSE`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "githubId"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "githubId" VARCHAR(64)`);
        await queryRunner.query(`UPDATE "user_profile" SET discord = FALSE`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordExpiresDate"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "discordExpiresDate" VARCHAR(64)`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`UPDATE "user_profile" SET github = FALSE`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "githubId"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "githubId" INTEGER`);
        await queryRunner.query(`UPDATE "user_profile" SET discord = FALSE`);
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "discordExpiresDate"`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD COLUMN "discordExpiresDate" INTEGER`);
    }

}
