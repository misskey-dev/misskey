import {MigrationInterface, QueryRunner} from "typeorm";

export class TalkFederationId1576269851876 implements MigrationInterface {
    name = 'TalkFederationId1576269851876'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "messaging_message" ADD "uri" character varying(512)`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "messaging_message" DROP COLUMN "uri"`, undefined);
    }

}
