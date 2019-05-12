import {MigrationInterface, QueryRunner} from "typeorm";

export class AddExternalUserRecommendationSettings1557642825864 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "enableExternalUserRecommendation" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "externalUserRecommendationEngine" character varying(1024)`);
        await queryRunner.query(`ALTER TABLE "meta" ADD "externalUserRecommendationTimeout" integer NOT NULL DEFAULT 60000`);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "externalUserRecommendationTimeout"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "externalUserRecommendationEngine"`);
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "enableExternalUserRecommendation"`);
    }

}
