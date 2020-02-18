import {MigrationInterface, QueryRunner} from "typeorm";

export class featuredInjecttion1582019042083 implements MigrationInterface {
    name = 'featuredInjecttion1582019042083'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_profile" ADD "injectFeaturedNote" boolean NOT NULL DEFAULT true`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "user_profile" DROP COLUMN "injectFeaturedNote"`, undefined);
    }

}
