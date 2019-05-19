import {MigrationInterface, QueryRunner} from "typeorm";

export class UserListJoining1558266512381 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_90f7da835e4c10aca6853621e1" ON "user_list_joining" ("userId", "userListId") `);
    }

    public async down(queryRunner: QueryRunner): Promise<any> {
        await queryRunner.query(`DROP INDEX "IDX_90f7da835e4c10aca6853621e1"`);
    }

}
