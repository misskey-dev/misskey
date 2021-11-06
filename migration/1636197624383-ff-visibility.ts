import {MigrationInterface, QueryRunner} from "typeorm";

export class ffVisibility1636197624383 implements MigrationInterface {
    name = 'ffVisibility1636197624383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."user_profile_ffvisibility_enum" AS ENUM('public', 'followers', 'private')`);
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "ffVisibility" "public"."user_profile_ffvisibility_enum" NOT NULL DEFAULT 'public'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "ffVisibility"`);
        await queryRunner.query(`DROP TYPE "public"."user_profile_ffvisibility_enum"`);
    }

}
