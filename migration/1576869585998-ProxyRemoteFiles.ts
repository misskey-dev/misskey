import {MigrationInterface, QueryRunner} from "typeorm";

export class ProxyRemoteFiles1576869585998 implements MigrationInterface {
    name = 'ProxyRemoteFiles1576869585998'

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" ADD "proxyRemoteFiles" boolean NOT NULL DEFAULT false`, undefined);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`ALTER TABLE "meta" DROP COLUMN "proxyRemoteFiles"`, undefined);
    }

}
